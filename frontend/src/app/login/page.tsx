'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, Users } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const sucesso = await login(email, senha);
      
      if (sucesso) {
        router.push('/dashboard');
      } else {
        setErro('Email ou senha incorretos');
      }
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Sistema BNDMET
          </h1>
          <p className="text-blue-100">
            Monitoramento de Barragem de Rejeito
          </p>
        </div>

        {/* Formulário de Login */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">
              Acesso Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <Alert variant="destructive">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bndmet.com"
                  required
                  disabled={carregando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    required
                    disabled={carregando}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    disabled={carregando}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={carregando}
              >
                {carregando ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informações para Usuários Básicos */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Quer receber alertas?
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Cadastre-se para receber notificações em caso de criticidade no monitoramento.
                </p>
                <Link href="/cadastro">
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Cadastrar-se para Alertas
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credenciais de Demo */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-amber-900 mb-2">
              Demonstração
            </h3>
            <div className="text-sm text-amber-700 space-y-1">
              <p><strong>Email:</strong> admin@bndmet.com</p>
              <p><strong>Senha:</strong> admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}