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
        boxHeight: (floor.thickness + floor.padThickness) * box.piecesPerBox + box.packingAllowance,
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
        ['box.length', 'box_length'], ['box.width', 'box_width'], ['box.piecesPerBox', 'pieces_per_box'],
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
    if (!['auto', 'mixed', 'H', 'V'].includes(input.boxLayoutMode ?? 'auto')) errors.push({ key: 'invalid_box_layout' });
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

function optimizeUniformPallets(input, boxParams, layerInfo, floorLayout) {
    const { pallet, container, limits } = input;
    const weightPerLayer = layerInfo.count * boxParams.boxWeight;
    if (!layerInfo.count || !floorLayout.count || boxParams.boxWeight > limits.boxWeightLimit + 1e-9) return null;
    let best = null;
    for (const stackLimit of [1, 2]) {
        const heightLayers = fitCount(container.height / stackLimit - pallet.height, boxParams.boxHeight);
        const weightLayers = fitCount(limits.palletWeightLimit - pallet.selfWeight, weightPerLayer);
        for (let palletCount = 1; palletCount <= floorLayout.count * stackLimit; palletCount++) {
            const containerLayers = fitCount((limits.containerWeightLimit - limits.auxiliaryWeight)
                / palletCount - pallet.selfWeight, weightPerLayer);
            let layers = Math.min(heightLayers, weightLayers, containerLayers);
            const fits = layerCount => pallet.height + layerCount * boxParams.boxHeight <= container.height / stackLimit + 1e-8
                && pallet.selfWeight + layerCount * weightPerLayer <= limits.palletWeightLimit + 1e-8
                && palletCount * (pallet.selfWeight + layerCount * weightPerLayer)
                    + limits.auxiliaryWeight <= limits.containerWeightLimit + 1e-8;
            if (layers > 0 && !fits(layers)) layers--;
            if (layers < 1) continue;
            const boxes = palletCount * layers * layerInfo.count;
            if (!Number.isSafeInteger(boxes * input.box.piecesPerBox)) continue;
            const verticalLayers = palletCount > floorLayout.count ? 2 : 1;
            if (!best || boxes > best.boxes || (boxes === best.boxes && palletCount < best.palletCount)
                || (boxes === best.boxes && palletCount === best.palletCount && verticalLayers < best.verticalLayers)) {
                best = { boxes, layers, palletCount, verticalLayers };
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
    const packedBoxes = packRectangles(pallet.length, pallet.width, box.length, box.width, input.boxLayoutMode ?? 'auto');
    const layerInfo = { ...packedBoxes, placements: packedBoxes.placements.map(placed => ({ ...placed, z: placed.y })) };
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
    if (!layerInfo.count) errors.push({ key: 'box_does_not_fit' });
    if (!floorLayout.count) errors.push({ key: 'pallet_does_not_fit' });
    if (limits.auxiliaryWeight >= limits.containerWeightLimit) errors.push({ key: 'auxiliary_overweight' });
    if (!solution && !errors.length) errors.push({ key: 'no_solution' });
    const suggestions = includeSuggestions ? buildSuggestions(input, boxParams, layerInfo, layouts, solution) : [];
    if (!solution || errors.length) return { input, valid: false, errors, boxParams, suggestions };
    const totalBoxes = solution.layers * layerInfo.count;
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
        packingProven: packedBoxes.proven && floorLayout.proven };
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
