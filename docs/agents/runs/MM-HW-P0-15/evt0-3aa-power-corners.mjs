import assert from 'node:assert/strict';

const loadA = 5.304 * 1.5 / (2.70 * 0.80) + 0.05;
const cellLimitA = 4.2;
const nominalShuntOhm = 0.015;
const thresholdMinV = 19.85e-6 * 3000 * 0.999 - 0.0005 - 0.0009;
const thresholdMaxV = 20.15e-6 * 3000 * 1.001 - 0.0005 + 0.0009;
const maxShuntTolerance = Math.min(
  thresholdMinV / (nominalShuntOhm * loadA) - 1,
  1 - (thresholdMaxV + 0.001) / (nominalShuntOhm * cellLimitA),
);
const componentAllocation = 0.005 + 75e-6 * 45 + 0.0025;
const assemblyAllocation = 0.003;
const shuntTolerance = componentAllocation + assemblyAllocation;
const tripMinA = thresholdMinV / (nominalShuntOhm * (1 + shuntTolerance));
const tripMaxA = thresholdMaxV / (nominalShuntOhm * (1 - shuntTolerance));
const overdriveMilliV = 1000 * (cellLimitA * nominalShuntOhm * (1 - shuntTolerance) - thresholdMaxV);
const holderAndCopperMilliOhm = 1000 * ((3.15 - 2.70) / tripMaxA -
  nominalShuntOhm * (1 + shuntTolerance) - 0.020 - 0.010 - 0.008);
assert.ok(shuntTolerance < maxShuntTolerance);
assert.ok(loadA < tripMinA && tripMaxA < cellLimitA && overdriveMilliV > 1);

// Ideal tap-level faults. Analog leakage, filtering and faults upstream of the sense resistors are excluded.
const taps = [0, 1.15, 2.32, 3.50];
const minCellV = 0.95;
const canRun = (values) => values.slice(1).every((value, index) => value - values[index] >= minCellV);
assert.ok(canRun(taps));
let modeledTapFaults = 0;
for (const index of [1, 2, 3]) {
  for (const peer of [0, 1, 2, 3]) {
    if (peer === index) continue;
    const fault = [...taps];
    fault[index] = taps[peer];
    assert.ok(!canRun(fault));
    modeledTapFaults++;
  }
}
for (const index of [1, 2, 3]) {
  const fault = [...taps];
  fault[index] = 0; // Ideal pull-down after an open sense line.
  assert.ok(!canRun(fault));
  modeledTapFaults++;
}

console.log(JSON.stringify({
  classification: 'PAPER_ALLOCATIONS',
  loadA, componentAllocation, assemblyAllocation, shuntTolerance, maxShuntTolerance,
  tripMinA, tripMaxA, overdriveMilliV, holderAndCopperMilliOhm, modeledTapFaults,
  copperAndCableMilliOhmAfterPowerSwitches: 1000 * ((5.096 - 4.75) / 1.5 - 0.055 - 0.045),
  fastReverseDetectionStepMilliV: 1.3 * 36.45,
  cellCutTimeAllocationMicroseconds: 1000 * (0.90 - 0.80 - 0.020) / 0.050,
}, null, 2));
