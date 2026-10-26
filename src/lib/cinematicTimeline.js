// Shared scroll timeline for the cinematic story. Every window is expressed in
// story progress (0 at the top of the pinned section, 1 at its end) so the DOM
// panels, camera, car rig and environments all read from the same schedule.

export const clamp01 = (value) => Math.min(1, Math.max(0, value))
export const smooth = (value) => value * value * (3 - 2 * value)
export const ramp = (progress, start, end) => smooth(clamp01((progress - start) / (end - start)))

// Rises over [inStart, inEnd], holds, then falls over [outStart, outEnd].
export const pulse = (progress, inStart, inEnd, outStart, outEnd) =>
  Math.min(ramp(progress, inStart, inEnd), 1 - ramp(progress, outStart, outEnd))

// Panel N becomes active once progress passes STAGE_THRESHOLDS[N - 1].
export const STAGE_THRESHOLDS = [0.07, 0.25, 0.42, 0.56, 0.68, 0.84]
export const STAGE_COUNT = STAGE_THRESHOLDS.length + 1

export const TIMELINE = {
  explode: {
    parts: {
      frontBumper: [0.1, 0.13],
      hood: [0.115, 0.145],
      fenders: [0.125, 0.155],
      doors: [0.135, 0.165],
      roof: [0.15, 0.18],
      rear: [0.16, 0.195],
    },
    reassemble: [0.21, 0.248],
  },
  xray: {
    fadeIn: [0.255, 0.29],
    scan: [0.255, 0.33],
    components: [0.29, 0.385],
    restore: [0.385, 0.415],
  },
  wheel: {
    out: [0.45, 0.478],
    separate: [0.478, 0.508],
    returnStart: 0.528,
    returnEnd: 0.556,
  },
  cockpit: {
    displays: [0.765, 0.8],
    lighting: [0.75, 0.79],
  },
  drive: [0.855, 1],
}

// Weights for the three environments. They always sum to 1.
export function environmentWeights(progress) {
  const toCarbon = ramp(progress, 0.532, 0.6)
  const toTrack = ramp(progress, 0.842, 0.892)
  return {
    studio: 1 - toCarbon,
    carbon: toCarbon * (1 - toTrack),
    track: toTrack,
  }
}

export function getStage(progress) {
  const next = STAGE_THRESHOLDS.findIndex((threshold) => progress < threshold)
  return next === -1 ? STAGE_THRESHOLDS.length : next
}
