"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiRequest } from "@/lib/api";
import type { AuthenticatedUser } from "@/types/auth";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  password: string;
}

interface AuthResponse {
  message: string;
  user: AuthenticatedUser;
}

interface CurrentUserResponse {
  user: AuthenticatedUser;
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthenticatedUser>;
  register: (input: RegisterInput) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getRoleHomePath(user: AuthenticatedUser): string {
  return user.role === "TEAM_MEMBER" ? "/reports" : "/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiRequest<CurrentUserResponse>("/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      setUser(response.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        return;
      }

      console.error("Unable to retrieve authenticated user:", error);

      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeAuthentication() {
      try {
        const response = await apiRequest<CurrentUserResponse>("/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (active) {
          setUser(response.user);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status !== 401) {
          console.error("Unable to initialize authentication:", error);
        }

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void initializeAuthentication();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (input: LoginInput): Promise<AuthenticatedUser> => {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: input,
        cache: "no-store",
      });

      setUser(response.user);

      return response.user;
    },
    [],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthenticatedUser> => {
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: input,
        cache: "no-store",
      });

      setUser(response.user);

      return response.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest<{ message: string }>("/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
