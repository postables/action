import {MAX_INT} from './constants'
import ensureDate from './ensureDate'

const thresholds = {
  second: 1000,
  minute: 60000,
  hour: 3600000,
  day: 86400000,
  week: 604800000,
  month: 2592000000,
  year: 31536000000,
  inf: Infinity
}
// For 2m20s returns 40s, for 4h15m returns 45m etc.
export default function getRefreshPeriod (maybeTime) {
  const time = ensureDate(maybeTime)
  const msElapsed = Date.now() - time || 0
  const threshKeys = Object.keys(thresholds)
  for (let i = 1; i < threshKeys.length; i++) {
    const thresh = thresholds[threshKeys[i]]
    if (msElapsed < thresh) {
      const largestUnit = thresholds[threshKeys[i - 1]]
      const minimum = 30 * thresholds.second
      const minVal = Math.max(largestUnit - (msElapsed % largestUnit), minimum)
      return Math.min(minVal, MAX_INT)
    }
  }
  throw new Error('Infinite timestamp calculated!')
}
