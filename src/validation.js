function hasMaterials(beaker) {
  return beaker.water.amount > 0 && beaker.salt.amount > 0;
}

function evaluateSubmission(submission) {
  const { taskType, beakerA, beakerB, saltTiming, stirTiming } = submission;
  const errorTypes = [];

  if (!hasMaterials(beakerA) || !hasMaterials(beakerB)) {
    errorTypes.push('missing_materials');
    return {
      isCorrect: false,
      errorTypes
    };
  }

  if (
    beakerA.water.amount !== beakerB.water.amount ||
    beakerA.salt.amount !== beakerB.salt.amount
  ) {
    errorTypes.push('unequal_quantities');
  }

  if (taskType === 'water' || taskType === 'temp') {
    if (beakerA.water.type === beakerB.water.type) {
      errorTypes.push('target_not_varied');
    }
    if (
      beakerA.salt.type !== beakerB.salt.type ||
      beakerA.stir !== beakerB.stir
    ) {
      errorTypes.push('control_variables_mismatch');
    }
  } else if (taskType === 'salt' || taskType === 'size') {
    if (beakerA.salt.type === beakerB.salt.type) {
      errorTypes.push('target_not_varied');
    }
    if (
      beakerA.water.type !== beakerB.water.type ||
      beakerA.stir !== beakerB.stir
    ) {
      errorTypes.push('control_variables_mismatch');
    }
  } else if (taskType === 'stir') {
    if (beakerA.stir === beakerB.stir) {
      errorTypes.push('target_not_varied');
    }
    if (
      beakerA.water.type !== beakerB.water.type ||
      beakerA.salt.type !== beakerB.salt.type
    ) {
      errorTypes.push('control_variables_mismatch');
    }
  }

  if (beakerA.salt.amount > 0 && beakerB.salt.amount > 0 && saltTiming !== 'same') {
    errorTypes.push('salt_timing_mismatch');
  }

  if (beakerA.stir === 'yes' && beakerB.stir === 'yes' && stirTiming !== 'same') {
    errorTypes.push('stir_timing_mismatch');
  }

  return {
    isCorrect: errorTypes.length === 0,
    errorTypes
  };
}

module.exports = { evaluateSubmission };
