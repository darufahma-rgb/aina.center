import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SafeUser } from "../../shared/schema";

interface AuthContextType {
  user: SafeUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      apiRequest("POST", "/api/auth/login", { username, password }),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: { displayName?: string; avatarUrl?: string }) =>
      apiRequest("PATCH", "/api/auth/profile", data),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateProfile = async (data: { displayName?: string; avatarUrl?: string }) => {
    await profileMutation.mutateAsync(data);
  };

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      isAdmin: user?.role === "admin",
      isLoading,
      login,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
