// Central de alertas
// ============= src/components/alerts/AlertsContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService, alertService } from '@/services/api';
import { formatDate, getAlertLevel } from '@/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AlertForm from './AlertForm';
import { AlertTriangle, Send, RefreshCw, Bell, Users, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlertsContent() {
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    loadCriticalAlerts();
  }, []);

  const loadCriticalAlerts = async () => {
    setLoading(true);
    try {
      const response = await sensorService.getAlerts(50);
      setCriticalAlerts(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      toast.error('Erro ao carregar alertas críticos');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async (alertData) => {
    setSendingAlert(true);
    try {
      const response = await alertService.sendMassAlert(alertData);
      
      if (response.success) {
        toast.success(`Alerta enviado para ${response.data.totalSucesso} usuários!`);
        setShowAlertModal(false);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao enviar alerta';
      toast.error(message);
    } finally {
      setSendingAlert(false);
    }
  };

  const getAlertStats = () => {
    const stats = {
      critico: 0,
      alto: 0,
      medio: 0,
      total: criticalAlerts.length
    };

    criticalAlerts.forEach(alert => {
      if (alert.nivelAlerta === 'VERMELHO' || alert.nivelAlerta === 'CRITICO') {
        stats.critico++;
      } else if (alert.nivelAlerta === 'LARANJA') {
        stats.alto++;
      } else if (alert.nivelAlerta === 'AMARELO') {
        stats.medio++;
      }
    });

    return stats;
  };

  const alertStats = getAlertStats();

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
            Central de Alertas
          </h1>
          <p style={{ 
            color: 'var(--gray-600)', 
            margin: '0.5rem 0 0 0' 
          }}>
            Monitore e envie alertas críticos do sistema
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            onClick={loadCriticalAlerts}
            loading={loading}
          >
            <RefreshCw size={16} />
            Atualizar
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setShowAlertModal(true)}
          >
            <Send size={16} />
            Enviar Alerta
          </Button>
        </div>
      </div>

      {/* Estatísticas de Alertas */}
      <div className="grid grid-4 mb-4">
        <Card>
          <div className="flex-between">
            <div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                margin: '0 0 0.5rem 0'
              }}>
                Total de Alertas
              </p>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--gray-800)',
                margin: 0
              }}>
                {alertStats.total}
              </p>
            </div>
            <Bell size={24} color="var(--primary-blue)" />
          </div>
        </Card>
        
        <Card>
          <div className="flex-between">
            <div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                margin: '0 0 0.5rem 0'
              }}>
                Críticos
              </p>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--red-600)',
                margin: 0
              }}>
                {alertStats.critico}
              </p>
            </div>
            <AlertTriangle size={24} color="var(--red-600)" />
          </div>
        </Card>
        
        <Card>
          <div className="flex-between">
            <div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                margin: '0 0 0.5rem 0'
              }}>
                Alto Risco
              </p>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--orange-500)',
                margin: 0
              }}>
                {alertStats.alto}
              </p>
            </div>
            <AlertTriangle size={24} color="var(--orange-500)" />
          </div>
        </Card>
        
        <Card>
          <div className="flex-between">
            <div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                margin: '0 0 0.5rem 0'
              }}>
                Atenção
              </p>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--yellow-500)',
                margin: 0
              }}>
                {alertStats.medio}
              </p>
            </div>
            <AlertTriangle size={24} color="var(--yellow-500)" />
          </div>
        </Card>
      </div>

      {/* Lista de Alertas Críticos */}
      <Card title="Alertas Críticos Recentes">
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : criticalAlerts.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem' }}>
            <AlertTriangle size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-700)' }}>
              Nenhum alerta crítico
            </h3>
            <p style={{ margin: 0, color: 'var(--gray-500)' }}>
              Sistema funcionando normalmente.
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {criticalAlerts.map((alert, index) => {
                const level = getAlertLevel(alert.nivelAlerta);
                
                return (
                  <div 
                    key={index}
                    style={{
                      padding: '1rem',
                      border: `1px solid ${level.color}30`,
                      borderLeft: `4px solid ${level.color}`,
                      borderRadius: '0.5rem',
                      backgroundColor: `${level.color}10`
                    }}
                  >
                    <div className="flex-between mb-4">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: level.color,
                          color: 'white',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {level.text}
                        </span>
                        
                        <span style={{
                          fontSize: '0.875rem',
                          color: 'var(--gray-600)'
                        }}>
                          {formatDate(alert.timestamp)}
                        </span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // Enviar alerta específico para este evento
                          setShowAlertModal(true);
                        }}
                      >
                        <Send size={14} />
                        Notificar
                      </Button>
                    </div>
                    
                    <div className="grid grid-3" style={{ gap: '1rem' }}>
                      <div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: 'var(--gray-500)',
                          margin: '0 0 0.25rem 0',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          Umidade do Solo
                        </p>
                        <p style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--terracotta)',
                          margin: 0
                        }}>
                          {alert.umidadeSolo}%
                        </p>
                      </div>
                      
                      <div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: 'var(--gray-500)',
                          margin: '0 0 0.25rem 0',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          Temperatura
                        </p>
                        <p style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--primary-blue)',
                          margin: 0
                        }}>
                          {alert.temperatura}°C
                        </p>
                      </div>
                      
                      <div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: 'var(--gray-500)',
                          margin: '0 0 0.25rem 0',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          Risco Integrado
                        </p>
                        <p style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--red-500)',
                          margin: 0
                        }}>
                          {alert.riscoIntegrado}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Envio de Alerta */}
      <Modal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title="Enviar Alerta em Massa"
        size="large"
      >
        <AlertForm
          onSend={handleSendAlert}
          onCancel={() => setShowAlertModal(false)}
          loading={sendingAlert}
        />
      </Modal>
    </div>
  );
}