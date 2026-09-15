const CONTAINER_PRESETS = {
    '20GP': { length: 5900, width: 2350, height: 2390, weightLimit: 27000 },
    '40GP': { length: 12030, width: 2350, height: 2390, weightLimit: 27000 },
    '40HQ': { length: 12030, width: 2350, height: 2690, weightLimit: 27000 },
    '45HQ': { length: 13560, width: 2350, height: 2690, weightLimit: 27000 },
};

function round2(value) { return Math.round(value * 100) / 100; }
function round4(value) { return Math.round(value * 10000) / 10000; }
function fitCount(space, size) { return Math.max(0, Math.floor(space / size + 1e-10)); }

function calcPieceWeight(floor) {
    return floor.length * floor.width * floor.thickness * floor.density / 1_000_000;
}

function calcBoxParams(floor, box) {
    const pieceWeight = calcPieceWeight(floor);
    const pieceArea = floor.length * floor.width / 1_000_000;
    return {
        pieceWeight, pieceArea,
        totalThickness: floor.thickness + floor.padThickness,
        boxWeight: pieceWeight * box.piecesPerBox,
        boxArea: pieceArea * box.piecesPerBox,
        calculatedBoxHeight: (floor.thickness + floor.padThickness) * box.piecesPerBox + box.packingAllowance,
        boxHeight: box.height,
        boxLength: box.length, boxWidth: box.width,
    };
}

function gridLayout(length, width, itemLength, itemWidth, orientation) {
    const placements = [];
    for (let rowIndex = 0; rowIndex < fitCount(width, itemWidth); rowIndex++) {
        for (let columnIndex = 0; columnIndex < fitCount(length, itemLength); columnIndex++) {
            placements.push({ x: columnIndex * itemLength, y: rowIndex * itemWidth,
                l: itemLength, w: itemWidth, orientation });
        }
    }
    return placements;
}

function rectanglesOverlap(first, second) {
    return first.x < second.x + second.l - 1e-7 && second.x < first.x + first.l - 1e-7
        && first.y < second.y + second.w - 1e-7 && second.y < first.y + first.w - 1e-7;
}

function splitFreeRectangles(freeRectangles, placed) {
    const next = [];
    for (const free of freeRectangles) {
        if (!rectanglesOverlap(free, placed)) {
            next.push(free);
            continue;
        }
        if (placed.x > free.x) next.push({ x: free.x, y: free.y, l: placed.x - free.x, w: free.w });
        if (placed.x + placed.l < free.x + free.l) next.push({ x: placed.x + placed.l, y: free.y,
            l: free.x + free.l - placed.x - placed.l, w: free.w });
        if (placed.y > free.y) next.push({ x: free.x, y: free.y, l: free.l, w: placed.y - free.y });
        if (placed.y + placed.w < free.y + free.w) next.push({ x: free.x, y: placed.y + placed.w,
            l: free.l, w: free.y + free.w - placed.y - placed.w });
    }
    return next.filter((rectangle, index) => rectangle.l > 1e-7 && rectangle.w > 1e-7
        && !next.some((other, otherIndex) => otherIndex !== index
            && other.x <= rectangle.x && other.y <= rectangle.y
            && other.x + other.l >= rectangle.x + rectangle.l - 1e-7
            && other.y + other.w >= rectangle.y + rectangle.w - 1e-7
            && (otherIndex < index || other.l * other.w > rectangle.l * rectangle.w + 1e-7)));
}

function compareScores(first, second) {
    for (let index = 0; index < first.length; index++) {
        if (first[index] !== second[index]) return first[index] - second[index];
    }
    return 0;
}

