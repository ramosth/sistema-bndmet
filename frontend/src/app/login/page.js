// Página de login
// ============= src/app/login/page.js =============
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors }, setFocus } = useForm();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.senha);
      if (result.success) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <Loader className="loading" size={32} />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--terracotta) 100%)',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--white)',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '3rem',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div className="text-center mb-4">
          <div style={{
            width: '4rem',
            height: '4rem',
            backgroundColor: 'var(--primary-blue)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <Shield size={28} color="white" />
          </div>
          
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: 'var(--gray-800)',
            margin: '0 0 0.5rem 0'
          }}>
            TCC - IPRJ
          </h1>
          
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Sistema de Monitoramento de Barragens de Rejeito
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '2rem' }}>
          <Input
            label="Email"
            type="email"
            placeholder="Digite seu email"
            required
            {...register('email', {
              required: 'Email é obrigatório',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido'
              }
            })}
            error={errors.email?.message}
          />

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.senha ? 'border-red-500' : ''}`}
                placeholder="Digite sua senha"
                style={{ paddingRight: '3rem' }}
                {...register('senha', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter no mínimo 6 caracteres'
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--gray-700)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--gray-500)'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.senha && (
              <div className="form-error">{errors.senha.message}</div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.875rem',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--gray-50)',
          borderRadius: '0.5rem',
          border: '1px solid var(--gray-200)'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--gray-600)',
            margin: '0 0 0.5rem 0',
            fontWeight: '500'
          }}>
            Informações de Acesso:
          </p>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--gray-500)',
            margin: 0,
            lineHeight: 1.4
          }}>
            Use suas credenciais de administrador para acessar o sistema de monitoramento.
          </p>
        </div>

        <div className="text-center" style={{ marginTop: '2rem' }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--gray-500)',
            margin: 0
          }}>
            © 2025 - Sistema de Monitoramento
          </p>
        </div>
      </div>
    </div>
  );
}