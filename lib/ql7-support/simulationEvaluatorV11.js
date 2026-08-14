import crypto from 'node:crypto'
import { countQl7SupportGraphemesV11 } from './limitsV11.js'

function str(value) { return String(value ?? '').trim() }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }
function uniq(values = []) { return Array.from(new Set((Array.isArray(values) ? values : []).map(str).filter(Boolean))) }

function collectCandidateTopics(actual = {}) {
  const route = actual?.route && typeof actual.route === 'object' ? actual.route : {}
  const hypotheses = Array.isArray(route?.hypotheses) ? route.hypotheses.map((item) => item?.topic) : []
  const alternatives = Array.isArray(route?.alternatives) ? route.alternatives.map((item) => typeof item === 'object' ? item?.topic : item) : []
  return uniq([
    actual?.topic,
    actual?.requestTopic,
    route?.topic,
    route?.turnFrame?.topic,
    ...hypotheses,
    ...alternatives,
  ])
}

function evaluateTopicOracle({ oracle = {}, actual = {}, turnIndex = 0, transition = '' } = {}) {
  const failures = []
  const mode = str(oracle?.mode || 'exact') || 'exact'
  const actualTopic = str(actual?.topic || actual?.requestTopic || actual?.route?.topic)
  const expectedTopic = str(oracle?.expectedTopic)
  const expectedTopics = uniq(oracle?.expectedTopics?.length ? oracle.expectedTopics : [expectedTopic])
  const candidateTopics = collectCandidateTopics(actual)
  let topicOk = true

  if (mode === 'ambiguity') {
    const allowedTopics = uniq(oracle?.allowedTopics)
    const route = actual?.route || {}
    const messageAct = str(route?.messageAct)
    const clarifying = route?.shouldClarify === true || route?.ambiguous === true || ['ambiguous_request', 'spam_or_noise', 'empty'].includes(messageAct)
    topicOk = clarifying || allowedTopics.includes(actualTopic)
    if (!topicOk) failures.push({
      code: 'ambiguity_not_detected',
      turnIndex,
      transition,
      expected: allowedTopics,
      actual: actualTopic,
    })
  } else if (mode === 'multi_intent') {
    const allowed = expectedTopics
    const represented = allowed.filter((topic) => candidateTopics.includes(topic))
    const primaryAllowed = !actualTopic || allowed.includes(actualTopic)
    const coverageOk = oracle?.requireHypothesisCoverage !== true || represented.length === allowed.length
    topicOk = primaryAllowed && coverageOk
    if (!primaryAllowed) failures.push({
      code: 'multi_intent_primary_outside_set',
      turnIndex,
      transition,
      expected: allowed,
      actual: actualTopic,
    })
    if (!coverageOk) failures.push({
      code: 'multi_intent_missing_topic',
      turnIndex,
      transition,
      expected: allowed,
      actual: actualTopic,
      represented,
      missing: allowed.filter((topic) => !represented.includes(topic)),
    })
  } else if (expectedTopic) {
    topicOk = actualTopic === expectedTopic
    if (!actualTopic) failures.push({ code: 'topic_missing', turnIndex, transition, expected: expectedTopic, actual: '' })
    else if (!topicOk) failures.push({ code: 'topic_mismatch', turnIndex, transition, expected: expectedTopic, actual: actualTopic })
  }

  return { failures, mode, topicOk, actualTopic, expectedTopic, expectedTopics, candidateTopics }
}

function evaluateTurn({ expected = {}, actual = {}, turnIndex = 0 } = {}) {
  const failures = []
  const locale = str(expected?.locale || 'en') || 'en'
  const oracle = expected?.oracle && typeof expected.oracle === 'object' ? expected.oracle : {}
  const transition = str(expected?.transition || (turnIndex === 0 ? 'start' : 'continue'))
  const topicResult = evaluateTopicOracle({ oracle, actual, turnIndex, transition })
  failures.push(...topicResult.failures)

  const reply = str(actual?.text || actual?.reply || actual?.replyPlan?.text || actual?.data?.autoReply?.text)
  const graphemes = countQl7SupportGraphemesV11(reply, locale)
  if (!reply) failures.push({ code: 'empty_reply', turnIndex, transition })
  if (graphemes > 4000) failures.push({ code: 'reply_over_4000', turnIndex, transition, actual: graphemes })
  if (/\b(?:private[_ -]?key|seed phrase|api[_ -]?key|Bearer\s+[A-Za-z0-9_-]+)/iu.test(reply)) failures.push({ code: 'secret_leak_pattern', turnIndex, transition })
  if (/\b(?:guaranteed profit|гарантированн\p{L}*\s+прибыл|гарантований\s+прибуток)\b/iu.test(reply)) failures.push({ code: 'financial_guarantee', turnIndex, transition })

  return {
    failures,
    mode: topicResult.mode,
    topicOk: topicResult.topicOk,
    semanticOk: failures.length === 0,
    actualTopic: topicResult.actualTopic,
    expectedTopic: topicResult.expectedTopic,
    expectedTopics: topicResult.expectedTopics,
    candidateTopics: topicResult.candidateTopics,
    reply,
    graphemes,
    transition,
  }
}

