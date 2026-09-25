import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '@/api/endpoints'
import { queryKeys } from '@/api/queryKeys'
import type { PracticeProfile, Session, SessionCreate, SessionUpdate } from '@/api/types'

/** Builds the session-create payload from the practitioner's saved profile (contract: POST /api/sessions). */
export function sessionCreateFromProfile(profile: PracticeProfile): SessionCreate {
  return {
    element_ids: [profile.element_id],
    mode: profile.mode,
    intent_id: profile.intent_id,
    planned_seconds: profile.duration_seconds,
    environment: profile.environment,
    sound: profile.sound,
    timer_visible: profile.timer_visible,
  }
}

export function useSession(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.session(id ?? -1),
    queryFn: () => sessionsApi.get(id as number),
    enabled: id != null && Number.isFinite(id),
  })
}

export function useSessions(
  params: {
    limit?: number
    offset?: number
    completed?: boolean
  } = {}
) {
  return useQuery({
    queryKey: [...queryKeys.sessions, params] as const,
    queryFn: () => sessionsApi.list(params),
  })
}

export function useCreateSession(options: { onMutate?: () => void } = {}) {
  return useMutation({ mutationFn: (body: SessionCreate) => sessionsApi.create(body), onMutate: options.onMutate })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SessionUpdate }) => sessionsApi.update(id, body),
    onSuccess: (session: Session) => {
      queryClient.setQueryData(queryKeys.session(session.id), session)
    },
  })
}

/** Completing a sitting changes what the practitioner's stats, sessions and circle hours show. */
export function useCompleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, returns }: { id: number; returns: number[] }) => sessionsApi.complete(id, returns),
    onSuccess: (session: Session) => {
      queryClient.setQueryData(queryKeys.session(session.id), session)
      queryClient.invalidateQueries({ queryKey: queryKeys.me })
      queryClient.invalidateQueries({ queryKey: queryKeys.myStats })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      queryClient.invalidateQueries({ queryKey: queryKeys.hours })
    },
  })
}

export function useDeleteSession() {
  return useMutation({ mutationFn: (id: number) => sessionsApi.remove(id) })
}
