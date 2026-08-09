import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "/models";
const MATCH_THRESHOLD = 0.45;
let modelsPromise = null;

export const loadFaceRecognitionModels = () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  }

  return modelsPromise;
};

export const getFaceDescriptor = async (input) => {
  await loadFaceRecognitionModels();
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  return {
    descriptor: Array.from(detection.descriptor),
    box: {
      x: detection.detection.box.x,
      y: detection.detection.box.y,
      width: detection.detection.box.width,
      height: detection.detection.box.height,
    },
  };
};

export const averageDescriptors = (descriptors) => {
  if (descriptors.length === 0) return null;

  const length = descriptors[0].length;
  const totals = new Array(length).fill(0);

  descriptors.forEach((descriptor) => {
    descriptor.forEach((value, index) => {
      totals[index] += value;
    });
  });

  return totals.map((total) => total / descriptors.length);
};

export const descriptorDistance = (firstDescriptor, secondDescriptor) => {
  if (!firstDescriptor || !secondDescriptor || firstDescriptor.length !== secondDescriptor.length) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.sqrt(
    firstDescriptor.reduce((total, value, index) => {
      const difference = value - secondDescriptor[index];
      return total + difference * difference;
    }, 0)
  );
};

export const findBestFaceMatch = (descriptor, users, threshold = MATCH_THRESHOLD) => {
  const candidates = users
    .filter((user) => Array.isArray(user.faceDescriptor))
    .map((user) => ({
      user,
      distance: descriptorDistance(descriptor, user.faceDescriptor),
    }))
    .sort((first, second) => first.distance - second.distance);

  const best = candidates[0] || null;
  if (!best || best.distance > threshold) {
    return {
      matched: false,
      user: null,
      distance: best ? best.distance : null,
      threshold,
    };
  }

  return {
    matched: true,
    user: best.user,
    distance: best.distance,
    threshold,
  };
};

export const collectFaceDescriptors = async (videoElement, sampleCount = 8, delayMs = 50) => {
  const descriptors = [];
  const maxAttempts = sampleCount * 4;
  let attempts = 0;

  while (descriptors.length < sampleCount && attempts < maxAttempts) {
    attempts += 1;
    const result = await getFaceDescriptor(videoElement);
    if (result?.descriptor) {
      descriptors.push(result.descriptor);
    }

    if (descriptors.length < sampleCount) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }

  return averageDescriptors(descriptors);
};

export const getFaceQuality = (box, video) => {
  if (!box || !video?.videoWidth || !video?.videoHeight) {
    return { ready: false, message: "No clear face detected." };
  }

  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;
  const frameCenterX = video.videoWidth / 2;
  const frameCenterY = video.videoHeight / 2;
  const centerOffsetX = Math.abs(faceCenterX - frameCenterX) / video.videoWidth;
  const centerOffsetY = Math.abs(faceCenterY - frameCenterY) / video.videoHeight;
  const faceWidthRatio = box.width / video.videoWidth;
  const faceHeightRatio = box.height / video.videoHeight;

  if (centerOffsetX > 0.18 || centerOffsetY > 0.2) {
    return { ready: false, message: "Center your face in the box." };
  }

  if (faceWidthRatio < 0.18 || faceHeightRatio < 0.24) {
    return { ready: false, message: "Move closer to the camera." };
  }

  if (faceWidthRatio > 0.48 || faceHeightRatio > 0.62) {
    return { ready: false, message: "Move slightly back from the camera." };
  }

  return { ready: true, message: "Perfect face position." };
};

export { MATCH_THRESHOLD };
