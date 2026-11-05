// chats.test.js
import assert from 'node:assert/strict'
import test from 'node:test'
import { addTurn, groupByDay, isTurn, removeChat, replaceTurn, titleFrom } from './chats.js'

const answer = (text = 'Argentina won [1].') => ({
  answer: text,
  answered: true,
  sources: [{ id: 1, title: 'T', url: 'https://example.org/t', snippet: 's', cited: true }],
})
const turn = (id, question = 'Who won?') => ({ id, question, topK: 5, createdAt: 1, result: answer() })

test('the first answer creates a chat titled after the question', () => {
  const chats = addTurn([], 'a', turn('t1', 'Who won the 2022 final?'), 100)
  assert.equal(chats.length, 1)
  assert.equal(chats[0].title, 'Who won the 2022 final?')
  assert.equal(chats[0].turns.length, 1)
})

test('later answers join the same chat, and it moves to the top', () => {
  let chats = addTurn([], 'a', turn('t1'), 100)
  chats = addTurn(chats, 'b', turn('t2', 'Other?'), 200)
  chats = addTurn(chats, 'a', turn('t3'), 300)
  assert.deepEqual(chats.map((c) => c.id), ['a', 'b'])
  assert.equal(chats[0].turns.length, 2)
})

test('replaceTurn swaps one turn in place', () => {
  let chats = addTurn([], 'a', turn('t1'), 100)
  chats = addTurn(chats, 'a', turn('t2', 'Second?'), 200)
  chats = replaceTurn(chats, 'a', 't1', { ...turn('t9'), result: answer('New text') }, 300)
  assert.deepEqual(chats[0].turns.map((t) => t.id), ['t9', 't2'])
})

test('removeChat drops one chat', () => {
  const chats = addTurn(addTurn([], 'a', turn('t1'), 1), 'b', turn('t2'), 2)
  assert.deepEqual(removeChat(chats, 'a').map((c) => c.id), ['b'])
})

test('a chat keeps only its most recent 20 turns', () => {
  let chats = []
  for (let i = 0; i < 25; i++) chats = addTurn(chats, 'a', turn(`t${i}`), i)
  assert.equal(chats[0].turns.length, 20)
  assert.equal(chats[0].turns[0].id, 't5')
})

test('isTurn rejects source links that are not https', () => {
  const bad = { ...turn('t1'), result: { ...answer(), sources: [{ id: 1, title: 'T', url: 'javascript:alert(1)', snippet: 's', cited: true }] } }
  assert.equal(isTurn(bad), false)
  assert.equal(isTurn(turn('t1')), true)
})

test('titleFrom shortens long questions', () => {
  assert.equal(titleFrom('  Who   won? '), 'Who won?')
  assert.ok(titleFrom('x'.repeat(100)).length <= 58)
})

test('groupByDay sorts chats under day labels', () => {
  const now = new Date(2026, 10, 3, 15, 0).getTime()
  const at = (daysAgo, hour) => new Date(2026, 10, 3 - daysAgo, hour).getTime()
  const chat = (id, updatedAt) => ({ id, title: id, createdAt: updatedAt, updatedAt, turns: [] })
  const groups = groupByDay([chat('a', at(0, 10)), chat('b', at(1, 20)), chat('c', at(4, 9)), chat('d', at(30, 9))], now)
  assert.deepEqual(groups.map((g) => g.label), ['Today', 'Yesterday', 'Previous 7 days', 'Older'])
  assert.deepEqual(groups.map((g) => g.chats[0].id), ['a', 'b', 'c', 'd'])
})