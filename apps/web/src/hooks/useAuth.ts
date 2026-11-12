import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, isUnauthorized, type User } from '@/lib/api';

export const ME_KEY = ['me'] as const;

/** The signed-in user, or null. A 401 is an answer ("signed out"), not an error. */
export function useMe() {
  return useQuery<User | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (isUnauthorized(err)) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: authApi.signIn, onSuccess: (user) => qc.setQueryData(ME_KEY, user) });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: authApi.signUp, onSuccess: (user) => qc.setQueryData(ME_KEY, user) });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      qc.setQueryData(ME_KEY, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
    },
  });
}