function packRectangles(length, width, itemLength, itemWidth, mode = 'auto') {
    const horizontal = gridLayout(length, width, itemLength, itemWidth, 'H');
    const vertical = gridLayout(length, width, itemWidth, itemLength, 'V');
    const upperBound = fitCount(length * width, itemLength * itemWidth);
    if (mode === 'H' || mode === 'V') {
        const placements = mode === 'H' ? horizontal : vertical;
        return { count: placements.length, placements, proven: true, mode };
    }
    let best = horizontal.length >= vertical.length ? horizontal : vertical;
    const consider = placements => {
        if (placements.length > best.length) best = placements;
    };
    for (const transposed of [false, true]) {
        const span = transposed ? width : length;
        const cross = transposed ? length : width;
        for (let strips = 0; strips <= fitCount(span, itemLength); strips++) {
            const first = gridLayout(strips * itemLength, cross, itemLength, itemWidth, 'H');
            const second = gridLayout(span - strips * itemLength, cross, itemWidth, itemLength, 'V')
                .map(placed => ({ ...placed, x: placed.x + strips * itemLength }));
            consider([...first, ...second].map(placed => transposed
                ? { x: placed.y, y: placed.x, l: placed.w, w: placed.l,
                    orientation: placed.orientation === 'H' ? 'V' : 'H' } : placed));
        }
    }
    if (best.length < upperBound) {
        for (let strategy = 0; strategy < 4; strategy++) {
            for (const preferred of ['H', 'V', 'alternate']) {
                let freeRectangles = [{ x: 0, y: 0, l: length, w: width }];
                const placements = [];
                while (placements.length < upperBound) {
                    let choice = null;
                    for (const free of freeRectangles) {
                        for (const orientation of ['H', 'V']) {
                            const boxLength = orientation === 'H' ? itemLength : itemWidth;
                            const boxWidth = orientation === 'H' ? itemWidth : itemLength;
                            if (boxLength > free.l + 1e-7 || boxWidth > free.w + 1e-7) continue;
                            const remainingLength = free.l - boxLength;
                            const remainingWidth = free.w - boxWidth;
                            const preferredOrientation = preferred === 'alternate'
                                ? (placements.length % 2 ? 'V' : 'H') : preferred;
                            const scores = [Math.min(remainingLength, remainingWidth),
                                free.l * free.w - boxLength * boxWidth, free.y + boxWidth, free.x + boxLength];
                            const score = [scores[strategy], orientation === preferredOrientation ? 0 : 1,
                                free.y, free.x];
                            if (!choice || compareScores(score, choice.score) < 0) {
                                choice = { score, placed: { x: free.x, y: free.y,
                                    l: boxLength, w: boxWidth, orientation } };
                            }
                        }
                    }
                    if (!choice) break;
                    placements.push(choice.placed);
                    freeRectangles = splitFreeRectangles(freeRectangles, choice.placed);
                }
                consider(placements);
            }
        }
    }
    return { count: best.length, placements: best, proven: best.length === upperBound, mode };
}

function validateInput(input) {
    const positive = [
        ['floor.length', 'floor_length'], ['floor.width', 'floor_width'],
        ['floor.thickness', 'floor_thickness'], ['floor.density', 'floor_density'],
        ['box.length', 'box_length'], ['box.width', 'box_width'], ['box.height', 'box_height'],
        ['box.piecesPerBox', 'pieces_per_box'],
        ['pallet.length', 'pallet_length'], ['pallet.width', 'pallet_width'], ['pallet.height', 'pallet_height'],
        ['limits.boxWeightLimit', 'box_weight_limit'], ['limits.palletWeightLimit', 'pallet_weight_limit'],
        ['limits.containerWeightLimit', 'container_weight_limit'],
        ['container.length', 'container_l'], ['container.width', 'container_w'], ['container.height', 'container_h'],
    ];
    const nonnegative = [['floor.padThickness', 'pad_thickness'], ['box.packingAllowance', 'packing_allowance'],
        ['pallet.selfWeight', 'pallet_self_weight'], ['limits.auxiliaryWeight', 'auxiliary_weight']];
    const errors = [];
    for (const [path, field] of [...positive, ...nonnegative]) {
        const [group, property] = path.split('.');
        const value = input[group]?.[property];
        if (!Number.isFinite(value) || (positive.some(entry => entry[0] === path) ? value <= 0 : value < 0)) {
            errors.push({ key: 'invalid_number', field });
        }
    }
    if (!Number.isSafeInteger(input.box?.piecesPerBox)) errors.push({ key: 'invalid_pieces' });
    if (!['auto', 'mixed', 'H', 'V'].includes(input.layoutMode)) errors.push({ key: 'invalid_layout' });
    if (!['auto', 'mixed', 'cross', 'H', 'V'].includes(input.boxLayoutMode ?? 'auto')) errors.push({ key: 'invalid_box_layout' });
    if (errors.length) return errors;
    const boxParams = calcBoxParams(input.floor, input.box);
    const derived = [boxParams.pieceWeight, boxParams.boxWeight, boxParams.boxArea, boxParams.boxHeight,
        input.pallet.length * input.pallet.width,
        input.container.length * input.container.width * input.container.height];
    if (derived.some(value => !Number.isFinite(value) || value <= 0)) {
        return [{ key: 'numeric_range' }];
    }
    if (input.box.length < input.floor.length || input.box.width < input.floor.width) {
        errors.push({ key: 'box_too_small' });
    }
    if (input.box.height + 1e-8 < (input.floor.thickness + input.floor.padThickness) * input.box.piecesPerBox) {
        errors.push({ key: 'box_height_too_small' });
    }
    if (input.pallet.length * input.pallet.width / (input.box.length * input.box.width) > 2000
        || input.container.length * input.container.width / (input.pallet.length * input.pallet.width) > 2000
        || input.container.length / Math.min(input.pallet.length, input.pallet.width) > 2000
        || input.container.width / Math.min(input.pallet.length, input.pallet.width) > 2000
        || input.pallet.length / Math.min(input.box.length, input.box.width) > 2000
        || input.pallet.width / Math.min(input.box.length, input.box.width) > 2000) {
        errors.push({ key: 'calculation_too_large' });
    }
    return errors;
}

