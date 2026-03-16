import { createContext, useContext, useState, useCallback } from 'react';

export type Rol = 'ADMIN' | 'VENDEDOR';

export interface UsuarioAuth {
  id: number;
  username: string;
  rol: Rol;
}

interface AuthContextType {
  usuario: UsuarioAuth | null;
  isAuthenticated: boolean;
  login: (token: string, usuario: UsuarioAuth) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_token';
const USUARIO_KEY = 'auth_usuario';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUsuario(): UsuarioAuth | null {
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioAuth;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(getStoredUsuario);

  const login = useCallback((newToken: string, newUsuario: UsuarioAuth) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(newUsuario));
    setToken(newToken);
    setUsuario(newUsuario);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, isAuthenticated: !!token && !!usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
