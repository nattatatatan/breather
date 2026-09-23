import { useQuery } from '@tanstack/react-query'
import { meApi } from './endpoints'
import { queryKeys } from './queryKeys'

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: meApi.get })
}
