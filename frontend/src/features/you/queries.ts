import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meApi } from '@/api/endpoints'
import { queryKeys } from '@/api/queryKeys'
import type { Me, PracticeProfile } from '@/api/types'

/** Inline edits on My practice (duration/sound/timer/environment): optimistic, rolls back on failure. */
export function useUpdatePractice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (next: PracticeProfile) => meApi.putPractice(next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.me })
      const previous = queryClient.getQueryData<Me>(queryKeys.me)
      if (previous) queryClient.setQueryData<Me>(queryKeys.me, { ...previous, practice: next })
      return { previous }
    },
    onError: (_err, _next, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.me, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
  })
}
