import { TIMELINE, ramp } from '../../lib/cinematicTimeline'

// Distance the car has covered on the circuit. The scroll position sets the
// base, and once the circuit is on screen the car keeps cruising in real time.
export const driveState = { distance: 0, cruise: 0 }

const SCROLL_DISTANCE = 46
const CRUISE_SPEED = 16

export function updateDrive(progress, delta, reduced) {
  const [start, end] = TIMELINE.drive
  const scrolled = ramp(progress, start, end) * SCROLL_DISTANCE
  const onTrack = progress > start
  if (onTrack && !reduced) driveState.cruise += Math.min(delta, 0.1) * CRUISE_SPEED * ramp(progress, start, start + 0.03)
  else if (!onTrack) driveState.cruise = 0
  driveState.distance = scrolled + driveState.cruise
}
