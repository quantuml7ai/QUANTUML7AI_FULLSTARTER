import React from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { act } from '@testing-library/react'
import GlobalVisualActivityRuntime from '../../../components/visual-runtime/GlobalVisualActivityRuntime'
import { teardownVisualActivityRegistry } from '../../../lib/visual-runtime/visualActivityRegistry'

const h = React.createElement

function Surface() {
  return h(React.Fragment, null,
    h(GlobalVisualActivityRuntime),
    h('div', { 'data-ql7-visual-scope': 'row', 'data-testid': 'generic-row' },
      h('button', { type: 'button' }, 'Open'),
    ),
  )
}

describe('REV6 generic visual scope hydration boundary', () => {
  afterEach(() => {
    teardownVisualActivityRegistry()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  test('hydrates generic visual scopes without inventing data-ql7-visual-state', async () => {
    const html = renderToString(h(Surface))
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.appendChild(host)

    const errors = []
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args.map((value) => String(value)).join(' '))
    })

    let root
    await act(async () => {
      root = hydrateRoot(host, h(Surface))
      await Promise.resolve()
      await Promise.resolve()
    })

    const row = host.querySelector('[data-testid="generic-row"]')
    expect(row).toBeTruthy()
    expect(row.hasAttribute('data-ql7-visual-state')).toBe(false)
    expect(errors.filter((line) => /hydration|extra attributes|data-ql7-visual-state/iu.test(line))).toEqual([])

    await act(async () => root.unmount())
    errorSpy.mockRestore()
  })
})
