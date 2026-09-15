/**
 * Minimal shared fetch wrapper for JSON APIs.
 * Keeps status/body available to feature services.
 */
export async function requestJson(url, init = {}) {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}
