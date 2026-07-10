/**
 * RF channel plan generation.
 *
 * Channels are spaced by a fixed step (in kHz) starting from a base frequency.
 * Math is done in whole hertz to avoid floating-point drift across many
 * channels (e.g. 6.25 kHz steps).
 */

export interface RfChannel {
  /** 1-based channel number. */
  index: number
  /** Frequency in whole hertz. */
  hz: number
  /** Frequency in MHz, formatted for display. */
  mhz: string
}

/** Common channel spacings in kHz. */
export const STEP_PRESETS_KHZ = [6.25, 12.5, 25, 50] as const

export const MAX_CHANNELS = 1000

/** Format a frequency in hertz as MHz, trimming trailing zeros. */
export function formatMHz(hz: number): string {
  return (hz / 1_000_000).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * Build a channel plan: `count` channels spaced `stepKHz` apart, starting at
 * `startMHz` (channel 1). Throws on invalid input.
 */
export function generateChannels(
  startMHz: number,
  stepKHz: number,
  count: number,
): RfChannel[] {
  if (!Number.isFinite(startMHz) || startMHz <= 0) {
    throw new Error('Enter a frequency in MHz greater than 0.')
  }
  if (!Number.isFinite(stepKHz) || stepKHz <= 0) {
    throw new Error('Step must be greater than 0 kHz.')
  }
  if (!Number.isInteger(count) || count < 1 || count > MAX_CHANNELS) {
    throw new Error(`Number of channels must be between 1 and ${MAX_CHANNELS}.`)
  }

  const startHz = Math.round(startMHz * 1_000_000)
  const stepHz = stepKHz * 1000

  return Array.from({ length: count }, (_, i) => {
    const hz = Math.round(startHz + i * stepHz)
    return { index: i + 1, hz, mhz: formatMHz(hz) }
  })
}
