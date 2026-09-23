import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meApi } from '@/api/endpoints'
import { queryKeys } from '@/api/queryKeys'
import type { PracticeProfile } from '@/api/types'

/** Upsert the practice profile, then invalidate `me` so every screen reads the new one. */
export function usePutPractice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: PracticeProfile) => meApi.putPractice(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
  })
}
