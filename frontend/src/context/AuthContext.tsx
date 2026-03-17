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

function getStoredUsuario(): UsuarioAuth | null {
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioAuth;
  } catch {
    return null;
  }
}

function initAuthState(): { token: string | null; usuario: UsuarioAuth | null } {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored) return { token: null, usuario: null };
  try {
    const payload = JSON.parse(atob(stored.split('.')[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
      return { token: null, usuario: null };
    }
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    return { token: null, usuario: null };
  }
  return { token: stored, usuario: getStoredUsuario() };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const estadoInicial = initAuthState();
  const [token, setToken] = useState<string | null>(estadoInicial.token);
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(estadoInicial.usuario);

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
