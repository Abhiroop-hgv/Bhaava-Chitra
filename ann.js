function feedForward(pixels) {
  // Randomly initialize the weights and biases
  const hiddenLayerWeights = initializeWeights(10, pixels.length);
  const outputLayerWeights = initializeWeights(6, 11);

  // Perform the feed forward computation
  const hiddenLayerOutput = calculateHiddenLayerOutput(pixels, hiddenLayerWeights);
  const outputLayerOutput = calculateOutputLayerOutput(hiddenLayerOutput, outputLayerWeights);

  // Find the index of the maximum value in the output layer
  const maxIndex = findMaxIndex(outputLayerOutput);

  // Return the index
  return maxIndex;
}

function initializeWeights(rows, cols) {
  const weights = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(Math.random());
    }
    weights.push(row);
  }
  return weights;
}

function calculateHiddenLayerOutput(pixels, hiddenLayerWeights) {
  const hiddenLayerOutput = [];
  for (let i = 0; i < hiddenLayerWeights.length; i++) {
    let sum = 0;
    for (let j = 0; j < pixels.length; j++) {
      sum += pixels[j] * hiddenLayerWeights[i][j];
      //console.log(sum);
    }
    sum += hiddenLayerWeights[i][pixels.length]; // Bias term
    
    hiddenLayerOutput.push(1 / (1 + Math.exp(-sum))); // Apply sigmoid activation function
  }
  //console.log(hiddenLayerOutput);
  return hiddenLayerOutput;
}

function calculateOutputLayerOutput(hiddenLayerOutput, outputLayerWeights) {
  const outputLayerOutput = [];
  for (let i = 0; i < outputLayerWeights.length; i++) {
    let sum = 0;
    for (let j = 0; j < hiddenLayerOutput.length; j++) {
      sum += hiddenLayerOutput[j] * outputLayerWeights[i][j];
    }
    sum += outputLayerWeights[i][hiddenLayerOutput.length]; // Bias term
    outputLayerOutput.push(1 / (1 + Math.exp(-sum))); // Apply sigmoid activation function
  }
  return outputLayerOutput;
}

function findMaxIndex(arr) {
  let maxIndex = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[maxIndex]) {
      maxIndex = i;
    }
  }
  return maxIndex;
}

module.exports = feedForward;
