const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../calc.js'), 'utf8'), context);
const calculate = context.calculateMixedContainer;
const container = { length: 4000, width: 2000, height: 2400 };
const limits = { containerWeightLimit: 5000 };
const pallet = { length: 1000, width: 1000, height: 1200, weight: 500, quantity: 4 };

function checkLayout(result, c, limit) {
    assert.equal(result.valid, true);
    const placements = result.containerTotal.floorLayout.placements;
    const actualCounts = result.specs.map(() => 0);
    let count = 0, weight = 0, volume = 0;
    for (let i = 0; i < placements.length; i++) {
        const p = placements[i], spec = result.specs[p.specIndex];
        assert.ok(p.x >= 0 && p.y >= 0);
        assert.ok(p.x + p.l <= c.length + 1e-7 && p.y + p.w <= c.width + 1e-7);
        assert.ok(p.stackCount >= 1 && p.stackCount <= 2);
        assert.ok(spec.height * p.stackCount <= c.height + 1e-7);
        assert.ok((p.l === spec.length && p.w === spec.width) || (p.l === spec.width && p.w === spec.length));
        for (let j = 0; j < i; j++) {
            const q = placements[j];
            assert.ok(p.x + p.l <= q.x + 1e-7 || q.x + q.l <= p.x + 1e-7 ||
                p.y + p.w <= q.y + 1e-7 || q.y + q.w <= p.y + 1e-7, 'Pallet footprints overlap');
        }
        actualCounts[p.specIndex] += p.stackCount;
        count += p.stackCount;
        weight += p.stackCount * spec.weight;
        volume += p.stackCount * spec.length * spec.width * spec.height;
    }
    assert.equal(count, result.containerTotal.actualPallets);
    assert.ok(Math.abs(weight - result.containerTotal.totalWeight) < 1e-7);
    assert.ok(weight <= limit + 1e-7);
    assert.ok(Math.abs(result.containerTotal.spaceUtil - volume / (c.length * c.width * c.height) * 100) < 1e-7);
    result.mixedBreakdown.forEach((row, index) => {
        assert.equal(row.loaded, actualCounts[index]);
        assert.ok(row.loaded <= row.requested);
    });
    assert.equal(result.containerTotal.totalArea, null, 'Unknown SQM must not be invented');
}

const basic = calculate([pallet], container, limits);
checkLayout(basic, container, limits.containerWeightLimit);
assert.equal(basic.containerTotal.actualPallets, 4);
assert.equal(basic.containerTotal.totalWeight, 2000, 'Loaded weights already include all materials');
assert.equal(basic.containerTotal.upperPallets, 2);

const heavy = calculate([{ ...pallet, quantity: 20 }], container, { containerWeightLimit: 1250 });
checkLayout(heavy, container, 1250);
assert.equal(heavy.containerTotal.actualPallets, 2);
assert.equal(heavy.hasUnloaded, true);

// Equal counts should favor more loaded envelope volume.
const volumeTie = calculate([
    { length: 1000, width: 1000, height: 1800, weight: 800, quantity: 1 },
    { length: 1000, width: 1000, height: 2300, weight: 900, quantity: 1 },
], { length: 1000, width: 1000, height: 2400 }, limits);
assert.equal(volumeTie.mixedBreakdown[1].loaded, 1);
assert.ok(Math.abs(volumeTie.containerTotal.spaceUtil - 2300 / 2400 * 100) < 1e-7);

// Higher count takes priority over higher volume.
const countFirst = calculate([
    { length: 2000, width: 1000, height: 2400, weight: 800, quantity: 1 },
    { length: 1000, width: 1000, height: 1800, weight: 800, quantity: 2 },
], { length: 2000, width: 1000, height: 2400 }, limits);
assert.equal(countFirst.containerTotal.actualPallets, 2);
assert.equal(countFirst.mixedBreakdown[1].loaded, 2);

const tall = calculate([{ ...pallet, height: 1300, quantity: 12 }], container, { containerWeightLimit: 10000 });
checkLayout(tall, container, 10000);
assert.equal(tall.containerTotal.actualPallets, 8);
assert.equal(tall.containerTotal.upperPallets, 0);

for (const property of ['length', 'width', 'height', 'weight']) {
    for (const value of [NaN, Infinity, 0, -1]) {
        assert.equal(calculate([{ ...pallet, [property]: value }], container, limits).valid, false);
    }
}
for (const quantity of [0, -1, 1.5, NaN, 201]) {
    assert.equal(calculate([{ ...pallet, quantity }], container, limits).valid, false);
}
assert.equal(calculate([], container, limits).valid, false);
assert.equal(calculate([pallet], { ...container, width: NaN }, limits).valid, false);
assert.equal(calculate([pallet], container, { containerWeightLimit: NaN }).valid, false);
assert.equal(calculate([pallet], container, limits, 'cross').valid, false);
assert.equal(calculate([{ ...pallet, height: 2500 }], container, limits).valid, false);
assert.equal(calculate([{ ...pallet, weight: 5001 }], container, limits).valid, false);
assert.equal(calculate([pallet], container, { ...limits, boxWeightLimit: 0, palletWeightLimit: 0, auxiliaryWeight: 90000 }).containerTotal.totalWeight, 2000,
    'Hidden single-size limits must not affect loaded-pallet calculations');

const variants = [
    { ...pallet, length: 1200, width: 800, quantity: 6 },
    { ...pallet, length: 1100, width: 900, height: 1000, weight: 800, quantity: 5 },
    { ...pallet, length: 800, width: 600, height: 1600, weight: 300, quantity: 7 },
];
for (const mode of ['auto', 'H', 'V', 'mixed']) {
    const result = calculate(variants, container, limits, mode);
    checkLayout(result, container, limits.containerWeightLimit);
    if (mode === 'H' || mode === 'V') assert.ok(result.containerTotal.floorLayout.placements.every(p => p.orientation === mode));
}

// Existing single-pallet calculation still counts cartons and flooring area.
const singleInput = {
    floor: { length: 1210, width: 183, thickness: 4, padThickness: 0, density: 1.95 },
    box: { length: 1214, width: 187, height: 44, piecesPerBox: 10, packingAllowance: 4 },
    pallet: { length: 1220, width: 985, height: 160, selfWeight: 30 },
    container: { length: 5900, width: 2350, height: 2390 },
    limits: { boxWeightLimit: 25, palletWeightLimit: 1500, containerWeightLimit: 27000, auxiliaryWeight: 500 },
    layoutMode: 'auto', boxLayoutMode: 'auto',
};
const single = context.calculateAll(singleInput, false);
assert.equal(single.valid, true);
assert.equal(single.containerTotal.totalBoxes, 1445);
assert.ok(Math.abs(single.containerTotal.totalArea - 3199.6635) < 1e-7);
console.log('Loaded-pallet validation, weight totals, stacking, geometry, orientations and single-size regression passed.');
