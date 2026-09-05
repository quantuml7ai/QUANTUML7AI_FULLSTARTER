import { describe, expect, it } from 'vitest'
import { analyzeQl7SupportTurn } from '../../../lib/ql7-support/semantics/analyzeTurn.js'
import { classifyQl7SupportGeneralTopic } from '../../../lib/ql7-support/knowledge/generalKnowledgeRegistry.js'
import { buildQl7SupportPublicFigureKnowledgeGraph, QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH } from '../../../lib/ql7-support/knowledge/publicFigureKnowledgeGraph.js'

describe('canonical canonical canonical-matrix performance closure', () => {
  it('keeps a bare ecosystem label on the canonical domain path without creating an open-human topic', () => {
    const turn=analyzeQl7SupportTurn({text:'QCoin',locale:'en',conversationId:'canonical-matrix',turnId:'qcoin'})
    expect(turn.analysis).toMatchObject({topic:'qcoin'})
    expect(turn.analysis.generalTopic).toBeNull()
    expect(turn.analysis.publicFigureKnowledgeGraph.graphHash).toBe(QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH.graphHash)
  })

  it('preserves public-figure and open-human classification outside ecosystem aliases', () => {
    const figure=classifyQl7SupportGeneralTopic('Who is Cristiano Ronaldo?',{locale:'en',publicFigureGraph:QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH})
    expect(figure).toMatchObject({category:'public_figures'})
    expect(figure.publicFigure.selected.personId).toBe('cristiano-ronaldo')
    const human=classifyQl7SupportGeneralTopic('What do you think about zorbles people collect?',{locale:'en',publicFigureGraph:QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH})
    expect(human).toBeTruthy()
  })

  it('still rebuilds the public-figure graph when explicit approved entries are supplied', () => {
    const approved={personId:'canonical-matrix-test-person',canonicalName:'Canonical Matrix Test Person',aliases:['canonical matrix test person'],categories:['technology'],sourceLookupKey:'Canonical Matrix Test Person',catalogRank:999999,currentSensitive:false}
    const graph=buildQl7SupportPublicFigureKnowledgeGraph({approvedEntries:[approved]})
    expect(graph.count).toBeGreaterThan(QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH.count)
    const turn=analyzeQl7SupportTurn({text:'Who is Canonical Matrix Test Person?',locale:'en',knowledgeContext:{approvedPublicFigures:[approved]}})
    expect(turn.analysis.generalTopic).toMatchObject({category:'public_figures'})
    expect(turn.analysis.generalTopic.publicFigure.selected.personId).toBe('canonical-matrix-test-person')
  })
})