function boxesForLayers(layerInfo, layers) {
    if (!layerInfo.cross) return layerInfo.count * layers;
    return Math.ceil(layers / 2) * layerInfo.variants[0].count
        + Math.floor(layers / 2) * layerInfo.variants[1].count;
}

function createBoxLayerInfo(input) {
    const { pallet, box } = input;
    if (input.boxLayoutMode === 'cross') {
        const horizontal = packRectangles(pallet.length, pallet.width, box.length, box.width, 'H');
        const vertical = packRectangles(pallet.length, pallet.width, box.length, box.width, 'V');
        return {
            count: horizontal.count, cross: true, proven: horizontal.proven && vertical.proven,
            variants: [horizontal, vertical].map(layout => ({ ...layout,
                placements: layout.placements.map(placed => ({ ...placed, z: placed.y })) })),
            placements: horizontal.placements.map(placed => ({ ...placed, z: placed.y })),
        };
    }
    const packed = packRectangles(pallet.length, pallet.width, box.length, box.width, input.boxLayoutMode ?? 'auto');
    return { ...packed, cross: false,
        variants: [{ ...packed, placements: packed.placements.map(placed => ({ ...placed, z: placed.y })) }],
        placements: packed.placements.map(placed => ({ ...placed, z: placed.y })) };
}

function optimizeUniformPallets(input, boxParams, layerInfo, floorLayout) {
    const { pallet, container, limits } = input;
    if (!layerInfo.count || (layerInfo.cross && !layerInfo.variants[1].count) || !floorLayout.count
        || boxParams.boxWeight > limits.boxWeightLimit + 1e-9) return null;
    let best = null;
    for (const stackLimit of [1, 2, 3]) {
        const heightLayers = fitCount(container.height / stackLimit - pallet.height, boxParams.boxHeight);
        for (let layers = 1; layers <= heightLayers; layers++) {
            const boxesPerPallet = boxesForLayers(layerInfo, layers);
            const palletWeight = pallet.selfWeight + boxesPerPallet * boxParams.boxWeight;
            if (palletWeight > limits.palletWeightLimit + 1e-8) break;
            const weightCapacity = fitCount(limits.containerWeightLimit - limits.auxiliaryWeight, palletWeight);
            const palletCount = Math.min(floorLayout.count * stackLimit, weightCapacity);
            if (palletCount < 1) continue;
            const boxes = palletCount * boxesPerPallet;
            if (!Number.isSafeInteger(boxes * input.box.piecesPerBox)) continue;
            const verticalLayers = Math.ceil(palletCount / floorLayout.count);
            if (!best || boxes > best.boxes || (boxes === best.boxes && palletCount < best.palletCount)
                || (boxes === best.boxes && palletCount === best.palletCount && verticalLayers < best.verticalLayers)) {
                best = { boxes, boxesPerPallet, layers, palletCount, verticalLayers };
            }
        }
    }
    return best;
}

