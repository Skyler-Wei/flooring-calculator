let boxLengthManual = false;
let boxWidthManual = false;
let boxHeightManual = false;
let viewersAvailable = false;
const containerDimensionCache = Object.create(null);
let mixedSpecs = [];

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
    if (!boxHeightManual) {
        const floor = { thickness: valueOf('floor_thickness'), padThickness: valueOf('pad_thickness') };
        const pieces = valueOf('pieces_per_box');
        const allowance = valueOf('packing_allowance');
        const calculated = (floor.thickness + floor.padThickness) * pieces + allowance;
        document.getElementById('box_height').value = Number.isFinite(calculated) ? round4(calculated) : '';
    }
}

function autoMatchPallet(applySize = true) {
    const floor = { length: valueOf('floor_length'), width: valueOf('floor_width'),
        thickness: valueOf('floor_thickness'), padThickness: valueOf('pad_thickness') };
    const match = findCommonPalletSize(floor, valueOf('pieces_per_box'));
    const hint = document.getElementById('pallet_match_hint');
    const reversedHint = Number.isFinite(floor.length) && Number.isFinite(floor.width) && floor.length < floor.width
        ? t('floor_dimensions_reversed') : '';
    if (!match) {
        hint.textContent = [reversedHint, t('pallet_no_match')].filter(Boolean).join(' ');
        return;
    }
    if (applySize) {
        document.getElementById('pallet_length').value = match.entry.palletLength;
        document.getElementById('pallet_width').value = match.entry.palletWidth;
    }
    const matchHint = t(match.exact ? 'pallet_exact_match' : 'pallet_dimension_match', {
        length: match.entry.palletLength, width: match.entry.palletWidth,
    });
    hint.textContent = [reversedHint, matchHint].filter(Boolean).join(' ');
}

function setupLinkage() {
    restoreContainerDimensions();
    setupWeightLimitMemory();
    document.querySelectorAll('.field').forEach(field => {
        const control = field.querySelector('input, select');
        const label = field.querySelector('label');
        if (control && label) label.htmlFor = control.id;
    });
    for (const id of ['floor_length', 'floor_width', 'floor_thickness', 'pad_thickness', 'pieces_per_box']) {
        document.getElementById(id).addEventListener('input', () => { updateBoxLinkage(); autoMatchPallet(); });
    }
    document.getElementById('packing_allowance').addEventListener('input', updateBoxLinkage);
    document.getElementById('box_length').addEventListener('input', () => { boxLengthManual = true; });
    document.getElementById('box_width').addEventListener('input', () => { boxWidthManual = true; });
    document.getElementById('box_height').addEventListener('input', () => { boxHeightManual = true; });
    document.querySelectorAll('input[name="calculation_mode"]').forEach(control => control.addEventListener('change', updateCalculationMode));
    document.getElementById('add_mix_spec').addEventListener('click', addCurrentSpec);
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
    updateBoxLinkage();
    autoMatchPallet();
    updateCalculationMode();
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
    boxHeightManual = false;
    updateBoxLinkage();
    markDirty();
}

