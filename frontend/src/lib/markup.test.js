import assert from 'node:assert/strict'
import test from 'node:test'
import { parseBlocks, parseInline } from './markup.js'

test('paragraphs, bullet lists and numbered lists', () => {
  const blocks = parseBlocks('Intro line.\n\n- one\n- two\n\n1. first\n2. second')
  assert.deepEqual(blocks.map((b) => b.type), ['p', 'ul', 'ol'])
  assert.equal(blocks[1].items.length, 2)
  assert.equal(blocks[2].items.length, 2)
})

test('bold and citations become tokens', () => {
  const tokens = parseInline('The **key** fact[1].')
  assert.deepEqual(tokens.map((t) => t.type), ['text', 'bold', 'text', 'cite', 'text'])
  assert.equal(tokens[3].n, 1)
})

test('a line that starts with bold text is a paragraph, not a list', () => {
  assert.equal(parseBlocks('**Götze** scored.')[0].type, 'p')
})

test('markup characters are never turned into HTML', () => {
  const [block] = parseBlocks('<img src=x onerror=alert(1)> **b**')
  assert.equal(block.inline[0].text, '<img src=x onerror=alert(1)> ')
})