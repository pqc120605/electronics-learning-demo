import assert from 'node:assert/strict';

const outputW = 5.304 * 1.5;
const auxiliaryA = 0.05;
const tripMinA = 3.81969835203222;
const tripMaxA = 4.117831579836904;
const fixedPathOhm = 0.015 * (1 + 0.013875) + 0.020 + 0.010 + 0.008;

function atInput(inputV, loadedPackV) {
  const loadA = outputW / (inputV * 0.75) + auxiliaryA;
  return {
    inputV, loadedPackV, loadA,
    loadMarginA: tripMinA - loadA,
    efficiencyAtTrip: outputW / (inputV * (tripMinA - auxiliaryA)),
    holderAndCopperOhm: (loadedPackV - inputV) / tripMaxA - fixedPathOhm,
  };
}

const earlier = atInput(2.70, 3.15);
const raised = atInput(3.10, 3.60);
assert.ok(earlier.loadMarginA < 0);
assert.ok(raised.loadMarginA > 0.34);
assert.ok(raised.holderAndCopperOhm > 0.068);

// Budget after paying the overdrive required by the comparator timing test.
const cellOverdriveV = 0.005 * 2;
const cellDynamicBudgetMs = (0.90 - 0.80 - 0.020 - cellOverdriveV) / 0.050;
assert.ok(Math.abs(cellDynamicBudgetMs - 1.4) < 1e-9);

// Necessary forward-voltage allocation for a series diode as a second layer.
const diodeForwardBudgetV = 5.096 - 4.75 - 1.5 * 0.055;
assert.ok(diodeForwardBudgetV < 0.360);

console.log(JSON.stringify({
  classification: 'PAPER_ALLOCATIONS', earlier, raised, cellOverdriveV,
  cellDynamicBudgetMs, diodeForwardBudgetV,
}, null, 2));