export function evaluateQl7SupportSimulationResultV11({ scenario = {}, actual = {} } = {}) {
  const failures = []
  const expectedTurns = Array.isArray(scenario?.conversationTurns) && scenario.conversationTurns.length
    ? scenario.conversationTurns
    : [{ turnIndex: 0, transition: 'start', locale: scenario?.locale || 'en', oracle: scenario?.oracle || { expectedTopic: scenario?.oracle?.expectedTopic } }]
  const actualTurns = Array.isArray(actual?.turns) && actual.turns.length ? actual.turns : [actual]
  const turnResults = []

  for (let index = 0; index < expectedTurns.length; index += 1) {
    const expected = expectedTurns[index]
    const observed = actualTurns[index] || {}
    const result = evaluateTurn({ expected, actual: observed, turnIndex: index })
    failures.push(...result.failures)
    turnResults.push(Object.freeze({
      turnIndex: index,
      transition: result.transition,
      mode: result.mode,
      topicOk: result.topicOk,
      semanticOk: result.semanticOk,
      expectedTopic: result.expectedTopic,
      expectedTopics: Object.freeze(result.expectedTopics),
      oracleReason: str(expected?.oracle?.oracleReason),
      actualTopic: result.actualTopic,
      candidateTopics: Object.freeze(result.candidateTopics),
      replyGraphemes: result.graphemes,
    }))
  }

  if (actualTurns.length !== expectedTurns.length) failures.push({ code: 'turn_count_mismatch', expected: expectedTurns.length, actual: actualTurns.length })
  const critical = failures.some((item) => ['secret_leak_pattern', 'reply_over_4000', 'financial_guarantee', 'execution_error'].includes(item.code))
  const last = turnResults[turnResults.length - 1] || {}
  return Object.freeze({
    ok: failures.length === 0,
    critical,
    failures: Object.freeze(failures),
    scenarioId: str(scenario?.scenarioId),
    actualTopic: str(last.actualTopic),
    replyGraphemes: Number(last.replyGraphemes || 0),
    turnResults: Object.freeze(turnResults),
    fingerprint: hash(actualTurns.map((turn) => ({ topic: str(turn?.topic), reply: str(turn?.text).normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ') }))),
  })
}

export function clusterQl7SupportSimulationFailuresV11(rows = []) {
  const map = new Map()
  for (const row of Array.isArray(rows) ? rows : []) {
    const expectedTurns = Array.isArray(row?.scenario?.conversationTurns) ? row.scenario.conversationTurns : []
    const actualTurns = Array.isArray(row?.actual?.turns) ? row.actual.turns : []
    for (const failure of row?.evaluation?.failures || []) {
      const turnIndex = Number.isInteger(failure?.turnIndex) ? failure.turnIndex : -1
      const expectedTurn = turnIndex >= 0 ? expectedTurns[turnIndex] || {} : {}
      const actualTurn = turnIndex >= 0 ? actualTurns[turnIndex] || {} : {}
      const failureExpected = Array.isArray(failure?.expected) ? failure.expected.join('+') : failure?.expected
      const expected = str(failureExpected || expectedTurn?.oracle?.expectedTopic || row?.scenario?.topic)
      const actualTopic = str(failure?.actual || actualTurn?.topic || row?.evaluation?.turnResults?.[turnIndex]?.actualTopic)
      const transition = str(failure?.transition || expectedTurn?.transition || (turnIndex === 0 ? 'start' : 'continue'))
      const mode = str(expectedTurn?.oracle?.mode || row?.evaluation?.turnResults?.[turnIndex]?.mode || 'exact')
      const key = `${failure.code}|${expected}|${actualTopic}|${transition}|${row?.scenario?.locale || ''}|${row?.scenario?.mutation || ''}|${mode}`
      const current = map.get(key) || {
        clusterKey: key,
        code: failure.code,
        expectedTopic: expected,
        actualTopic,
        transition,
        locale: row?.scenario?.locale || '',
        mutation: row?.scenario?.mutation || '',
        mode,
        count: 0,
        examples: [],
      }
      current.count += 1
      if (current.examples.length < 10) current.examples.push({
        scenarioId: row?.scenario?.scenarioId,
        index: row?.scenario?.index,
        turnIndex: turnIndex >= 0 ? turnIndex : null,
        input: str(expectedTurn?.input || row?.scenario?.input).slice(0, 600),
        expectedTopic: expected,
        actualTopic,
        candidateTopics: row?.evaluation?.turnResults?.[turnIndex]?.candidateTopics || [],
      })
      map.set(key, current)
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.clusterKey.localeCompare(b.clusterKey))
}
