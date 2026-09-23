import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HelpfulState, Reply, ThreadDetail } from '@/api/types'
import { queryKeys } from '@/api/queryKeys'
import { ReplyItem } from './ThreadScreen'
import { useThread } from './queries'

vi.mock('@/api/endpoints', () => ({
  circleApi: { markHelpful: vi.fn(), unmarkHelpful: vi.fn() },
  sessionsApi: {},
}))

const { circleApi } = await import('@/api/endpoints')

const REPLY: Reply = {
  id: 11,
  author: {
    id: 2,
    display_name: 'Ari',
    initial: 'A',
    practising_since: '2020-05-01',
    total_seconds: 1240 * 3600,
    primary_mode: 'samatha',
    primary_element_id: 6,
  },
  body: 'Your notes say the warmth came for about two minutes near the end.',
  created_at: '2026-09-23T10:00:00Z',
  helpful_count: 14,
  marked_helpful_by_me: false,
  read_context: true,
}

const THREAD_ID = 3

/** Mirrors how ThreadScreen renders a ReplyItem: reading the reply from the cached thread query. */
function Harness({ isOwn = false }: { isOwn?: boolean }) {
  const { data } = useThread(THREAD_ID)
  if (!data) return null
  return <ReplyItem reply={data.replies[0]} threadId={THREAD_ID} elements={undefined} isOwn={isOwn} onReplyClick={() => {}} />
}

function renderHarness(isOwn = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  client.setQueryData(queryKeys.thread(THREAD_ID), { replies: [REPLY] } as unknown as ThreadDetail)
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Harness isOwn={isOwn} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ReplyItem helpful toggle', () => {
  beforeEach(() => {
    vi.mocked(circleApi.markHelpful).mockReset()
    vi.mocked(circleApi.unmarkHelpful).mockReset()
  })

  it('updates the count and pressed state optimistically, before the request resolves', async () => {
    let resolveRequest!: (value: HelpfulState) => void
    vi.mocked(circleApi.markHelpful).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    renderHarness()

    const button = screen.getByRole('button', { name: 'Helpful · 14' })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(button)

    // The optimistic update lands synchronously in onMutate, ahead of the network response.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Helpful · 15' })).toHaveAttribute('aria-pressed', 'true'))
    expect(circleApi.markHelpful).toHaveBeenCalledWith(11)

    resolveRequest({ helpful_count: 15, marked_helpful_by_me: true })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Helpful · 15' })).toBeInTheDocument())
  })

  it('rolls back on failure', async () => {
    let rejectRequest!: (error: Error) => void
    vi.mocked(circleApi.markHelpful).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRequest = reject
      }),
    )

    renderHarness()

    fireEvent.click(screen.getByRole('button', { name: 'Helpful · 14' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Helpful · 15' })).toBeInTheDocument())

    rejectRequest(new Error('network down'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Helpful · 14' })).toHaveAttribute('aria-pressed', 'false'))
  })

  it('disables the toggle on your own reply and never calls the API', () => {
    renderHarness(true)
    const button = screen.getByRole('button', { name: 'Helpful · 14' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(circleApi.markHelpful).not.toHaveBeenCalled()
  })
})
