import assert from 'node:assert/strict'
import test from 'node:test'
import { isSubmitKey } from './keys.js'

test('Enter sends', () => assert.equal(isSubmitKey({ key: 'Enter' }), true))
test('Ctrl+Enter and Cmd+Enter send', () => {
  assert.equal(isSubmitKey({ key: 'Enter', ctrlKey: true }), true)
  assert.equal(isSubmitKey({ key: 'Enter', metaKey: true }), true)
})
test('Shift+Enter and Alt+Enter add a new line', () => {
  assert.equal(isSubmitKey({ key: 'Enter', shiftKey: true }), false)
  assert.equal(isSubmitKey({ key: 'Enter', altKey: true }), false)
})
test('Enter during IME composition is left to the IME', () => {
  assert.equal(isSubmitKey({ key: 'Enter', isComposing: true }), false)
  assert.equal(isSubmitKey({ key: 'Enter', keyCode: 229 }), false)
})
test('other keys do not send', () => assert.equal(isSubmitKey({ key: 'a' }), false))