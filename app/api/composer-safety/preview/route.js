import { NextResponse } from 'next/server'
import composerPolicy from '../../../../lib/composer-safety/policy.cjs'
import surfaceRegistry from '../../../../lib/composer-safety/surfaceRegistry.cjs'
export const dynamic = 'force-dynamic'
export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const surface = surfaceRegistry.getComposerSurface(body?.surface)
  if (!surface || surface.excluded) return NextResponse.json({ ok: false, error: 'composer_surface_unregistered' }, { status: 400 })
  const result = composerPolicy.classifyComposerText(body?.text, { locale: body?.locale || request.headers.get('accept-language') || 'und', targeted: body?.targeted === true, quotedRanges: Array.isArray(body?.quotedRanges) ? body.quotedRanges : [], conversationReferences: Array.isArray(body?.conversationReferences) ? body.conversationReferences : [], context: { conversationKind: 'composer_preview' } })
  const projection = composerPolicy.policyForComposerClass(result.classId)
  return NextResponse.json({ ok: true, authoritative: false, classId: result.classId, confidence: Number(result.confidence || 0), tone: projection.tone, decisionHint: projection.decision, semanticFeatureHash: result.semanticFeatureHash || result.receiptHash || '', normalizationVersion: result.normalizationVersion || result.normalization?.version || '', evidence: Array.isArray(result.evidence) ? result.evidence : [] }, { headers: { 'cache-control': 'no-store, max-age=0' } })
}
