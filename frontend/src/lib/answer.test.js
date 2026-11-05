import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanSnippet, prepareAnswer, toPlainText } from './answer.js'

const source = (id) => ({ id, title: `Page ${id}`, url: 'https://x', snippet: `Page ${id} - Intro\nText ${id}`, cited: true })

test('citations are renumbered by order of appearance', () => {
  const { text, used, checked } = prepareAnswer({
    answer: 'Won by X [5]. Scored by Y [2][5].',
    sources: [source(2), source(5), source(7)],
  })
  assert.equal(text, 'Won by X[1]. Scored by Y[2][1].')
  assert.deepEqual(used.map((u) => [u.n, u.source.id]), [[1, 5], [2, 2]])
  assert.deepEqual(checked.map((s) => s.id), [7])
})

test('a marker with no matching source is dropped', () => {
  const { text, used } = prepareAnswer({ answer: 'A [9] b [1].', sources: [source(1)] })
  assert.equal(text, 'A b[1].')
  assert.equal(used.length, 1)
})

test('toPlainText removes bold markers but keeps citations', () => {
  assert.equal(toPlainText('**Götze** scored [1]'), 'Götze scored [1]')
})

test('cleanSnippet drops the title line and marks truncation', () => {
  assert.equal(cleanSnippet('Page - Intro\nSome   text'), 'Some text')
  assert.ok(cleanSnippet(`T - S\n${'x'.repeat(300)}`).endsWith('…'))
})