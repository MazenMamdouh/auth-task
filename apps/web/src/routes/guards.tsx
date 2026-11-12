import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '@/hooks/useAuth';
import { FullPageMessage, Spinner } from '@/components/ui';

/** Signed-in users only; everyone else goes to /signin and comes back afterwards. */
export function ProtectedRoute() {
  const { data: user, isPending, isError, refetch } = useMe();
  const location = useLocation();

  if (isPending) return <FullPageMessage><Spinner /></FullPageMessage>;
  if (isError) {
    return (
      <FullPageMessage>
        <p className="text-slate-600">We couldn't check your session.</p>
        <button className="mt-3 text-sm font-semibold text-indigo-600 hover:underline" onClick={() => void refetch()}>
          Try again
        </button>
      </FullPageMessage>
    );
  }
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Sign-in / sign-up pages: a signed-in user is sent straight to the app. */
export function PublicOnlyRoute() {
  const { data: user, isPending } = useMe();
  if (isPending) return <FullPageMessage><Spinner /></FullPageMessage>;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
