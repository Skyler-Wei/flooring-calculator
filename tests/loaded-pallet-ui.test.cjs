// Test application integration without a live browser or WebGL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const values = {
    floor_length: '1210', floor_width: '183', floor_thickness: '4', pad_thickness: '0', floor_density: '1.95',
    box_length: '1214', box_width: '187', box_height: '44', pieces_per_box: '10', packing_allowance: '4',
    pallet_length: '1220', pallet_width: '985', pallet_height: '160', pallet_self_weight: '30',
    box_weight_limit: '25', pallet_weight_limit: '1500', container_weight_limit: '27000', auxiliary_weight: '500',
    container_l: '5900', container_w: '2350', container_h: '2390', layout_mode: 'auto', box_layout_mode: 'auto',
    loaded_length: '1200', loaded_width: '800', loaded_height: '1100', loaded_weight: '900',
};
const elements = new Map();
function element(id) {
    if (!elements.has(id)) elements.set(id, {
        _value: values[id] || '',
        get value() { return this._value; }, set value(next) { this._value = String(next); },
        textContent: '', innerHTML: '', hidden: false, style: {},
        querySelectorAll: () => [], closest() { return this; },
    });
    return elements.get(id);
}
const singleSections = [{ hidden: false }, { hidden: false }];
const multiSections = [{ hidden: true }, { hidden: true }];
let mode = 'multi';
const context = vm.createContext({
    window: { addEventListener() {} },
    document: {
        documentElement: {}, title: '',
        getElementById: element,
        querySelector: selector => selector.includes(':checked') ? { value: mode } : element(selector),
        querySelectorAll: selector => selector === '[data-single-only]' ? singleSections
            : selector === '[data-multi-only]' ? multiSections : [],
    },
});
for (const filename of ['pallet-data.js', 'calc.js', 'i18n.js', 'app.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'), context);
}
vm.runInContext('currentLang = "zh";', context);
context.clearViewerGroups = () => {};
context.updateCalculationMode();
assert.ok(singleSections.every(section => section.hidden));
assert.ok(multiSections.every(section => !section.hidden));
context.addCurrentSpec();
context.addCurrentSpec();
assert.equal(vm.runInContext('mixedSpecs.length', context), 1);
assert.equal(vm.runInContext('mixedSpecs[0].quantity', context), 2);
element('loaded_weight').value = '950';
context.addCurrentSpec();
assert.equal(vm.runInContext('mixedSpecs.length', context), 2, 'Different loaded weights must remain separate');
element('loaded_height').value = '';
context.addCurrentSpec();
assert.equal(vm.runInContext('mixedSpecs.length', context), 2, 'Missing height must not add a pallet');

// Blank hidden single-size fields do not block mixed calculation.
element('floor_length').value = '';
element('floor_density').value = '';
element('box_weight_limit').value = '';
element('pallet_weight_limit').value = '';
element('auxiliary_weight').value = '999999';
context.doCalculate();
assert.equal(context.window._lastResult.valid, true);
assert.equal(context.window._lastResult.containerTotal.actualPallets, 3);
assert.equal(context.window._lastResult.containerTotal.totalWeight, 2750);
assert.ok(element('result_box_content').innerHTML.includes('实装'));
assert.ok(!element('result_container_content').innerHTML.includes('m²'));
assert.ok(!element('result_container_content').innerHTML.includes('预估辅材'));
assert.ok(element('result_container_content').innerHTML.includes('2,750'));

context.setLanguage('en', false);
assert.equal(context.window._lastResult.valid, true);
assert.ok(element('result_box_content').innerHTML.includes('loaded'));
assert.equal(element('loaded_weight').value, '950');
context.setLanguage('vi', false);
assert.ok(element('result_box_content').innerHTML.includes('Đã xếp'));
mode = 'single';
context.updateCalculationMode();
assert.ok(singleSections.every(section => !section.hidden));
assert.ok(multiSections.every(section => section.hidden));
assert.equal(element('pallet_height').value, '160');
assert.equal(element('pallet_self_weight').value, '30');
assert.equal(vm.runInContext('mixedSpecs.length', context), 2);
console.log('Mode visibility, direct input, deduplication, hidden-field isolation, result rendering and language switching passed.');
