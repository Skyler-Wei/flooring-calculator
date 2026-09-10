let boxLengthManual = false;
let boxWidthManual = false;
let viewersAvailable = false;
const containerDimensionCache = Object.create(null);

window.addEventListener('DOMContentLoaded', () => {
    setupLinkage();
    setLanguage(savedLanguage(), false);
    try {
        initViewers();
        viewersAvailable = true;
    } catch (error) {
        console.warn('3D preview unavailable:', error);
        document.querySelectorAll('#pallet_viewer, #container_viewer').forEach(element => {
            element.innerHTML = '<p class="hint-text" style="padding:1rem" data-i18n="viewer_unavailable">' + t('viewer_unavailable') + '</p>';
        });
    }
    doCalculate();
});

function valueOf(id) {
    const raw = document.getElementById(id).value.trim();
    return raw === '' ? NaN : Number(raw);
}

function updateBoxLinkage() {
    for (const [floorId, boxId, manual] of [
        ['floor_length', 'box_length', boxLengthManual], ['floor_width', 'box_width', boxWidthManual],
    ]) {
        if (!manual) {
            const value = valueOf(floorId);
            document.getElementById(boxId).value = Number.isFinite(value) ? round4(value + 4) : '';
        }
    }
}

function setupLinkage() {
    restoreContainerDimensions();
    setupWeightLimitMemory();
    document.querySelectorAll('.field').forEach(field => {
        const control = field.querySelector('input, select');
        const label = field.querySelector('label');
        if (control && label) label.htmlFor = control.id;
    });
    document.getElementById('floor_length').addEventListener('input', updateBoxLinkage);
    document.getElementById('floor_width').addEventListener('input', updateBoxLinkage);
    document.getElementById('box_length').addEventListener('input', () => { boxLengthManual = true; });
    document.getElementById('box_width').addEventListener('input', () => { boxWidthManual = true; });
    document.getElementById('container_type').addEventListener('change', () => {
        restoreContainerDimensions();
        markDirty();
    });
    for (const [id, dimension] of [['container_l', 'length'], ['container_w', 'width'], ['container_h', 'height']]) {
        document.getElementById(id).addEventListener('input', () => {
            const value = valueOf(id);
            if (!Number.isFinite(value) || value <= 0) return;
            const type = document.getElementById('container_type').value;
            const dimensions = getContainerDimensions(type);
            dimensions[dimension] = value;
            try {
                localStorage.setItem('flooring-container-dimensions-' + type, JSON.stringify(dimensions));
            } catch {}
        });
    }
    document.querySelectorAll('input, select:not(#language_select)').forEach(control => {
        control.addEventListener('input', () => {
            updateFloorMetrics();
            markDirty();
        });
    });
}

function setupWeightLimitMemory() {
    for (const id of ['box_weight_limit', 'pallet_weight_limit', 'container_weight_limit']) {
        const control = document.getElementById(id);
        const storageKey = 'flooring-last-' + id;
        try {
            const saved = Number(localStorage.getItem(storageKey));
            if (Number.isFinite(saved) && saved > 0) control.value = saved;
        } catch {}
        control.addEventListener('input', () => {
            const value = valueOf(id);
            if (!Number.isFinite(value) || value <= 0) return;
            try {
                localStorage.setItem(storageKey, String(value));
            } catch {}
        });
    }
}

function getContainerDimensions(type) {
    if (containerDimensionCache[type]) return containerDimensionCache[type];
    let saved = null;
    try {
        saved = JSON.parse(localStorage.getItem('flooring-container-dimensions-' + type));
    } catch {}
    const dimensions = {};
    for (const dimension of ['length', 'width', 'height']) {
        const value = saved?.[dimension];
        dimensions[dimension] = Number.isFinite(value) && value > 0 ? value : CONTAINER_PRESETS[type][dimension];
    }
    containerDimensionCache[type] = dimensions;
    return dimensions;
}

function restoreContainerDimensions() {
    const dimensions = getContainerDimensions(document.getElementById('container_type').value);
    document.getElementById('container_l').value = dimensions.length;
    document.getElementById('container_w').value = dimensions.width;
    document.getElementById('container_h').value = dimensions.height;
}

function markDirty() {
    window._lastResult = null;
    clearResults();
    document.getElementById('warnings_area').innerHTML = '<div class="warning-box warning" data-i18n="recalculate">' + t('recalculate') + '</div>';
}

function resetBoxDefaults() {
    boxLengthManual = false;
    boxWidthManual = false;
    updateBoxLinkage();
    markDirty();
}

function readInputs() {
    return {
        floor: { length: valueOf('floor_length'), width: valueOf('floor_width'), thickness: valueOf('floor_thickness'),
            padThickness: valueOf('pad_thickness'), density: valueOf('floor_density') },
        box: { length: valueOf('box_length'), width: valueOf('box_width'), piecesPerBox: valueOf('pieces_per_box'),
            packingAllowance: valueOf('packing_allowance') },
        pallet: { length: valueOf('pallet_length'), width: valueOf('pallet_width'),
            height: valueOf('pallet_height'), selfWeight: valueOf('pallet_self_weight') },
        limits: { boxWeightLimit: valueOf('box_weight_limit'), palletWeightLimit: valueOf('pallet_weight_limit'),
            containerWeightLimit: valueOf('container_weight_limit'), auxiliaryWeight: valueOf('auxiliary_weight') },
        container: { length: valueOf('container_l'), width: valueOf('container_w'), height: valueOf('container_h') },
        layoutMode: document.getElementById('layout_mode').value,
        boxLayoutMode: document.getElementById('box_layout_mode').value,
    };
}