function calculateAll(input, includeSuggestions = true) {
    const errors = validateInput(input);
    if (errors.length) return { input, valid: false, errors, suggestions: [] };
    const { floor, box, pallet, limits, container } = input;
    const boxParams = calcBoxParams(floor, box);
    const layerInfo = createBoxLayerInfo(input);
    const layouts = {
        H: packRectangles(container.length, container.width, pallet.length, pallet.width, 'H'),
        V: packRectangles(container.length, container.width, pallet.length, pallet.width, 'V'),
        mixed: packRectangles(container.length, container.width, pallet.length, pallet.width, 'mixed'),
    };
    const floorLayout = layouts[input.layoutMode === 'auto' ? 'mixed' : input.layoutMode];
    const solution = optimizeUniformPallets(input, boxParams, layerInfo, floorLayout);
    if (boxParams.boxWeight > limits.boxWeightLimit + 1e-9) {
        errors.push({ key: 'box_overweight', params: { max: fitCount(limits.boxWeightLimit, boxParams.pieceWeight) } });
    }
    if (!layerInfo.count || (layerInfo.cross && !layerInfo.variants[1].count)) errors.push({ key: 'box_does_not_fit' });
    if (!floorLayout.count) errors.push({ key: 'pallet_does_not_fit' });
    if (limits.auxiliaryWeight >= limits.containerWeightLimit) errors.push({ key: 'auxiliary_overweight' });
    if (!solution && !errors.length) errors.push({ key: 'no_solution' });
    const suggestions = includeSuggestions ? buildSuggestions(input, boxParams, layerInfo, layouts, solution) : [];
    if (!solution || errors.length) return { input, valid: false, errors, boxParams, suggestions };
    const totalBoxes = solution.boxesPerPallet;
    const palletSummary = {
        layers: solution.layers, boxesPerLayer: layerInfo.count, totalBoxes,
        totalPieces: totalBoxes * box.piecesPerBox, totalArea: totalBoxes * boxParams.boxArea,
        cargoHeight: solution.layers * boxParams.boxHeight,
        totalHeight: pallet.height + solution.layers * boxParams.boxHeight,
        totalWeight: pallet.selfWeight + totalBoxes * boxParams.boxWeight,
    };
    const floorPallets = Math.min(solution.palletCount, floorLayout.count);
    const actualFloorLayout = { ...floorLayout, count: floorPallets, placements: floorLayout.placements.slice(0, floorPallets) };
    const cargoWeight = solution.palletCount * palletSummary.totalWeight;
    const containerTotal = {
        floorLayout: actualFloorLayout, floorCapacity: floorLayout.count, floorPallets,
        actualPallets: solution.palletCount, verticalLayers: solution.verticalLayers,
        upperPallets: solution.palletCount - floorPallets,
        totalBoxes: solution.boxes, totalPieces: solution.boxes * box.piecesPerBox,
        totalArea: solution.boxes * boxParams.boxArea,
        cargoWeight, auxiliaryWeight: limits.auxiliaryWeight,
        totalWeight: cargoWeight + limits.auxiliaryWeight,
        spaceUtil: solution.palletCount * pallet.length * pallet.width * palletSummary.totalHeight
            / (container.length * container.width * container.height) * 100,
        weightUtil: (cargoWeight + limits.auxiliaryWeight) / limits.containerWeightLimit * 100,
    };
    return { input, valid: true, errors: [], boxParams, layerInfo, palletSummary, containerTotal, suggestions,
        packingProven: layerInfo.proven && floorLayout.proven };
}

function calculatePalletUnit(input) {
    const errors = validateInput(input);
    if (errors.length) return { valid: false, errors };
    const boxParams = calcBoxParams(input.floor, input.box);
    const layerInfo = createBoxLayerInfo(input);
    if (boxParams.boxWeight > input.limits.boxWeightLimit + 1e-9) return { valid: false, errors: [{ key: 'box_overweight',
        params: { max: fitCount(input.limits.boxWeightLimit, boxParams.pieceWeight) } }] };
    if (!layerInfo.count || (layerInfo.cross && !layerInfo.variants[1].count)) {
        return { valid: false, errors: [{ key: 'box_does_not_fit' }] };
    }
    const maxLayers = fitCount(input.container.height - input.pallet.height, boxParams.boxHeight);
    let layers = 0;
    for (let candidate = 1; candidate <= maxLayers; candidate++) {
        const boxes = boxesForLayers(layerInfo, candidate);
        if (input.pallet.selfWeight + boxes * boxParams.boxWeight <= input.limits.palletWeightLimit + 1e-8) layers = candidate;
        else break;
    }
    if (!layers) return { valid: false, errors: [{ key: 'no_solution' }] };
    const totalBoxes = boxesForLayers(layerInfo, layers);
    return { valid: true, input, boxParams, layerInfo, palletSummary: {
        layers, boxesPerLayer: layerInfo.count, totalBoxes,
        totalPieces: totalBoxes * input.box.piecesPerBox,
        totalArea: totalBoxes * boxParams.boxArea,
        cargoHeight: layers * boxParams.boxHeight,
        totalHeight: input.pallet.height + layers * boxParams.boxHeight,
        totalWeight: input.pallet.selfWeight + totalBoxes * boxParams.boxWeight,
    } };
}

