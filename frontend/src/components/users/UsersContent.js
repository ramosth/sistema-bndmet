// Gestão de usuários — Estrutura UX completa
// ============= src/components/users/UsersContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/api';
import { usePagination } from '@/hooks';
import { formatDateBRCSV } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import UserForm from './UserForm';
import UserTable from './UserTable';
import InactiveUsersModal from './InactiveUsersModal';
import {
  Plus, Search, Download, Users, UserCog,
  RefreshCw, UserX, X, Bell, AlertTriangle,
  Activity, UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
//  KPI Card
// ─────────────────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, iconColor, value, label, sub, valueColor }) => (
  <div style={{ padding: '1rem 1.25rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={iconColor} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: valueColor || '#111827', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginTop: '0.1rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.1rem' }}>{sub}</div>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function UsersContent() {
  const [users,              setUsers]              = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [refreshing,         setRefreshing]         = useState(false);
  const [showModal,          setShowModal]          = useState(false);
  const [showInactiveModal,  setShowInactiveModal]  = useState(false);
  const [editingUser,        setEditingUser]        = useState(null);
  const [activeTab,          setActiveTab]          = useState('basic');
  const [stats,              setStats]              = useState(null);
  const [searchInput,        setSearchInput]        = useState('');
  const [activeFilter,       setActiveFilter]       = useState('');

  const { isSuperAdmin } = useAuth();
  const pagination = usePagination(1, 10);

  useEffect(() => {
    loadUsers();
    loadUserStats();
  }, [activeTab, pagination.page, pagination.limit, activeFilter]);

  // ── Carregamento ──────────────────────────────────────────────────────────
  const loadUsers = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const params = { pagina: pagination.page, limite: pagination.limit, busca: activeFilter || undefined, ativo: true };
      const response = activeTab === 'basic'
        ? await userService.getBasicUsers(params)
        : await userService.getAdminUsers(params);

      if (response.success) {
        const data = Array.isArray(response.data) ? response.data : response.data.usuarios || [];
        setUsers(data);
        pagination.setTotal(response.pagination?.total ?? data.length);
        if (data.length === 0 && activeFilter) toast.info('Nenhum usuário encontrado com esse filtro.');
      } else {
        setUsers([]); pagination.setTotal(0);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error(`Erro ao carregar ${activeTab === 'basic' ? 'usuários' : 'administradores'}`);
      setUsers([]); pagination.setTotal(0);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success) setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // ── Filtros ───────────────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    setActiveFilter(searchInput.trim());
    pagination.goToPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput(''); setActiveFilter(''); pagination.goToPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab); setSearchInput(''); setActiveFilter(''); pagination.goToPage(1);
  };

  // ── Ações de usuário ──────────────────────────────────────────────────────
  const handleNewUser  = ()     => { setEditingUser(null); setShowModal(true); };
  const handleEditUser = (user) => { setEditingUser(user); setShowModal(true); };
  const handleCloseModal = ()   => { setShowModal(false); setEditingUser(null); };

  const handleUserSaved = () => {
    handleCloseModal();
    loadUsers(true);
    loadUserStats();
  };

  const handleUserReactivated = () => { loadUsers(true); loadUserStats(); };
  const handleRefresh = () => { loadUsers(true); loadUserStats(); };

  // ── Export CSV funcional ──────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      // Busca todos sem paginação para exportar
      const params = { pagina: 1, limite: 9999, busca: activeFilter || undefined, ativo: true };
      const response = activeTab === 'basic'
        ? await userService.getBasicUsers(params)
        : await userService.getAdminUsers(params);

      if (!response.success) { toast.error('Erro ao obter dados para exportação'); return; }

      const allUsers = Array.isArray(response.data) ? response.data : response.data.usuarios || [];
      if (!allUsers.length) { toast.error('Nenhum dado para exportar'); return; }

      let rows;
      if (activeTab === 'basic') {
        rows = [
          ['Nome', 'Email', 'Telefone', 'Receber Notificações', 'Tipo Notificação', 'Status', 'Criado em', 'Atualizado em', 'ID'],
          ...allUsers.map(u => [
            `"${(u.nome||'').replace(/"/g,'""')}"`,
            u.email || '',
            u.telefone || '',
            u.receberNotificacoes ? 'Sim' : 'Não',
            u.tipoNotificacao === 'email,sms' ? 'Email + SMS' : 'Apenas Email',
            u.ativo ? 'Ativo' : 'Inativo',
            formatDateBRCSV(u.createdAt),
            formatDateBRCSV(u.updatedAt),
            u.id || '',
          ]),
        ];
      } else {
        rows = [
          ['Nome', 'Email', 'Perfil', 'Último Login', 'Status', 'Criado em', 'Atualizado em', 'ID'],
          ...allUsers.map(u => [
            `"${(u.nome||'').replace(/"/g,'""')}"`,
            u.email || '',
            u.perfil === 'super_admin' ? 'Super Administrador' : 'Administrador',
            u.ultimoLogin ? formatDateBRCSV(u.ultimoLogin) : 'Nunca',
            u.ativo ? 'Ativo' : 'Inativo',
            formatDateBRCSV(u.createdAt),
            formatDateBRCSV(u.updatedAt),
            u.id || '',
          ]),
        ];
      }

      const csv   = rows.map(r => r.join(',')).join('\n');
      const blob  = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url   = window.URL.createObjectURL(blob);
      const link  = document.createElement('a');
      const tipo  = activeTab === 'basic' ? 'usuarios_basicos' : 'administradores';
      const data  = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.href   = url;
      link.download = `${tipo}_${data}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`${allUsers.length} registros exportados com sucesso!`);
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  const canEdit = () => isSuperAdmin() || activeTab === 'basic';

  // Totais derivados para as abas
  const totalInativos = (stats?.totalAdminsInativos || 0) + (stats?.totalBasicosInativos || 0);
  const totalUsuarios = (stats?.totalAdminsAtivos || 0) + (stats?.totalBasicosAtivos || 0)
    + (stats?.totalAdminsInativos || 0) + (stats?.totalBasicosInativos || 0);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: 0 }}>
            Gestão de Usuários
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
            Gerencie usuários básicos e administradores do sistema
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => setShowInactiveModal(true)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
            <UserX size={14} /> Inativos {totalInativos > 0 && <span style={{ marginLeft: '0.25rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: '700' }}>{totalInativos}</span>}
          </Button>
          <Button variant="outline" onClick={handleRefresh} loading={refreshing} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
            <RefreshCw size={14} /> Atualizar
          </Button>
          <Button variant="primary" onClick={handleNewUser} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
            <Plus size={14} /> Novo Usuário
          </Button>
        </div>
      </div>

      {/* ── 6 KPIs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <KpiCard icon={Users}        iconColor="#2563eb"  value={totalUsuarios}                   label="Total de Usuários"   sub="ativos + inativos" />
        <KpiCard icon={UserCog}      iconColor="#7c3aed"  value={stats?.totalAdminsAtivos  || 0}  label="Admins Ativos"       sub={`${stats?.totalAdminsInativos || 0} inativos`} />
        <KpiCard icon={UserCheck}    iconColor="#0891b2"  value={stats?.totalBasicosAtivos || 0}  label="Básicos Ativos"      sub={`${stats?.totalBasicosInativos || 0} inativos`} />
        <KpiCard icon={Bell}         iconColor="#16a34a"  value={stats?.totalComNotificacoes || 0} label="Com Notificações"    sub="usuários básicos" />
        <KpiCard icon={Activity}     iconColor="#dc2626"  value={totalInativos}                   label="Inativos Total"      sub="admins + básicos" valueColor={totalInativos > 0 ? '#dc2626' : '#374151'} />
        <KpiCard icon={AlertTriangle} iconColor="#d97706" value={stats?.alertasUltimos30Dias || 0} label="Alertas Enviados"   sub="últimos 30 dias" />
      </div>

      {/* ── Abas ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
        {[
          {
            key:   'basic',
            label: 'Usuários Básicos',
            icon:  Users,
            ativos:   stats?.totalBasicosAtivos   || 0,
            inativos: stats?.totalBasicosInativos || 0,
          },
          {
            key:   'admin',
            label: 'Administradores',
            icon:  UserCog,
            ativos:   stats?.totalAdminsAtivos   || 0,
            inativos: stats?.totalAdminsInativos || 0,
          },
        ].map(({ key, label, icon: Icon, ativos, inativos }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1rem',
                border: 'none', borderRadius: '0.375rem 0.375rem 0 0',
                borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: '-2px',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#2563eb' : '#6b7280',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: isActive ? '600' : '500',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              {label}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.25rem' }}>
                <span style={{ padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: isActive ? '#2563eb' : '#e5e7eb', color: isActive ? 'white' : '#6b7280' }}>
                  {ativos}
                </span>
                {inativos > 0 && (
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '600', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                    {inativos} inativo{inativos > 1 ? 's' : ''}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tabela com header integrado ──────────────────────────────────── */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Header da tabela: busca + filtros + exportar */}
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* Busca */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilter()}
              placeholder={`Buscar ${activeTab === 'basic' ? 'usuários' : 'administradores'} por nome ou email...`}
              style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#374151', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={handleApplyFilter}
            style={{ padding: '0.45rem 0.875rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Search size={13} /> Filtrar
          </button>

          {activeFilter && (
            <button
              onClick={handleClearFilters}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <X size={13} /> Limpar
            </button>
          )}

          {/* Divisor */}
          <div style={{ width: '1px', height: '1.5rem', backgroundColor: '#e5e7eb', flexShrink: 0 }} />

          {/* Exportar */}
          <button
            onClick={handleExport}
            style={{ padding: '0.45rem 0.875rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
          >
            <Download size={13} /> Exportar CSV
          </button>

          {/* Contagem */}
          <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {pagination.total} {activeTab === 'basic' ? 'usuário(s)' : 'admin(s)'}
            {activeFilter && <span style={{ marginLeft: '0.375rem', color: '#2563eb', fontWeight: '600' }}>· filtro: "{activeFilter}"</span>}
          </span>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={handleEditUser}
            onRefresh={loadUsers}
            pagination={pagination}
            userType={activeTab}
            canEdit={canEdit()}
          />
        )}
      </div>

      {/* Modais */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? 'Editar Usuário' : `Novo ${activeTab === 'basic' ? 'Usuário' : 'Administrador'}`}
        size="medium"
      >
        <UserForm
          user={editingUser}
          userType={activeTab}
          onSave={handleUserSaved}
          onCancel={handleCloseModal}
        />
      </Modal>

      <InactiveUsersModal
        isOpen={showInactiveModal}
        onClose={() => setShowInactiveModal(false)}
        onUserReactivated={handleUserReactivated}
      />
    </div>
  );
}