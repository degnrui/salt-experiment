const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateSubmission } = require('../src/validation');

function submission(overrides = {}) {
  return {
    taskType: 'stir',
    beakerA: {
      water: { type: 'cold', amount: 2 },
      salt: { type: 'fine', amount: 2 },
      stir: 'yes'
    },
    beakerB: {
      water: { type: 'cold', amount: 2 },
      salt: { type: 'fine', amount: 2 },
      stir: 'no'
    },
    saltTiming: 'same',
    stirTiming: null,
    ...overrides
  };
}

test('accepts a valid stirring comparison design', () => {
  assert.deepEqual(evaluateSubmission(submission()), {
    isCorrect: true,
    errorTypes: []
  });
});

test('reports missing materials', () => {
  const result = evaluateSubmission(submission({
    beakerB: {
      water: { type: 'cold', amount: 2 },
      salt: { type: null, amount: 0 },
      stir: 'no'
    }
  }));

  assert.equal(result.isCorrect, false);
  assert.deepEqual(result.errorTypes, ['missing_materials']);
});

test('reports all relevant experiment design errors together', () => {
  const result = evaluateSubmission(submission({
    beakerA: {
      water: { type: 'cold', amount: 2 },
      salt: { type: 'fine', amount: 2 },
      stir: 'yes'
    },
    beakerB: {
      water: { type: 'hot', amount: 3 },
      salt: { type: 'coarse', amount: 2 },
      stir: 'yes'
    },
    saltTiming: 'diff',
    stirTiming: 'diff'
  }));

  assert.deepEqual(result.errorTypes, [
    'unequal_quantities',
    'target_not_varied',
    'control_variables_mismatch',
    'salt_timing_mismatch',
    'stir_timing_mismatch'
  ]);
});

test('supports temperature and particle-size task rules', () => {
  const temperature = evaluateSubmission(submission({
    taskType: 'temp',
    beakerA: {
      water: { type: 'cold', amount: 2 },
      salt: { type: 'fine', amount: 2 },
      stir: 'no'
    },
    beakerB: {
      water: { type: 'hot', amount: 2 },
      salt: { type: 'fine', amount: 2 },
      stir: 'no'
    }
  }));
  const size = evaluateSubmission(submission({
    taskType: 'size',
    beakerA: {
      water: { type: 'cold', amount: 2 },
      salt: { type: 'fine', amount: 2 },
      stir: 'no'
    },
    beakerB: {
      water: { type: 'cold', amount: 2 },
      salt: { type: 'coarse', amount: 2 },
      stir: 'no'
    }
  }));

  assert.equal(temperature.isCorrect, true);
  assert.equal(size.isCorrect, true);
});