function packMixedPallets(specs, container, limits, layoutMode = 'auto') {
    const allItems = specs.flatMap((spec, specIndex) => Array.from({ length: spec.quantity }, (_, copyIndex) => ({
        specIndex, copyIndex, l: spec.length, w: spec.width,
        height: spec.height, weight: spec.weight,
    })));
    const sorters = [
        (a, b) => b.l * b.w - a.l * a.w,
        (a, b) => Math.max(b.l, b.w) - Math.max(a.l, a.w),
        (a, b) => a.weight - b.weight,
        (a, b) => a.l * a.w - b.l * b.w,
        (a, b) => b.l * b.w * b.height - a.l * a.w * a.height,
    ];
    let best = null;
    const searches = sorters.flatMap(sorter => ['H', 'V'].flatMap(preferred =>
        ['shortSide', 'area', 'bottomLeft'].map(strategy => ({ sorter, preferred, strategy }))));
    for (const { sorter, preferred, strategy } of searches) {
        const items = [...allItems].sort(sorter);
        let free = [{ x: 0, y: 0, l: container.length, w: container.width }];
        const placements = [];
        const loaded = [];
        let totalWeight = 0;
        for (const item of items) {
            if (totalWeight + item.weight > limits.containerWeightLimit + 1e-8) continue;
            const stackTarget = placements.find(placed => placed.specIndex === item.specIndex && placed.stackCount < 3
                && placed.height + item.height <= container.height + 1e-8);
            if (stackTarget) {
                stackTarget.stackCount += 1;
                stackTarget.stackItems.push(item);
                stackTarget.height += item.height;
                loaded.push(item);
                totalWeight += item.weight;
                continue;
            }
            let choice = null;
            const orientations = layoutMode === 'H' ? [[item.l, item.w, 'H']]
                : layoutMode === 'V' ? [[item.w, item.l, 'V']]
                    : [[item.l, item.w, 'H'], [item.w, item.l, 'V']];
            for (const rectangle of free) {
                for (const [length, width, orientation] of orientations) {
                    if (length > rectangle.l + 1e-8 || width > rectangle.w + 1e-8 || item.height > container.height + 1e-8) continue;
                    const primary = strategy === 'area' ? rectangle.l * rectangle.w - length * width
                        : strategy === 'bottomLeft' ? rectangle.y + width
                            : Math.min(rectangle.l - length, rectangle.w - width);
                    const score = [primary, orientation === preferred ? 0 : 1,
                        rectangle.y, rectangle.x];
                    if (!choice || compareScores(score, choice.score) < 0) choice = { rectangle, length, width, orientation, score };
                }
            }
            if (!choice) continue;
            const placed = { x: choice.rectangle.x, y: choice.rectangle.y, l: choice.length, w: choice.width,
                orientation: choice.orientation, specIndex: item.specIndex, stackCount: 1, stackItems: [item], height: item.height };
            placements.push(placed);
            free = splitFreeRectangles(free, placed);
            loaded.push(item);
            totalWeight += item.weight;
        }
        const usedVolume = loaded.reduce((sum, item) => sum + item.l * item.w * item.height, 0);
        const score = [loaded.length, usedVolume, -placements.length];
        if (!best || compareScores(score, best.score) > 0) best = { score, placements, loaded, totalWeight };
    }
    return best;
}

