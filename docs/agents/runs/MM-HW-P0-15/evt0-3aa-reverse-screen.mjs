import assert from 'node:assert/strict';

// Datasheet-conditioned screening, separate from the path through the battery.
const senseNominalOhm = 0.025;
const senseMinOhm = senseNominalOhm * 0.99;
const senseMaxOhm = senseNominalOhm * 1.01;
const forwardTripA = [0.040 / senseMaxOhm, 0.060 / senseMinOhm];
const reverseTripA = [0.001 / senseMaxOhm, 0.005 / senseMinOhm];
const reverseTimingStepA = 0.010 / senseMinOhm;
const exampleReverseA = 0.09 / 0.20;
const maxLoopOhmForTestStep = 0.09 / reverseTimingStepA;
const gateDelayMaxUs = 18;
const exampleChargeBeforeGateOffMicroC = exampleReverseA * gateDelayMaxUs;
const cableAndFetBudgetMilliOhm = 1000 * ((5.096 - 4.75) / 1.5 - 0.055 - senseMaxOhm);

const maxNominalOhmAtRatedLoad = 0.040 / (1.5 * 1.01);
const minNominalOhmToTripBy1p82A = 0.060 / (1.82 * 0.99);
assert.ok(forwardTripA[0] > 1.5 && forwardTripA[1] > 1.82);
assert.ok(maxNominalOhmAtRatedLoad < minNominalOhmToTripBy1p82A);
assert.ok(exampleReverseA > reverseTimingStepA);
assert.ok(0.09 / 0.30 < reverseTimingStepA);
assert.ok(0.01 / 0.20 < reverseTripA[1]);

console.log(JSON.stringify({
  classification: 'CONDITIONAL_SCREENING',
  forwardTripA, reverseTripA, reverseTimingStepA, maxLoopOhmForTestStep,
  exampleReverseA, exampleChargeBeforeGateOffMicroC, cableAndFetBudgetMilliOhm,
  maxNominalOhmAtRatedLoad, minNominalOhmToTripBy1p82A,
}, null, 2));
