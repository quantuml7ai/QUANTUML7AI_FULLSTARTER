#!/usr/bin/env node

const path = require('path')
const { execFileSync } = require('child_process')

const scripts = [
  'generate-project-routes.js',
  'generate-project-ownership.js',
  'generate-project-dependencies.js',
  'generate-project-risks.js',
  'generate-project-tree.js',
  'audit-project-docs.js',
]

for (const script of scripts) {
  const abs = path.join(__dirname, script)
  execFileSync(process.execPath, [abs], { stdio: 'inherit' })
}

process.stdout.write('Project documentation package generated.\n')
