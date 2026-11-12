import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { useLogout, useMe } from '@/hooks/useAuth';

export default function HomePage() {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">A</span>
            <span className="font-semibold tracking-tight">AuthTask</span>
          </div>
          <button
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/signin', { replace: true }) })}
            disabled={logout.isPending}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {logout.isPending && <Spinner className="h-3.5 w-3.5 text-slate-600" />}
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Welcome to the application.</h1>
        {user && (
          <p className="mt-4 text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{user.name}</span> ({user.email})
          </p>
        )}
      </main>
    </div>
  );
}