function readInputs() {
    return {
        floor: { length: valueOf('floor_length'), width: valueOf('floor_width'), thickness: valueOf('floor_thickness'),
            padThickness: valueOf('pad_thickness'), density: valueOf('floor_density') },
        box: { length: valueOf('box_length'), width: valueOf('box_width'), piecesPerBox: valueOf('pieces_per_box'),
            packingAllowance: valueOf('packing_allowance'), height: valueOf('box_height') },
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
    if (!boxHeightManual) updateBoxLinkage();
}

function calculationMode() {
    return document.querySelector('input[name="calculation_mode"]:checked')?.value || 'single';
}

function updateCalculationMode() {
    refreshModeUI();
    markDirty();
}

function refreshModeUI() {
    const multi = calculationMode() === 'multi';
    document.querySelectorAll('[data-single-only]').forEach(element => { element.hidden = multi; });
    document.querySelectorAll('[data-multi-only]').forEach(element => { element.hidden = !multi; });
    document.querySelector('#result_box .result-title').textContent = t(multi ? 'loaded_breakdown' : 'result_box');
    document.querySelector('#result_pallet .result-title').textContent = t(multi ? 'loaded_details' : 'result_pallet');
    document.getElementById('pallet_viewer').closest('.viewer-box').hidden = multi;
    document.getElementById('container_viewer').closest('.viewer-box').style.gridColumn = multi ? '1 / -1' : '';
}

function addCurrentSpec() {
    const spec = { length: valueOf('loaded_length'), width: valueOf('loaded_width'),
        height: valueOf('loaded_height'), weight: valueOf('loaded_weight') };
    const errors = validateLoadedPallet(spec);
    const message = document.getElementById('mixed_entry_message');
    if (errors.length) {
        message.innerHTML = errors.map(error => '<div class="warning-box error">'
            + t(error.key, { ...error.params, field: error.field ? t(error.field) : '' }) + '</div>').join('');
        return;
    }
    if (mixedSpecs.reduce((sum, item) => sum + item.quantity, 0) >= 200) {
        message.textContent = t('mixed_too_many');
        return;
    }
    const key = [spec.length, spec.width, spec.height, spec.weight].join('|');
    const existing = mixedSpecs.find(spec => spec.key === key);
    if (existing) existing.quantity++;
    else mixedSpecs.push({ ...spec, key, quantity: 1 });
    renderMixedSpecs();
    markDirty();
    message.textContent = t('loaded_added');
}

function renderMixedSpecs() {
    const body = document.getElementById('mixed_specs_body');
    body.innerHTML = mixedSpecs.map((spec, index) => `<tr>
        <td>P${index + 1}<br>${formatLoadedSize(spec)}</td>
        <td>${formatNumber(spec.weight, 2)}</td>
        <td><input type="number" min="1" step="1" value="${spec.quantity}" data-mix-quantity="${index}" aria-label="${t('mixed_quantity')}"></td>
        <td><button type="button" class="btn-sm" data-remove-spec="${index}">${t('remove')}</button></td>
    </tr>`).join('');
    document.getElementById('mixed_empty').hidden = mixedSpecs.length > 0;
    body.querySelectorAll('[data-mix-quantity]').forEach(control => control.addEventListener('input', () => {
        mixedSpecs[Number(control.dataset.mixQuantity)].quantity = Number(control.value);
        markDirty();
    }));
    body.querySelectorAll('[data-remove-spec]').forEach(control => control.addEventListener('click', () => {
        mixedSpecs.splice(Number(control.dataset.removeSpec), 1);
        renderMixedSpecs();
        markDirty();
    }));
}

function clearResults() {
    for (const id of ['result_box_content', 'result_pallet_content', 'result_container_content']) {
        document.getElementById(id).textContent = '—';
    }
    clearViewerGroups();
}

function doCalculate() {
    updateFloorMetrics();
    const input = readInputs();
    const result = calculationMode() === 'multi'
        ? calculateMixedContainer(mixedSpecs, input.container, { containerWeightLimit: input.limits.containerWeightLimit }, input.layoutMode)
        : calculateAll(input, false);
    window._lastResult = result;
    renderResults(result);
    if (result.valid && viewersAvailable) {
        if (!result.multi) renderPallet3D(result);
        renderContainer3D(result);
    }
}

function renderResults(result) {
    clearResults();
    const { boxParams, layerInfo, palletSummary, containerTotal, input } = result;
    const warnings = document.getElementById('warnings_area');
    warnings.innerHTML = result.valid
        ? '<div class="warning-box success">' + t(result.multi ? 'loaded_constraints_pass' : 'constraints_pass') + '</div>'
        : result.errors.map(error => '<div class="warning-box error">'
            + t(error.key, { ...error.params, field: error.field ? t(error.field) : '' }) + '</div>').join('');
    if (result.multi && result.valid) {
        const incomplete = result.hasUnloaded ? '<div class="warning-box warning">' + t('mixed_partial') + '</div>' : '';
        warnings.innerHTML = incomplete || '<div class="warning-box success">' + t('loaded_constraints_pass') + '</div>';
        warnings.innerHTML += '<p class="hint-text">' + t('loaded_search_note') + '</p>';
        document.getElementById('result_box_content').innerHTML = result.mixedBreakdown.map(item =>
            row('P' + (item.specIndex + 1) + ' · ' + formatLoadedSize(item.spec),
                t('mixed_loaded_count', { loaded: item.loaded, requested: item.requested }))).join('');
        document.getElementById('result_pallet_content').innerHTML = result.mixedBreakdown.map(item =>
            row('P' + (item.specIndex + 1) + ' · ' + formatLoadedSize(item.spec),
                formatNumber(item.spec.weight, 2) + ' kg')).join('');
        renderContainerSummary(containerTotal, true);
        return;
    }
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
        row(t('r_layer_layout'), layerInfo.cross
            ? t('cross_layer_count', { first: layerInfo.variants[0].count, second: layerInfo.variants[1].count })
            : t('box_layer_count', { count: layerInfo.count }))
        + row(t('r_layers'), palletSummary.layers + ' ' + t('r_layers_unit'))
        + row(t('r_pallet_total_boxes'), palletSummary.totalBoxes + ' ' + t('r_boxes_unit'))
        + row(t('r_pallet_total_pieces'), palletSummary.totalPieces + ' ' + t('r_pieces_unit'))
        + row(t('r_pallet_total_area'), formatNumber(palletSummary.totalArea, 4) + ' m²')
        + row(t('r_cargo_height'), formatNumber(palletSummary.cargoHeight, 2) + ' mm')
        + row(t('r_pallet_total_height'), formatNumber(palletSummary.totalHeight, 2) + ' mm')
        + row(t('r_pallet_total_weight'), formatNumber(palletSummary.totalWeight, 2) + ' kg');
    renderContainerSummary(containerTotal, false);
}

function renderContainerSummary(containerTotal, multi) {
    document.getElementById('result_container_content').innerHTML =
        row(t('r_floor_layout'), multi ? t('mixed_floor_count', { count: containerTotal.floorPallets }) : formatFloorLayout(containerTotal))
        + row(t('r_vertical_layers'), containerTotal.verticalLayers + ' ' + t('r_layers_unit'))
        + row(t('upper_pallets'), containerTotal.upperPallets)
        + row(t('r_total_pallets'), containerTotal.actualPallets + ' ' + t('r_pallets_unit'))
        + (multi ? '' : row(t('r_container_total_boxes'), containerTotal.totalBoxes + ' ' + t('r_boxes_unit'))
        + row(t('r_container_total_pieces'), containerTotal.totalPieces + ' ' + t('r_pieces_unit'))
        + row(t('r_container_total_area'), formatNumber(containerTotal.totalArea, 4) + ' m²')
        + row(t('cargo_weight'), formatNumber(containerTotal.cargoWeight, 2) + ' kg')
        + row(t('auxiliary_weight_result'), formatNumber(containerTotal.auxiliaryWeight, 2) + ' kg'))
        + row(t('r_container_total_weight'), formatNumber(containerTotal.totalWeight, 2) + ' kg')
        + row(t('r_space_util'), formatNumber(containerTotal.spaceUtil, 2) + '%')
        + row(t('r_weight_util'), formatNumber(containerTotal.weightUtil, 2) + '%');
}

function formatLoadedSize(spec) {
    return [spec.length, spec.width, spec.height].map(value => formatNumber(value, 2)).join(' × ') + ' mm';
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
