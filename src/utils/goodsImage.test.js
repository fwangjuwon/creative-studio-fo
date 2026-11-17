import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseGoodsCode, cropPixels, exportSize } from './goodsImage.js'

test('accepts product codes and only NSmall product URLs', () => {
  for (const value of ['36149436', ' https://m.nsmall.com/goods/36149436?foo=bar ', 'nsmall.com/goods/36149436']) {
    assert.equal(parseGoodsCode(value), '36149436')
  }
  for (const value of ['', '0', '../36149436', 'https://m.nsmall.com.evil.test/goods/36149436', 'https://user@m.nsmall.com/goods/36149436', 'https://m.nsmall.com:8080/goods/36149436', 'https://m.nsmall.com/not-goods/36149436']) {
    assert.equal(parseGoodsCode(value), null)
  }
})

test('maps selections on a scaled long image back to original pixel coordinates', () => {
  assert.deepEqual(cropPixels({ x: 0.25, y: 0.5, width: 0.5, height: 0.1 }, 2264, 32768),
    { x: 566, y: 16384, width: 1132, height: 3277 })
  assert.deepEqual(cropPixels({ x: 0.99, y: 0.99, width: 0.5, height: 0.5 }, 100, 200),
    { x: 99, y: 198, width: 1, height: 2 })
})

test('caps canvas exports without stretching or enlarging small crops', () => {
  assert.deepEqual(exportSize(800, 600), { width: 800, height: 600 })
  const huge = exportSize(12000, 8000)
  assert.ok(huge.width <= 4096 && huge.height <= 4096)
  assert.ok(huge.width * huge.height <= 12_010_000)
  assert.ok(Math.abs(huge.width / huge.height - 1.5) < 0.001)
})
