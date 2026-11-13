import assert from 'node:assert/strict';

// Paper allocations. None of these checks is a measurement or a product approval.
const input = {
  boostOutputMaxV: 5.304,
  advertisedOutputA: 1.5,
  packFloorV: 3.15,
  auxiliaryA: 0.05,
  cellPublishedContinuousLimitA: 4.2,
  shuntTolerance: 0.01,
  thresholdResistorTolerance: 0.001,
  thresholdSourceMinA: 19.85e-6,
  thresholdSourceMaxA: 20.15e-6,
  thresholdErrorAllocationV: 0.0009,
  // INA300 §7.3.2, §7.3.7: subtract NAF when solving for effective trip voltage.
  noiseAdjustmentV: 0.0005,
};

function calculateScenario(shuntOhm, thresholdResistorOhm, converterInputMinV, efficiencyAllocation) {
  const shuntMin = shuntOhm * (1 - input.shuntTolerance);
  const shuntMax = shuntOhm * (1 + input.shuntTolerance);
  const thresholdMinV = input.thresholdSourceMinA * thresholdResistorOhm *
    (1 - input.thresholdResistorTolerance) - input.noiseAdjustmentV - input.thresholdErrorAllocationV;
  const thresholdMaxV = input.thresholdSourceMaxA * thresholdResistorOhm *
    (1 + input.thresholdResistorTolerance) - input.noiseAdjustmentV + input.thresholdErrorAllocationV;
  const tripMinA = thresholdMinV / shuntMax;
  const tripMaxA = thresholdMaxV / shuntMin;
  const requiredOutputW = input.boostOutputMaxV * input.advertisedOutputA;
  const requiredPackA = requiredOutputW / (converterInputMinV * efficiencyAllocation) + input.auxiliaryA;
  const inputPathMaxOhm = (input.packFloorV - converterInputMinV) / tripMaxA;

  return {
    shuntOhm, thresholdResistorOhm, converterInputMinV, efficiencyAllocation,
    requiredPackA,
    tripMinA,
    tripMaxA,
    minimumEfficiency: requiredOutputW / (converterInputMinV * (tripMinA - input.auxiliaryA)),
    marginAboveRatedLoadA: tripMinA - requiredPackA,
    marginBelowCellContinuousLimitA: input.cellPublishedContinuousLimitA - tripMaxA,
    inputPathMaxMilliOhm: inputPathMaxOhm * 1000,
    holderAndRoutingMaxMilliOhm: (inputPathMaxOhm - shuntMax - 0.020 - 0.010 - 0.008) * 1000,
    lossInShuntAtTripMaxW: tripMaxA ** 2 * shuntMax,
    overdriveAtCellContinuousLimitMilliV: (input.cellPublishedContinuousLimitA * shuntMin - thresholdMaxV) * 1000,
  };
}

const baseline = calculateScenario(0.010, 2000, 2.85, 0.75);
const lowerVin = calculateScenario(0.010, 2000, 2.70, 0.80);
const largerShunt = calculateScenario(0.015, 3000, 2.70, 0.80);
assert.ok(Math.abs(baseline.tripMinA - 3.788148514851485) < 1e-9);
assert.ok(baseline.overdriveAtCellContinuousLimitMilliV < 1);
assert.ok(largerShunt.overdriveAtCellContinuousLimitMilliV > 1);

const examples = {
  reverseTransientExampleMicroCoulomb: (5.19 - 5.10) / 0.20 * 20,
  r14CapacitorChargeExampleMicroCoulomb: 100 * (5.50 - 4.947),
  revisedRailCapacitorChargeExampleMicroCoulomb: 100 * (5.50 - 5.096),
};
console.log(JSON.stringify({ classification: 'PAPER_ALLOCATIONS', input, baseline, lowerVin, largerShunt, examples }, null, 2));
