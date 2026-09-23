import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { Screen } from '@/ui/Screen'
import { Loading } from '@/ui/States'

/** Gate for every route except /signin. Remembers where the visitor was headed. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }
  if (!session) return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
