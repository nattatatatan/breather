import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Element, Intent, Me } from '@/api/types'
import { ObjectScreen } from './ObjectScreen'

const elements: Element[] = [
  { id: 4, name: 'Breath', slug: 'breath', domain: 'rupa', description: null, image_url: null },
  { id: 6, name: 'Fire Kasina', slug: 'fire', domain: 'rupa', description: null, image_url: null },
]
const intents: Intent[] = [{ id: 1, name: 'Calm', slug: 'calm', description: null }]
const me: Me = { id: 1, display_name: 'Mai', practising_since: '2025-01-01', location: null, bio: null, created_at: '2026-01-01T00:00:00Z', practice: null }

const putPractice = vi.fn().mockResolvedValue({})

vi.mock('@/api/endpoints', () => ({
  catalogApi: { elements: () => Promise.resolve(elements), intents: () => Promise.resolve(intents) },
  meApi: { get: () => Promise.resolve(me), putPractice: (body: unknown) => putPractice(body) },
}))

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/practice/mode" element={<div>Mode screen</div>} />
          <Route path="/practice/object" element={<ObjectScreen />} />
          <Route path="/sit" element={<div>Sit screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ObjectScreen', () => {
  beforeEach(() => {
    putPractice.mockClear()
  })

  it('redirects to Mode when no mode is in the URL', async () => {
    renderAt('/practice/object')
    expect(await screen.findByText('Mode screen')).toBeInTheDocument()
  })

  it('disables Stay until an object is chosen, then labels it after one is picked', async () => {
    const user = userEvent.setup()
    renderAt('/practice/object?mode=samatha&intent=calm')
    expect(await screen.findByText('Your practice object')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stay with it' })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Fire' }))
    expect(screen.getByRole('button', { name: 'Stay with fire' })).toBeEnabled()
  })

  it('saves the practice profile and moves to /sit on Stay', async () => {
    const user = userEvent.setup()
    renderAt('/practice/object?mode=samatha&intent=calm')
    await screen.findByText('Your practice object')
    await user.click(screen.getByRole('radio', { name: 'Fire' }))
    await user.click(screen.getByRole('button', { name: 'Stay with fire' }))

    await waitFor(() =>
      expect(putPractice).toHaveBeenCalledWith({
        mode: 'samatha',
        intent_id: 1,
        element_id: 6,
        environment: 'dissolve',
        duration_seconds: 1200,
        sound: 'silent',
        timer_visible: false,
      }),
    )
    expect(await screen.findByText('Sit screen')).toBeInTheDocument()
  })
})
