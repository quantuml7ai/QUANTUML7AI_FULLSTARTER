'use strict'

const semantic = require('./semanticAnalyzer.cjs')

const VERSION = 'ql7.composer.policy'

function classifyComposerText(text, options = {}) {
  return semantic.analyzeComposerSemantics(text, options)
}

function policyForComposerClass(classId) {
  return semantic.policyForClass(classId)
}

module.exports = {
  VERSION,
  classifyComposerText,
  policyForComposerClass,
}
