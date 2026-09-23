import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { circleApi, sessionsApi } from '@/api/endpoints'
import { queryKeys } from '@/api/queryKeys'
import type { ThreadCreate, ThreadDetail } from '@/api/types'

const THREADS_PAGE_SIZE = 20

/** Discussion list, paginated 20 at a time. */
export function useThreads() {
  return useInfiniteQuery({
    queryKey: queryKeys.threads,
    queryFn: ({ pageParam }) => circleApi.threads({ limit: THREADS_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === THREADS_PAGE_SIZE ? allPages.length * THREADS_PAGE_SIZE : undefined,
  })
}

export function useHours() {
  return useQuery({ queryKey: queryKeys.hours, queryFn: circleApi.hours })
}

export function useThread(threadId: number) {
  return useQuery({ queryKey: queryKeys.thread(threadId), queryFn: () => circleApi.thread(threadId) })
}

export function useSharedSitting(sessionId: number) {
  return useQuery({ queryKey: queryKeys.shared(sessionId), queryFn: () => circleApi.shared(sessionId) })
}

export function usePractitioner(userId: number) {
  return useQuery({ queryKey: queryKeys.practitioner(userId), queryFn: () => circleApi.practitioner(userId) })
}

/** Recent completed sittings that are not already attached to a thread, for the compose picker. */
export function useAttachableSessions() {
  return useQuery({
    queryKey: [...queryKeys.sessions, 'attachable'] as const,
    queryFn: () => sessionsApi.list({ completed: true, limit: 10 }),
    select: (sessions) => sessions.filter((s) => s.thread_id == null),
  })
}

export function useCreateThread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ThreadCreate) => circleApi.createThread(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
    },
  })
}

export function useReply(threadId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => circleApi.reply(threadId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(threadId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.threads })
    },
  })
}

interface ToggleHelpfulVars {
  replyId: number
  /** Whether *I* currently have this reply marked helpful, before the toggle. */
  marked: boolean
}

/** Optimistic mark/unmark helpful, scoped to one thread's cached detail. */
export function useToggleHelpful(threadId: number) {
  const queryClient = useQueryClient()
  const key = queryKeys.thread(threadId)
  return useMutation({
    mutationFn: ({ replyId, marked }: ToggleHelpfulVars) =>
      marked ? circleApi.unmarkHelpful(replyId) : circleApi.markHelpful(replyId),
    onMutate: async ({ replyId, marked }: ToggleHelpfulVars) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ThreadDetail>(key)
      if (previous) {
        queryClient.setQueryData<ThreadDetail>(key, {
          ...previous,
          replies: previous.replies.map((reply) =>
            reply.id === replyId
              ? { ...reply, marked_helpful_by_me: !marked, helpful_count: reply.helpful_count + (marked ? -1 : 1) }
              : reply,
          ),
        })
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
