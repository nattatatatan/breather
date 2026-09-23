import { useQuery } from '@tanstack/react-query'
import { catalogApi } from './endpoints'
import { queryKeys } from './queryKeys'

// Catalog data changes only on deploy; cache it for the whole visit.
export function useElements() {
  return useQuery({ queryKey: queryKeys.elements, queryFn: catalogApi.elements, staleTime: Infinity })
}

export function useIntents() {
  return useQuery({ queryKey: queryKeys.intents, queryFn: catalogApi.intents, staleTime: Infinity })
}
