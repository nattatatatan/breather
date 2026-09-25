import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Element, Me } from '@/api/types'
import { HomeScreen } from './HomeScreen'

const elements: Element[] = [{ id: 6, name: 'Fire Kasina', slug: 'fire', domain: 'rupa', description: null, image_url: null }]

let me: Me

vi.mock('@/api/endpoints', () => ({
  catalogApi: { elements: () => Promise.resolve(elements), intents: () => Promise.resolve([]) },
  meApi: { get: () => Promise.resolve(me) },
}))

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/practice/mode" element={<div>Mode screen</div>} />
          <Route path="/sit" element={<div>Sit screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HomeScreen', () => {
  it('Begin goes to Mode when no practice profile exists', async () => {
    me = { id: 1, display_name: 'Mai', practising_since: '2025-01-01', location: null, bio: null, created_at: '2026-01-01T00:00:00Z', practice: null, visibility: 'public' }
    renderHome()
    const begin = await screen.findByRole('link', { name: 'Begin' })
    expect(begin).toHaveAttribute('href', '/practice/mode')
  })

  it('Begin goes straight to /sit once a practice profile exists', async () => {
    me = {
      id: 1,
      display_name: 'Mai',
      practising_since: '2025-01-01',
      location: null,
      bio: null,
      created_at: '2026-01-01T00:00:00Z',
      practice: { mode: 'samatha', intent_id: 1, element_id: 6, environment: 'dissolve', duration_seconds: 1800, sound: 'silent', timer_visible: false },
      visibility: 'public'
    }
    renderHome()
    const begin = await screen.findByRole('link', { name: 'Begin' })
    expect(begin).toHaveAttribute('href', '/sit')
  })
})
