'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, Bell, CheckCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    receberNotificacoes: true,
    tipoNotificacao: 'email',
  });
  
  const [receberEmail, setReceberEmail] = useState(true);
  const [receberSms, setReceberSms] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      // Determinar tipo de notificação baseado nos checkboxes
      const canais = [];
      if (receberEmail) canais.push('email');
      if (receberSms) canais.push('sms');
      
      const dadosEnvio = {
        ...formData,
        tipoNotificacao: canais.join(',') || 'email',
        receberNotificacoes: canais.length > 0,
      };

      const response = await fetch(`${API_BASE_URL}/api/auth/cadastro-basico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEnvio),
      });

      const data = await response.json();

      if (data.success) {
        setSucesso(true);
        setFormData({
          nome: '',
          email: '',
          telefone: '',
          receberNotificacoes: true,
          tipoNotificacao: 'email