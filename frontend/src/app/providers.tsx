import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { session } from '../api/client';
import { userApi, authApi } from '../api/domains';
import type { User } from '../types';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: false, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
});
const AuthContext = createContext<{
  user?: User;
  pending: boolean;
  error: Error | null;
  authenticated: boolean;
  logout: () => Promise<void>;
}>({ pending: true, error: null, authenticated: false, logout: async () => {} });
function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(session.subscribe, session.get);
  const me = useQuery({
    queryKey: ['me', token ? 'signed-in' : 'signed-out'],
    queryFn: userApi.me,
    enabled: !!token,
  });
  useEffect(() => {
    if (!token) queryClient.clear();
  }, [token]);
  const logout = async () => {
    const current = session.get();
    session.set(null);
    queryClient.clear();
    if (current) await authApi.logout(current.refresh_token).catch(() => undefined);
  };
  return (
    <AuthContext.Provider
      value={{
        user: me.data,
        pending: !!token && me.isPending,
        error: me.error,
        authenticated: !!token,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster richColors position="bottom-right" closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
