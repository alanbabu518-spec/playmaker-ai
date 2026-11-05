// router.test.js
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseRoute } from './router.js'

const id = 'e8a9bfb9-795f-4af1-8312-b7b24c18813d'

test('the three routes', () => {
  assert.deepEqual(parseRoute('/'), { name: 'landing', id: null })
  assert.deepEqual(parseRoute('/new/'), { name: 'new', id: null })
  assert.deepEqual(parseRoute(`/chat/${id}`), { name: 'chat', id })
})

test('chat ids are normalised and validated', () => {
  assert.equal(parseRoute(`/chat/${id.toUpperCase()}`).id, id)
  assert.equal(parseRoute('/chat/not-a-uuid').name, 'unknown')
  assert.equal(parseRoute(`/chat/${id}/extra`).name, 'unknown')
  assert.equal(parseRoute('/somewhere-else').name, 'unknown')
})