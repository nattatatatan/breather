import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Element, Intent, Me } from '@/api/types'
import { IntentionScreen } from './IntentionScreen'

const elements: Element[] = [{ id: 4, name: 'Breath', slug: 'breath', domain: 'rupa', description: null, image_url: null }]
const intents: Intent[] = [
  { id: 1, name: 'Calm', slug: 'calm', description: null },
  { id: 2, name: 'Joy', slug: 'joy', description: null },
]
const me: Me = { id: 1, display_name: 'Mai', practising_since: '2025-01-01', location: null, bio: null, created_at: '2026-01-01T00:00:00Z', practice: null }

vi.mock('@/api/endpoints', () => ({
  catalogApi: { elements: () => Promise.resolve(elements), intents: () => Promise.resolve(intents) },
  meApi: { get: () => Promise.resolve(me) },
}))

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/practice/mode" element={<div>Mode screen</div>} />
          <Route path="/practice/intention" element={<IntentionScreen />} />
          <Route path="/practice/object" element={<div>Object screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('IntentionScreen', () => {
  it('redirects to Mode when no mode is in the URL', async () => {
    renderAt('/practice/intention')
    expect(await screen.findByText('Mode screen')).toBeInTheDocument()
  })

  it('shows the chosen mode as a chip and defaults to Calm', async () => {
    renderAt('/practice/intention?mode=vipassana')
    expect(await screen.findByText('Vipassana')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Calm/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('carries the picked mode and intent forward to Object', async () => {
    const user = userEvent.setup()
    renderAt('/practice/intention?mode=samatha')
    await screen.findByRole('radio', { name: /Joy/ })
    await user.click(screen.getByRole('radio', { name: /Joy/ }))
    await user.click(screen.getByRole('link', { name: 'Continue' }))
    expect(await screen.findByText('Object screen')).toBeInTheDocument()
  })
})