function updateFloorMetrics() {
    const { floor, box } = readInputs();
    const thickness = floor.thickness > 0 && floor.padThickness >= 0 ? floor.thickness + floor.padThickness : NaN;
    const boxHeight = Number.isFinite(thickness) && Number.isSafeInteger(box.piecesPerBox)
        && box.piecesPerBox > 0 && Number.isFinite(box.packingAllowance) && box.packingAllowance >= 0
        ? calcBoxParams(floor, box).boxHeight : NaN;
    document.getElementById('box_height').value = formatNumber(boxHeight, 2);
}

function clearResults() {
    for (const id of ['result_box_content', 'result_pallet_content', 'result_container_content']) {
        document.getElementById(id).textContent = '—';
    }
    clearViewerGroups();
}

function doCalculate() {
    updateFloorMetrics();
    const result = calculateAll(readInputs(), false);
    window._lastResult = result;
    renderResults(result);
    if (result.valid && viewersAvailable) {
        renderPallet3D(result);
        renderContainer3D(result);
    }
}

function renderResults(result) {
    clearResults();
    const { boxParams, layerInfo, palletSummary, containerTotal, input } = result;
    const warnings = document.getElementById('warnings_area');
    warnings.innerHTML = result.valid
        ? '<div class="warning-box success">' + t('constraints_pass') + '</div>'
        : result.errors.map(error => '<div class="warning-box error">'
            + t(error.key, { ...error.params, field: error.field ? t(error.field) : '' }) + '</div>').join('');
    if (boxParams) {
        document.getElementById('result_box_content').innerHTML =
            row(t('r_piece_weight'), formatNumber(boxParams.pieceWeight, 4) + ' kg')
            + row(t('r_box_weight'), formatNumber(boxParams.boxWeight, 4) + ' kg')
            + row(t('r_box_area'), formatNumber(boxParams.boxArea, 4) + ' m²')
            + row(t('r_box_size'), [boxParams.boxLength, boxParams.boxWidth, boxParams.boxHeight]
                .map(value => formatNumber(value, 2)).join(' × ') + ' mm')
            + row(t('r_box_limit_check'), boxParams.boxWeight <= input.limits.boxWeightLimit + 1e-9 ? t('r_pass') : t('r_over'));
    }
    if (!result.valid) return;
    document.getElementById('result_pallet_content').innerHTML =
        row(t('r_layer_layout'), t('box_layer_count', { count: layerInfo.count }))
        + row(t('r_layers'), palletSummary.layers + ' ' + t('r_layers_unit'))
        + row(t('r_pallet_total_boxes'), palletSummary.totalBoxes + ' ' + t('r_boxes_unit'))
        + row(t('r_pallet_total_pieces'), palletSummary.totalPieces + ' ' + t('r_pieces_unit'))
        + row(t('r_pallet_total_area'), formatNumber(palletSummary.totalArea, 4) + ' m²')
        + row(t('r_cargo_height'), formatNumber(palletSummary.cargoHeight, 2) + ' mm')
        + row(t('r_pallet_total_height'), formatNumber(palletSummary.totalHeight, 2) + ' mm')
        + row(t('r_pallet_total_weight'), formatNumber(palletSummary.totalWeight, 2) + ' kg');
    document.getElementById('result_container_content').innerHTML =
        row(t('r_floor_layout'), formatFloorLayout(containerTotal))
        + row(t('r_vertical_layers'), containerTotal.verticalLayers + ' ' + t('r_layers_unit'))
        + row(t('upper_pallets'), containerTotal.upperPallets)
        + row(t('r_total_pallets'), containerTotal.actualPallets + ' ' + t('r_pallets_unit'))
        + row(t('r_container_total_boxes'), containerTotal.totalBoxes + ' ' + t('r_boxes_unit'))
        + row(t('r_container_total_pieces'), containerTotal.totalPieces + ' ' + t('r_pieces_unit'))
        + row(t('r_container_total_area'), formatNumber(containerTotal.totalArea, 4) + ' m²')
        + row(t('cargo_weight'), formatNumber(containerTotal.cargoWeight, 2) + ' kg')
        + row(t('auxiliary_weight_result'), formatNumber(containerTotal.auxiliaryWeight, 2) + ' kg')
        + row(t('r_container_total_weight'), formatNumber(containerTotal.totalWeight, 2) + ' kg')
        + row(t('r_space_util'), formatNumber(containerTotal.spaceUtil, 2) + '%')
        + row(t('r_weight_util'), formatNumber(containerTotal.weightUtil, 2) + '%');
}

function formatNumber(value, decimals) {
    return Number.isFinite(value) ? value.toLocaleString(LANGUAGE_LOCALES[currentLang],
        { maximumFractionDigits: decimals }) : '—';
}

function row(label, value) {
    return `<div class="result-row"><span class="label">${label}</span><span class="value">${value}</span></div>`;
}

function formatFloorLayout(containerTotal) {
    const horizontal = containerTotal.floorLayout.placements.filter(placed => placed.orientation === 'H').length;
    return t('floor_layout_count', { horizontal, vertical: containerTotal.floorPallets - horizontal });
}
