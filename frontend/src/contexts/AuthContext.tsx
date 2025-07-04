'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UsuarioAdmin } from '@/types/auth';

interface AuthContextType {
  usuario: UsuarioAdmin | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Verificar token armazenado ao inicializar
  useEffect(() => {
    const tokenArmazenado = localStorage.getItem('bndmet_token');
    const usuarioArmazenado = localStorage.getItem('bndmet_usuario');

    if (tokenArmazenado && usuarioArmazenado) {
      setToken(tokenArmazenado);
      setUsuario(JSON.parse(usuarioArmazenado));
      verificarToken(tokenArmazenado);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verificarToken = async (tokenParaVerificar: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verificar-token`, {
        headers: {
          'Authorization': `Bearer ${tokenParaVerificar}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data.data.usuario);
        setToken(tokenParaVerificar);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        const { token: novoToken, usuario: novoUsuario } = data.data;
        
        // Armazenar no localStorage
        localStorage.setItem('bndmet_token', novoToken);
        localStorage.setItem('bndmet_usuario', JSON.stringify(novoUsuario));
        
        setToken(novoToken);
        setUsuario(novoUsuario);
        
        return true;
      } else {
        throw new Error(data.error || 'Falha no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // Chamar endpoint de logout no backend
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar estado local
      localStorage.removeItem('bndmet_token');
      localStorage.removeItem('bndmet_usuario');
      setToken(null);
      setUsuario(null);
      router.push('/login');
    }
  };

  const isAuthenticated = !!(token && usuario);

  const value: AuthContextType = {
    usuario,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}