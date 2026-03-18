// Configurações — Layout em página corrida, sem abas
// ============= src/components/settings/SettingsContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService, authService, systemService } from '@/services/api';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  User, Lock, Database, Trash2, AlertTriangle,
  Shield, Clock, Activity, Server, Cpu,
  RefreshCw, CheckCircle, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, description, iconColor = '#2563eb' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
    <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', backgroundColor: `${iconColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} color={iconColor} />
    </div>
    <div>
      <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827', margin: 0 }}>{title}</h2>
      {description && <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0.15rem 0 0' }}>{description}</p>}
    </div>
  </div>
);

const Section = ({ children, style = {} }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.25rem', marginBottom: '1rem', ...style }}>
    {children}
  </div>
);

const InfoRow = ({ label, value, mono = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{label}</span>
    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '—'}</span>
  </div>
);

const TechCard = ({ label, value, sub, color = '#374151' }) => (
  <div style={{ padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #f3f4f6' }}>
    <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ fontSize: '0.875rem', fontWeight: '700', color }}>{value ?? '—'}</div>
    {sub && <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.1rem' }}>{sub}</div>}
  </div>
);

const ActionRow = ({ icon: Icon, iconColor, title, description, action, actionLabel, actionVariant = 'outline', loading, last = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.875rem 0', borderBottom: last ? 'none' : '1px solid #f3f4f6' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
      <div style={{ width: '2rem', height: '2rem', borderRadius: '0.375rem', backgroundColor: `${iconColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.825rem', fontWeight: '600', color: '#111827' }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.1rem' }}>{description}</div>
      </div>
    </div>
    <Button variant={actionVariant} onClick={action} loading={loading} disabled={loading}
      style={{ flexShrink: 0, fontSize: '0.78rem', padding: '0.375rem 0.75rem' }}>
      {actionLabel}
    </Button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsContent() {
  const [showPasswordModal,    setShowPasswordModal]    = useState(false);
  const [loading,              setLoading]              = useState(false);
  const [healthData,           setHealthData]           = useState(null);
  const [loadingHealth,        setLoadingHealth]        = useState(false);
  const [lastMaintenance,      setLastMaintenance]      = useState({});

  const { user, updateUser, isSuperAdmin } = useAuth();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: { nome: user?.nome || '', email: user?.email || '' },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm();

  const novaSenha = watchPassword('novaSenha');

  // Carregar dados do /health para super admin
  useEffect(() => {
    if (isSuperAdmin()) loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await systemService.getHealth();
      setHealthData(res.data || res);
    } catch { setHealthData(null); }
    finally { setLoadingHealth(false); }
  };

  // Formatar uptime em horas e minutos
  const formatUptime = (seconds) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Formatar último login
  const formatLogin = (ts) => {
    if (!ts) return 'Nunca registrado';
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  };

  // ── Submit: Perfil ────────────────────────────────────────────────────────
  const onProfileSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await userService.updateAdminUser(user.id, {
        nome:   data.nome.trim(),
        email:  data.email.toLowerCase().trim(),
        perfil: user.perfil,
      });
      if (response.success) {
        updateUser({ ...user, nome: response.data.nome, email: response.data.email });
        toast.success('Perfil atualizado com sucesso!');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      let msg = 'Erro ao atualizar perfil';
      if (error.response?.data?.error)   msg = error.response.data.error;
      else if (error.response?.data?.message) msg = error.response.data.message;
      else if (error.message) msg = error.message;
      if (msg.includes('Email já cadastrado')) msg = 'Este email já está em uso por outro usuário';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  // ── Submit: Senha ─────────────────────────────────────────────────────────
  const onPasswordSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.changePassword(data.senhaAtual, data.novaSenha);
      toast.success('Senha alterada com sucesso!');
      setShowPasswordModal(false);
      resetPassword();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao alterar senha');
    } finally { setLoading(false); }
  };

  // ── Manutenção ────────────────────────────────────────────────────────────
  const handleMaintenance = async (action) => {
    setLoading(true);
    try {
      let response;
      if (action === 'cleanup-tokens') {
        response = await systemService.cleanExpiredTokens();
        toast.success(`${response.data?.tokensLimpos ?? 0} tokens expirados removidos`);
      } else if (action === 'cleanup-sessions') {
        response = await systemService.cleanExpiredSessions();
        toast.success('Sessões expiradas removidas com sucesso');
      } else if (action === 'all') {
        await systemService.cleanExpiredTokens();
        await systemService.cleanExpiredSessions();
        toast.success('Manutenção completa executada com sucesso');
      }
      setLastMaintenance(prev => ({ ...prev, [action]: new Date() }));
    } catch { toast.error('Erro ao executar manutenção'); }
    finally { setLoading(false); setShowMaintenanceModal(false); }
  };

  const fmtMaintenance = (action) => {
    const ts = lastMaintenance[action];
    if (!ts) return 'Nunca executado nesta sessão';
    return `Última execução: ${ts.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
  };

  return (
    <div>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: 0 }}>
          Configurações
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.2rem 0 0' }}>
          Gerencie seu perfil, segurança e preferências do sistema
        </p>
      </div>

      {/* ── Seção 1: Meu Perfil ───────────────────────────────────────── */}
      <Section>
        <SectionHeader icon={User} title="Meu Perfil" description="Informações da sua conta de administrador" iconColor="#2563eb" />

        <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Nome Completo"
              required
              {...registerProfile('nome', {
                required: 'Nome é obrigatório',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              })}
              error={profileErrors.nome?.message}
            />
            <Input
              label="Email"
              type="email"
              required
              {...registerProfile('email', {
                required: 'Email é obrigatório',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
              })}
              error={profileErrors.email?.message}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Perfil — somente leitura */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                Perfil de Acesso
              </label>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={14} color={user?.perfil === 'super_admin' ? '#dc2626' : '#2563eb'} />
                {user?.perfil === 'super_admin' ? 'Super Administrador' : 'Administrador'}
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                  somente leitura
                </span>
              </div>
            </div>

            {/* ID da conta */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                ID da Conta
              </label>
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.id || '—'}
                </span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', flexShrink: 0 }}>
                  somente leitura
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.875rem', borderTop: '1px solid #f3f4f6' }}>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}
              style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Section>

      {/* ── Seção 2: Sessão Atual ─────────────────────────────────────── */}
      <Section>
        <SectionHeader icon={Clock} title="Sessão Atual" description="Informações de acesso da sessão em andamento" iconColor="#7c3aed" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          <InfoRow label="Último login"      value={formatLogin(user?.ultimoLogin)} />
          <InfoRow label="Conta criada em"   value={formatLogin(user?.createdAt)} />
          <InfoRow label="Última atualização" value={formatLogin(user?.updatedAt)} />
        </div>
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={13} color="#16a34a" />
          <span style={{ fontSize: '0.75rem', color: '#166534' }}>
            Sessão autenticada via JWT · Duração do token: <strong>24 horas</strong> — após esse período o login é solicitado novamente
          </span>
        </div>
      </Section>

      {/* ── Seção 3: Segurança ────────────────────────────────────────── */}
      <Section>
        <SectionHeader icon={Lock} title="Segurança" description="Gerencie a senha e as credenciais de acesso" iconColor="#d97706" />

        <ActionRow
          icon={Lock} iconColor="#d97706"
          title="Alterar Senha"
          description="Recomendado trocar a senha regularmente. Mínimo 6 caracteres, com maiúscula, minúscula e número."
          action={() => setShowPasswordModal(true)}
          actionLabel="Alterar Senha"
          actionVariant="outline"
          last
        />

        <div style={{ marginTop: '0.875rem', padding: '0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.375rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#92400e', margin: 0, lineHeight: 1.6 }}>
            💡 <strong>Boas práticas:</strong> use senhas únicas para este sistema · não compartilhe credenciais · faça logout ao sair de computadores compartilhados
          </p>
        </div>
      </Section>

      {/* ── Seção 4 + 5: Super Admin apenas ──────────────────────────── */}
      {isSuperAdmin() && (
        <>
          {/* Manutenção */}
          <Section>
            <SectionHeader icon={Trash2} title="Manutenção do Sistema" description="Operações de limpeza — executadas sob demanda pelo super administrador" iconColor="#dc2626" />

            <ActionRow
              icon={Trash2} iconColor="#6b7280"
              title="Limpar Tokens Expirados"
              description={`Remove tokens de reset de senha que já venceram. ${fmtMaintenance('cleanup-tokens')}`}
              action={() => handleMaintenance('cleanup-tokens')}
              actionLabel="Executar"
              loading={loading}
            />
            <ActionRow
              icon={Trash2} iconColor="#6b7280"
              title="Limpar Sessões Expiradas"
              description={`Remove registros de sessões JWT antigas do banco. ${fmtMaintenance('cleanup-sessions')}`}
              action={() => handleMaintenance('cleanup-sessions')}
              actionLabel="Executar"
              loading={loading}
              last
            />

          </Section>

          {/* Informações técnicas */}
          <Section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', backgroundColor: '#0891b215', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Server size={18} color="#0891b2" />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827', margin: 0 }}>Informações Técnicas</h2>
                  <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0.15rem 0 0' }}>Dados em tempo real do backend e banco de dados</p>
                </div>
              </div>
              <button
                onClick={loadHealth}
                disabled={loadingHealth}
                style={{ padding: '0.35rem 0.625rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <RefreshCw size={12} style={{ animation: loadingHealth ? 'spin 1s linear infinite' : 'none' }} />
                Atualizar
              </button>
            </div>

            {loadingHealth ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                Carregando dados do sistema...
              </div>
            ) : healthData ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <TechCard
                    label="Status Geral"
                    value={healthData.status === 'healthy' ? '✅ Saudável' : healthData.status === 'degraded' ? '🟡 Degradado' : '🔴 Indisponível'}
                    color={healthData.status === 'healthy' ? '#16a34a' : healthData.status === 'degraded' ? '#d97706' : '#dc2626'}
                  />
                  <TechCard label="Versão da API"  value={healthData.version || 'v3.0.0'} />
                  <TechCard label="Ambiente"        value={healthData.environment === 'production' ? 'Produção' : 'Desenvolvimento'} />
                  <TechCard label="Uptime"          value={formatUptime(healthData.uptime)} sub="desde o último restart" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <TechCard
                    label="Banco de Dados"
                    value={healthData.services?.database?.status === 'connected' ? '✅ Conectado' : '❌ Erro'}
                    sub={healthData.services?.database?.latencyMs != null ? `Latência: ${healthData.services.database.latencyMs}ms` : null}
                    color={healthData.services?.database?.status === 'connected' ? '#16a34a' : '#dc2626'}
                  />
                  <TechCard
                    label="Sensor ESP8266"
                    value={
                      healthData.services?.sensor?.status === 'active'   ? '✅ Ativo' :
                      healthData.services?.sensor?.status === 'degraded' ? '🟡 Degradado' :
                      healthData.services?.sensor?.status === 'offline'  ? '🔴 Offline' : '⚪ Sem dados'
                    }
                    sub={healthData.services?.sensor?.minutosUltimaLeitura != null
                      ? `Última leitura: ${healthData.services.sensor.minutosUltimaLeitura} min atrás`
                      : null}
                    color={
                      healthData.services?.sensor?.status === 'active'   ? '#16a34a' :
                      healthData.services?.sensor?.status === 'degraded' ? '#d97706' : '#dc2626'
                    }
                  />
                  <TechCard label="Memória usada"   value={healthData.memory?.used || '—'} sub={`de ${healthData.memory?.total || '—'}`} />
                  <TechCard
                    label="Nível de Alerta"
                    value={healthData.services?.sensor?.nivelAlerta || '—'}
                    sub={healthData.services?.sensor?.confiabilidade != null
                      ? `Confiabilidade: ${healthData.services.sensor.confiabilidade}%`
                      : null}
                  />
                </div>

                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', fontSize: '0.7rem', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Response time: {healthData.responseTimeMs != null ? `${healthData.responseTimeMs}ms` : '—'}</span>
                  <span>Timestamp: {healthData.timestamp ? new Date(healthData.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'}</span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
                <Server size={24} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.8rem', margin: 0 }}>Não foi possível carregar os dados técnicos</p>
                <button onClick={loadHealth} style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer' }}>
                  Tentar novamente
                </button>
              </div>
            )}
          </Section>
        </>
      )}

      {/* ── Modal: Alterar Senha ──────────────────────────────────────── */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Alterar Senha" size="small">
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Input
              label="Senha Atual"
              type="password"
              required
              {...registerPassword('senhaAtual', { required: 'Senha atual é obrigatória' })}
              error={passwordErrors.senhaAtual?.message}
            />
            <Input
              label="Nova Senha"
              type="password"
              required
              {...registerPassword('novaSenha', {
                required: 'Nova senha é obrigatória',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Deve conter ao menos 1 minúscula, 1 maiúscula e 1 número',
                },
              })}
              error={passwordErrors.novaSenha?.message}
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              required
              {...registerPassword('confirmarSenha', {
                required: 'Confirmação obrigatória',
                validate: v => v === novaSenha || 'Senhas não coincidem',
              })}
              error={passwordErrors.confirmarSenha?.message}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              Alterar Senha
            </Button>
          </div>
        </form>
      </Modal>


    </div>
  );
}