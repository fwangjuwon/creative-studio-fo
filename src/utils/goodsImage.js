/** Accept product codes or NSmall product URLs, never arbitrary fetch URLs. */
export function parseGoodsCode(input) {
  const value = String(input ?? '').trim()
  if (/^[1-9]\d{0,13}$/.test(value)) return value
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null
    if (!['m.nsmall.com', 'www.nsmall.com', 'nsmall.com'].includes(url.hostname)) return null
    return url.pathname.match(/^\/goods\/([1-9]\d{0,13})\/?$/)?.[1] ?? null
  } catch { return null }
}

export function cropPixels(selection, width, height) {
  const x = Math.max(0, Math.min(width - 1, Math.round(selection.x * width)))
  const y = Math.max(0, Math.min(height - 1, Math.round(selection.y * height)))
  return {
    x, y,
    width: Math.max(1, Math.min(width - x, Math.round(selection.width * width))),
    height: Math.max(1, Math.min(height - y, Math.round(selection.height * height))),
  }
}

export function exportSize(width, height) {
  const scale = Math.min(1, 4096 / Math.max(width, height), Math.sqrt(12_000_000 / (width * height)))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}
