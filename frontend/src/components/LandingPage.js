// Página inicial do sistema - Landing Page
// ============= src/components/LandingPage.js =============
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { userService } from '@/services/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { 
  Shield, 
  BarChart3, 
  Cloud, 
  Droplets, 
  Cpu, 
  Activity,
  ChevronRight,
  Users,
  Mail,
  Phone,
  Bell,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      receberNotificacoes: true,
      tipoNotificacao: 'email'
    }
  });

  const receberNotificacoes = watch('receberNotificacoes');

  // Máscara de telefone em tempo real
  const maskTelefone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2)  return `(${digits}`;
    if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleRegisterSubmit = async (data) => {
    setLoading(true);
    try {
      await userService.createBasicUser(data);
      toast.success('Cadastro realizado com sucesso! Você receberá notificações sobre os alertas de barragem.');
      setShowRegisterModal(false);
      reset();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao realizar cadastro';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#2563eb',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                TCC IPRJ
              </h1>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: 0
              }}>
                Sistema de Monitoramento de Barragens
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleLoginClick}
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '4rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            lineHeight: 1.2
          }}>
            O papel da engenharia da computação na prevenção de acidentes em barragens de rejeitos
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Trabalho de Conclusão de Curso (TCC) desenvolvido para monitoramento 
            inteligente de segurança em barragens através de IoT e dados meteorológicos.
          </p>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="outline"
              onClick={() => setShowRegisterModal(true)}
              style={{
                backgroundColor: 'white',
                color: '#2563eb',
                borderColor: 'white',
                fontSize: '1.1rem',
                padding: '0.75rem 2rem'
              }}
            >
              <Users size={20} />
              Cadastrar para Receber Alertas
            </Button>

            <Button
              variant="outline"
              onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
              style={{
                borderColor: 'white',
                color: 'white',
                fontSize: '1.1rem',
                padding: '0.75rem 2rem'
              }}
            >
              Saiba Mais
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" style={{
        padding: '4rem 0',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Tecnologias Integradas
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Sistema completo que combina sensores IoT, dados meteorológicos 
              e análise inteligente para monitoramento de barragens em tempo real.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {/* Sensor IoT */}
            <div style={{
              padding: '2rem',
              backgroundColor: '#f8fafc',
              borderRadius: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#10b981',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <Cpu size={24} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                IoT com Arduino
              </h3>
              <p style={{
                color: '#6b7280',
                lineHeight: 1.6,
                marginBottom: '1rem'
              }}>
                Coleta dados em tempo real usando sensor higrômetro para 
                monitoramento da umidade do solo próximo às barragens.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#10b981',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                <Droplets size={16} />
                Sensor de Umidade
              </div>
            </div>

            {/* API OpenWeather */}
            <div style={{
              padding: '2rem',
              backgroundColor: '#f8fafc',
              borderRadius: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#3b82f6',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <Cloud size={24} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                API OpenWeather
              </h3>
              <p style={{
                color: '#6b7280',
                lineHeight: 1.6,
                marginBottom: '1rem'
              }}>
                Integração com dados meteorológicos em tempo real para 
                previsão do tempo e análise de condições climáticas.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#3b82f6',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                <Activity size={16} />
                Previsão do Tempo
              </div>
            </div>

            {/* API BNDMET */}
            <div style={{
              padding: '2rem',
              backgroundColor: '#f8fafc',
              borderRadius: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#8b5cf6',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <BarChart3 size={24} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                API BNDMET
              </h3>
              <p style={{
                color: '#6b7280',
                lineHeight: 1.6,
                marginBottom: '1rem'
              }}>
                Acesso ao histórico de dados pluviométricos e informações 
                meteorológicas do Banco Nacional de Dados Meteorológicos.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#8b5cf6',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                <Droplets size={16} />
                Histórico de Chuvas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Objetivo Section */}
      <section style={{
        padding: '4rem 0',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 1.5rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '1.5rem'
          }}>
            Objetivo do Projeto
          </h2>
          
          <div style={{
            backgroundColor: 'white',
            padding: '2.5rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{
              fontSize: '1.125rem',
              color: '#374151',
              lineHeight: 1.7,
              marginBottom: '1.5rem'
            }}>
              Este Trabalho de Conclusão de Curso visa desenvolver um sistema 
              inteligente de <strong>monitoramento de barragens de rejeito</strong>, 
              integrando dados de sensores IoT, condições meteorológicas e 
              histórico pluviométrico para <strong>prevenção de acidentes</strong> 
              e <strong>alertas antecipados</strong>.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={20} color="#10b981" />
                <span style={{ color: '#374151' }}>Monitoramento 24/7</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={20} color="#10b981" />
                <span style={{ color: '#374151' }}>Alertas Antecipados</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={20} color="#10b981" />
                <span style={{ color: '#374151' }}>Dados Integrados</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={20} color="#10b981" />
                <span style={{ color: '#374151' }}>Prevenção de Acidentes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 0',
        backgroundColor: '#1f2937',
        color: 'white'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 1.5rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            Receba Alertas de Segurança
          </h2>
          
          <p style={{
            fontSize: '1.125rem',
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            Cadastre-se para receber notificações importantes sobre 
            condições de risco em barragens próximas à sua região.
          </p>

          <Button
            variant="primary"
            onClick={() => setShowRegisterModal(true)}
            style={{
              backgroundColor: '#2563eb',
              fontSize: '1.1rem',
              padding: '0.75rem 2rem'
            }}
          >
            <Bell size={20} />
            Cadastrar Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#111827',
        color: 'white',
        padding: '2rem 0',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem'
        }}>
          <p style={{
            margin: 0,
            opacity: 0.8
          }}>
            © 2025 BNDMET Monitor - Trabalho de Conclusão de Curso | 
            Sistema de Monitoramento de Barragens de Rejeito
          </p>
        </div>
      </footer>

      {/* Modal de Cadastro */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Cadastro para Receber Alertas"
        size="extra-large"
      >
        <form onSubmit={handleSubmit(handleRegisterSubmit)} style={{ 
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            padding: '1rem 0',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              margin: 0
            }}>
              Receba notificações importantes sobre condições de risco 
              em barragens e alertas meteorológicos relevantes para sua segurança.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Input
              label="Nome Completo"
              required
              {...register('nome', {
                required: 'Nome é obrigatório',
                minLength: {
                  value: 2,
                  message: 'Nome deve ter no mínimo 2 caracteres'
                }
              })}
              error={errors.nome?.message}
            />

            <Input
              label="Email"
              type="email"
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

            <Input
              label="Telefone"
              placeholder="(11) 99999-9999"
              {...register('telefone', {
                validate: v => !v || /^\(\d{2}\) \d{4,5}-\d{4}$/.test(v) || 'Formato inválido. Use: (XX) XXXXX-XXXX'
              })}
              onChange={e => {
                const masked = maskTelefone(e.target.value);
                setValue('telefone', masked, { shouldValidate: false });
              }}
              error={errors.telefone?.message}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Como deseja receber as notificações?
              </label>
              <div style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    id="email"
                    value="email"
                    {...register('tipoNotificacao')}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: '#2563eb'
                    }}
                  />
                  <label 
                    htmlFor="email"
                    style={{
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Mail size={14} />
                    Apenas Email
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    id="email-sms"
                    value="email,sms"
                    {...register('tipoNotificacao')}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: '#2563eb'
                    }}
                  />
                  <label 
                    htmlFor="email-sms"
                    style={{
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Mail size={14} />
                    <Phone size={14} />
                    Email + SMS
                  </label>
                </div>
              </div>
            </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRegisterModal(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}