function calculateMixedContainer(specs, container, limits, layoutMode = 'auto') {
    const errors = [];
    for (const [property, field] of [['length', 'container_l'], ['width', 'container_w'], ['height', 'container_h']]) {
        if (!Number.isFinite(container[property]) || container[property] <= 0) errors.push({ key: 'invalid_number', field });
    }
    if (!Number.isFinite(limits.containerWeightLimit) || limits.containerWeightLimit <= 0) {
        errors.push({ key: 'invalid_number', field: 'container_weight_limit' });
    }
    if (!errors.length && !Number.isFinite(container.length * container.width * container.height)) {
        errors.push({ key: 'numeric_range' });
    }
    if (!['auto', 'mixed', 'H', 'V'].includes(layoutMode)) errors.push({ key: 'invalid_layout' });
    for (const spec of specs) errors.push(...validateLoadedPallet(spec));
    if (errors.length) return { multi: true, valid: false, errors };
    if (!specs.length) return { multi: true, valid: false, errors: [{ key: 'mixed_empty_error' }] };
    if (specs.some(spec => !Number.isSafeInteger(spec.quantity) || spec.quantity < 1)) {
        return { multi: true, valid: false, errors: [{ key: 'mixed_invalid_quantity' }] };
    }
    if (specs.reduce((sum, spec) => sum + spec.quantity, 0) > 200) {
        return { multi: true, valid: false, errors: [{ key: 'mixed_too_many' }] };
    }
    const packed = packMixedPallets(specs, container, limits, layoutMode);
    if (!packed || !packed.loaded.length) return { multi: true, valid: false, errors: [{ key: 'loaded_no_fit' }] };
    const breakdown = specs.map((spec, specIndex) => {
        const loaded = packed.loaded.filter(item => item.specIndex === specIndex).length;
        return { specIndex, requested: spec.quantity, loaded, spec };
    });
    const cargoWeight = packed.totalWeight;
    const usedVolume = packed.loaded.reduce((sum, item) => sum + item.l * item.w * item.height, 0);
    return { multi: true, valid: true, errors: [], specs, mixedBreakdown: breakdown,
        container: { ...container }, limits: { ...limits },
        containerTotal: {
            floorLayout: { placements: packed.placements, count: packed.placements.length },
            floorPallets: packed.placements.length, actualPallets: packed.loaded.length,
            verticalLayers: packed.placements.reduce((max, placed) => Math.max(max, placed.stackCount), 1),
            upperPallets: packed.loaded.length - packed.placements.length,
            totalBoxes: null, totalPieces: null, totalArea: null, cargoWeight, auxiliaryWeight: 0,
            totalWeight: packed.totalWeight,
            spaceUtil: usedVolume / (container.length * container.width * container.height) * 100,
            weightUtil: packed.totalWeight / limits.containerWeightLimit * 100,
        },
        hasUnloaded: breakdown.some(row => row.loaded < row.requested),
    };
}

function validateLoadedPallet(spec) {
    const errors = [];
    for (const [property, field] of [['length', 'pallet_length'], ['width', 'pallet_width'],
        ['height', 'loaded_height'], ['weight', 'loaded_weight']]) {
        if (!Number.isFinite(spec[property]) || spec[property] <= 0) errors.push({ key: 'invalid_number', field });
    }
    if (!errors.length && !Number.isFinite(spec.length * spec.width * spec.height)) errors.push({ key: 'numeric_range' });
    return errors;
}

function buildSuggestions(input, boxParams, layerInfo, layouts, current) {
    const suggestions = [];
    const selected = layouts[input.layoutMode === 'auto' ? 'mixed' : input.layoutMode];
    const currentPieces = current ? current.boxes * input.box.piecesPerBox : 0;
    if (input.layoutMode === 'H' || input.layoutMode === 'V') {
        const mixed = optimizeUniformPallets(input, boxParams, layerInfo, layouts.mixed);
        if (mixed && mixed.boxes * input.box.piecesPerBox > currentPieces) {
            suggestions.push({ key: 'suggest_layout', params: { area: round4(mixed.boxes * boxParams.boxArea) } });
        }
    }
    const maxPieces = Math.min(fitCount(input.limits.boxWeightLimit, boxParams.pieceWeight),
        fitCount(input.container.height - input.pallet.height - input.box.packingAllowance,
            boxParams.totalThickness));
    let best = null;
    const searchLimit = Math.min(maxPieces, 1000);
    for (let pieces = 1; pieces <= searchLimit; pieces++) {
        if (pieces === input.box.piecesPerBox) continue;
        const candidateInput = { ...input, box: { ...input.box, piecesPerBox: pieces } };
        const candidateBox = calcBoxParams(input.floor, candidateInput.box);
        const candidate = optimizeUniformPallets(candidateInput, candidateBox, layerInfo, selected);
        if (!candidate) continue;
        const totalPieces = candidate.boxes * pieces;
        if (totalPieces > currentPieces && (!best || totalPieces > best.totalPieces
            || (totalPieces === best.totalPieces && Math.abs(pieces - input.box.piecesPerBox)
                < Math.abs(best.pieces - input.box.piecesPerBox)))) {
            best = { pieces, totalPieces, layers: candidate.layers, pallets: candidate.palletCount };
        }
    }
    if (best) suggestions.push({ key: 'suggest_pieces', params: { ...best,
        area: round4(best.totalPieces * boxParams.pieceArea) } });
    if (maxPieces > searchLimit) suggestions.push({ key: 'suggest_search_limit', params: { max: searchLimit } });
    return suggestions;
}
