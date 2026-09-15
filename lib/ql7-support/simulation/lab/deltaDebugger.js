export const QL7_SUPPORT_DELTA_DEBUGGER_VERSION = '5.1.1'

export async function minimizeFailure({
  input = '',
  fails,
  maxChecks = 10000,
} = {}) {
  if (typeof fails !== 'function') throw new Error('fails_function_required')

  const original = String(input)
  let tokens = original.split(/\s+/u).filter(Boolean)
  let checks = 1
  if (!(await fails(tokens.join(' ')))) {
    return Object.freeze({
      reproduces: false,
      input: original,
      tokenCount: tokens.length,
      checks,
    })
  }

  for (
    let size = Math.max(1, Math.floor(tokens.length / 2));
    size >= 1 && checks < maxChecks;
    size = Math.floor(size / 2)
  ) {
    let changed = true
    while (changed && checks < maxChecks) {
      changed = false
      for (let index = 0; index + size <= tokens.length && checks < maxChecks; index += 1) {
        const candidate = [...tokens.slice(0, index), ...tokens.slice(index + size)]
        if (!candidate.length) continue
        checks += 1
        if (await fails(candidate.join(' '))) {
          tokens = candidate
          changed = true
          break
        }
      }
    }
    if (size === 1) break
  }

  return Object.freeze({
    reproduces: true,
    input: tokens.join(' '),
    tokenCount: tokens.length,
    originalTokenCount: original.split(/\s+/u).filter(Boolean).length,
    checks,
    bounded: checks <= maxChecks,
  })
}
