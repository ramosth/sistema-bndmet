// Gestão de usuários - Com filtro por botão
// ============= src/components/users/UsersContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/api';
import { usePagination } from '@/hooks';
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
import { Plus, Search, Filter, Download, Users, UserCog, RefreshCw, UserX, X } from 'lucide-react';
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
  
  // Estados de filtro separados
  const [searchInput, setSearchInput] = useState(''); // Input local (não dispara API)
  const [activeFilter, setActiveFilter] = useState(''); // Filtro ativo (dispara API)
  
  const { isSuperAdmin } = useAuth();
  const pagination = usePagination(1, 10);

  // Carrega usuários quando filtro ativo ou paginação muda
  useEffect(() => {
    loadUsers();
    loadUserStats();
  }, [activeTab, pagination.page, pagination.limit, activeFilter]);

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
        busca: activeFilter || undefined,
        ativo: true
      };

      let response;
      if (activeTab === 'basic') {
        response = await userService.getBasicUsers(params);
      } else {
        response = await userService.getAdminUsers(params);
      }

      console.log(`📋 Response ${activeTab}:`, response);

      if (response.success) {
        const usersData = Array.isArray(response.data) ? 
          response.data : 
          response.data.usuarios || [];
        
        console.log(`✅ Usuários ativos recebidos da API (${activeTab}):`, usersData.length);
        setUsers(usersData);
        
        if (response.pagination) {
          pagination.setTotal(response.pagination.total);
        } else {
          pagination.setTotal(usersData.length);
        }
        
        if (usersData.length === 0 && activeFilter) {
          toast.info('Nenhum usuário ativo encontrado com os filtros aplicados');
        }
      } else {
        console.error(`❌ Erro na resposta da API (${activeTab}):`, response);
        setUsers([]);
        pagination.setTotal(0);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar usuários (${activeTab}):`, error);
      toast.error(`Erro ao carregar ${activeTab === 'basic' ? 'usuários básicos' : 'administradores'}`);
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
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Função para aplicar filtro (só quando clicar no botão)
  const handleApplyFilter = () => {
    console.log('🔍 Aplicando filtro:', searchInput);
    setActiveFilter(searchInput.trim());
    pagination.goToPage(1);
  };

  // Função para limpar filtros
  const handleClearFilters = () => {
    console.log('🧹 Limpando filtros');
    setSearchInput('');
    setActiveFilter('');
    pagination.goToPage(1);
  };

  // Função para trocar de aba
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchInput('');
    setActiveFilter('');
    pagination.goToPage(1);
  };

  const handleNewUser = () => {
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
    loadUsers(true);
    loadUserStats();
    toast.success(`${editingUser ? 'Usuário atualizado' : 'Usuário criado'} com sucesso!`);
  };

  const handleUserReactivated = () => {
    loadUsers(true);
    loadUserStats();
  };

  const handleRefresh = () => {
    loadUsers(true);
    loadUserStats();
  };

  const handleExport = () => {
    toast.success('Funcionalidade de exportação em desenvolvimento!');
  };

  const canEdit = () => {
    return isSuperAdmin() || activeTab === 'basic';
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: '0 0 0.5rem 0'
          }}>
            Gestão de Usuários
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            margin: 0
          }}>
            Gerencie usuários básicos e administradores do sistema
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <Button
            variant="outline"
            onClick={() => setShowInactiveModal(true)}
            style={{
              color: 'var(--gray-600)',
              borderColor: 'var(--gray-300)'
            }}
          >
            <UserX size={16} />
            Inativos
          </Button>

          <Button
            variant="outline"
            onClick={handleRefresh}
            loading={refreshing}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            Atualizar
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download size={16} />
            Exportar ({users.length})
          </Button>

          <Button
            variant="primary"
            onClick={handleNewUser}
          >
            <Plus size={16} />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <Card>
            <div className="text-center" style={{ padding: '1.5rem' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--primary-blue)',
                marginBottom: '0.5rem'
              }}>
                {stats.totalAdminsAtivos || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                Admins Ativos
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center" style={{ padding: '1.5rem' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--terracotta)',
                marginBottom: '0.5rem'
              }}>
                {stats.totalBasicosAtivos || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                Usuários Ativos
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center" style={{ padding: '1.5rem' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--green-600)',
                marginBottom: '0.5rem'
              }}>
                {stats.totalComNotificacoes || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                Com Notificações
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center" style={{ padding: '1.5rem' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--yellow-600)',
                marginBottom: '0.5rem'
              }}>
                {stats.alertasUltimos30Dias || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                Alertas (30d)
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--gray-200)',
        paddingBottom: '1rem'
      }}>
        {[
          { key: 'basic', label: 'Usuários Básicos', icon: Users, count: stats?.totalBasicosAtivos },
          { key: 'admin', label: 'Administradores', icon: UserCog, count: stats?.totalAdminsAtivos }
        ].map(({ key, label, icon: Icon, count }) => {
          const isActive = activeTab === key;
          
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: isActive ? 'var(--primary-blue)' : 'transparent',
                color: isActive ? 'white' : 'var(--gray-600)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = 'var(--gray-100)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={16} />
              {label}
              {count !== undefined && (
                <span style={{
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--gray-200)',
                  color: isActive ? 'white' : 'var(--gray-600)'
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtros com botão dedicado */}
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilter();
                }
              }}
              style={{ margin: 0 }}
            />
          </div>
          
          <Button
            variant="primary"
            onClick={handleApplyFilter}
            disabled={loading}
          >
            <Search size={16} />
            Filtrar
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={!searchInput && !activeFilter}
          >
            <Filter size={16} />
            Limpar
          </Button>
        </div>
        
        {/* Indicador de filtro ativo */}
        {activeFilter && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>
              <strong>Filtro ativo:</strong> "{activeFilter}"
            </span>
            <button
              onClick={handleClearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#1e40af',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Remover filtro"
            >
              <X size={14} />
              Remover
            </button>
          </div>
        )}
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
            canEdit={canEdit()}
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