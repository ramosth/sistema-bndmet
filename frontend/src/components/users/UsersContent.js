// Gestão de usuários
// ============= src/components/users/UsersContent.js - VERSÃO FINAL ATUALIZADA =============
'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/api';
import { usePagination, useFilters } from '@/hooks';
import { formatDate } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import UserForm from './UserForm';
import UserTable from './UserTable';
import InactiveUsersModal from './InactiveUsersModal';
import { Plus, Search, Filter, Download, Users, UserCog, RefreshCw, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [stats, setStats] = useState(null);
  
  const { isSuperAdmin } = useAuth();
  const pagination = usePagination(1, 10);
  const { filters, updateFilter, clearFilters } = useFilters({
    search: '',
    status: 'all'
  });

  useEffect(() => {
    loadUsers();
    loadUserStats();
  }, [activeTab, pagination.page, pagination.limit, filters]);

  const loadUsers = async (showRefreshingIndicator = false) => {
    if (showRefreshingIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = {
        pagina: pagination.page,
        limite: pagination.limit,
        busca: filters.search || undefined
      };

      let response;
      if (activeTab === 'basic') {
        response = await userService.getBasicUsers(params);
      } else {
        response = await userService.getAdminUsers(params);
      }

      console.log(`📋 Response ${activeTab}:`, response);

      if (response.success) {
        const usersData = Array.isArray(response.data) ? response.data : [];
        setUsers(usersData);
        
        if (response.pagination) {
          pagination.setTotal(response.pagination.total || 0);
          pagination.setPage(response.pagination.page || 1);
        } else {
          pagination.setTotal(usersData.length);
        }
        
        console.log(`✅ ${usersData.length} usuários ${activeTab} carregados`);
        
        if (usersData.length === 0 && filters.search) {
          toast.info('Nenhum usuário encontrado com os filtros aplicados');
        }
      } else {
        console.log('❌ Resposta sem sucesso:', response);
        setUsers([]);
        pagination.setTotal(0);
        toast.error('Erro na resposta da API');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
      setUsers([]);
      pagination.setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await userService.getUserStats();
      console.log('📊 Stats response:', response);
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleUserSaved = () => {
    handleCloseModal();
    loadUsers();
    loadUserStats();
    toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
  };

  const handleUserReactivated = () => {
    loadUsers();
    loadUserStats();
  };

  const handleSearch = (value) => {
    updateFilter('search', value);
    pagination.goToFirstPage();
  };

  const handleRefresh = () => {
    loadUsers(true);
    loadUserStats();
  };

  const exportUsers = () => {
    if (users.length === 0) {
      toast.error('Nenhum usuário para exportar');
      return;
    }

    const isBasicUser = users[0].hasOwnProperty('telefone');
    
    let csvContent;
    if (isBasicUser) {
      csvContent = [
        ['Nome', 'Email', 'Telefone', 'Status', 'Notificações', 'Tipo Notificação', 'Data Criação'],
        ...users.map(user => [
          user.nome,
          user.email,
          user.telefone || '',
          user.ativo ? 'Ativo' : 'Inativo',
          user.receberNotificacoes ? 'Sim' : 'Não',
          user.tipoNotificacao || '',
          formatDate(user.createdAt)
        ])
      ].map(row => row.join(',')).join('\n');
    } else {
      csvContent = [
        ['Nome', 'Email', 'Perfil', 'Status', 'Último Login', 'Data Criação'],
        ...users.map(user => [
          user.nome,
          user.email,
          user.perfil,
          user.ativo ? 'Ativo' : 'Inativo',
          user.ultimoLogin ? formatDate(user.ultimoLogin) : 'Nunca',
          formatDate(user.createdAt)
        ])
      ].map(row => row.join(',')).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab === 'basic' ? 'usuarios_basicos' : 'administradores'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Dados exportados com sucesso!');
  };

  const tabs = [
    { id: 'basic', label: 'Usuários Básicos', icon: Users },
    { id: 'admin', label: 'Administradores', icon: UserCog }
  ];

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--gray-800)',
            margin: 0 
          }}>
            Gestão de Usuários
          </h1>
          <p style={{ 
            color: 'var(--gray-600)', 
            margin: '0.5rem 0 0 0' 
          }}>
            Gerencie usuários básicos e administradores do sistema
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            onClick={() => setShowInactiveModal(true)}
          >
            <UserX size={16} />
            Inativos
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            loading={refreshing}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            onClick={exportUsers}
            disabled={users.length === 0 || loading}
          >
            <Download size={16} />
            Exportar ({users.length})
          </Button>
          
          <Button
            variant="primary"
            onClick={handleCreateUser}
          >
            <Plus size={16} />
            Novo {activeTab === 'basic' ? 'Usuário' : 'Admin'}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-4 mb-4">
          <Card>
            <div className="text-center">
              <div style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: 'var(--primary-blue)'
              }}>
                {stats.totalAdminsAtivos || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginTop: '0.25rem'
              }}>
                Admins Ativos
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: 'var(--terracotta)'
              }}>
                {stats.totalBasicosAtivos || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginTop: '0.25rem'
              }}>
                Usuários Ativos
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: 'var(--green-500)'
              }}>
                {stats.totalComNotificacoes || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginTop: '0.25rem'
              }}>
                Com Notificações
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: 'var(--yellow-500)'
              }}>
                {stats.alertasUltimos30Dias || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginTop: '0.25rem'
              }}>
                Alertas (30d)
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        borderBottom: '1px solid var(--gray-200)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--primary-blue)' : '2px solid transparent',
                  color: isActive ? 'var(--primary-blue)' : 'var(--gray-600)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '400'
                }}
              >
                <Icon size={16} />
                {tab.label}
                {stats && (
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.125rem 0.5rem',
                    backgroundColor: isActive ? 'var(--primary-blue)' : 'var(--gray-400)',
                    color: 'white',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {tab.id === 'basic' ? stats.totalBasicosAtivos : stats.totalAdminsAtivos}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              placeholder={`Buscar ${activeTab === 'basic' ? 'usuários' : 'administradores'} por nome ou email...`}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>
          
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!filters.search}
          >
            <Filter size={16} />
            Limpar
          </Button>
        </div>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={handleEditUser}
            onRefresh={loadUsers}
            pagination={pagination}
            userType={activeTab}
            canEdit={isSuperAdmin() || activeTab === 'basic'}
          />
        )}
      </Card>

      {/* Modal de Formulário */}
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

      {/* Modal de Usuários Inativos */}
      <InactiveUsersModal
        isOpen={showInactiveModal}
        onClose={() => setShowInactiveModal(false)}
        onUserReactivated={handleUserReactivated}
      />
    </div>
  );
}