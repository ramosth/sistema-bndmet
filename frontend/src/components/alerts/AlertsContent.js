// Central de alertas - COM PAGINAÇÃO
// ============= src/components/alerts/AlertsContent.js =============
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  Send,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertForm from "@/components/alerts/AlertForm";
import { sensorService, alertService } from "@/services/api";
import { formatDate, getAlertLevel, formatNumber } from "@/utils";
import { usePagination } from "@/hooks"; // 🔄 ADICIONADO: Import do hook de paginação

export default function AlertsContent() {
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]); // 🔄 ADICIONADO: Armazenar todos os alertas
  const [loading, setLoading] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  // NOVO: Estado para controlar o alerta de origem
  const [alertaOrigem, setAlertaOrigem] = useState(null);

  // 🔄 ADICIONADO: Hook de paginação com 10 itens por página
  const pagination = usePagination(1, 10);

  // 🔄 MODIFICADO: Função de carregamento com paginação
  const loadCriticalAlerts = async () => {
    setLoading(true);
    try {
      const response = await sensorService.getAlerts(100); // Buscar mais dados para paginar
      if (response.success) {
        const alerts = response.data || [];
        setAllAlerts(alerts); // Armazenar todos os alertas

        // 🔄 ADICIONADO: Aplicar paginação
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedAlerts = alerts.slice(startIndex, endIndex);

        setCriticalAlerts(paginatedAlerts);
        pagination.setTotal(alerts.length);

        console.log(
          `📊 Alertas: ${paginatedAlerts.length}/${alerts.length} (página ${pagination.page})`
        );
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Erro ao carregar alertas";
      toast.error(message);
      setAllAlerts([]);
      setCriticalAlerts([]);
      pagination.setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 MODIFICADO: Recarregar quando página muda
  useEffect(() => {
    loadCriticalAlerts();
  }, []);

  // 🔄 ADICIONADO: Aplicar paginação quando página muda
  useEffect(() => {
    if (allAlerts.length > 0) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedAlerts = allAlerts.slice(startIndex, endIndex);
      setCriticalAlerts(paginatedAlerts);
    }
  }, [pagination.page, pagination.limit, allAlerts]);

  // NOVO: Função para abrir modal com dados do alerta
  const handleNotificarAlerta = (alerta) => {
    setAlertaOrigem(alerta);
    setShowAlertModal(true);
  };

  // NOVO: Função para abrir modal vazio (botão "Enviar Alerta")
  const handleEnviarAlertaNovo = () => {
    setAlertaOrigem(null);
    setShowAlertModal(true);
  };

  const sendMassAlert = async (alertData) => {
    setSendingAlert(true);
    try {
      const response = await alertService.enviarAlertaMassa(alertData);

      if (response.success) {
        toast.success(
          `Alerta enviado para ${response.data.totalSucesso} usuários!`
        );
        setShowAlertModal(false);
        setAlertaOrigem(null); // Limpar dados de origem
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Erro ao enviar alerta";
      toast.error(message);
    } finally {
      setSendingAlert(false);
    }
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowAlertModal(false);
    setAlertaOrigem(null); // Limpar dados de origem
  };

  // 🔄 MODIFICADO: Usar todos os alertas para estatísticas
  const getAlertStats = () => {
    const stats = {
      critico: 0,
      medio: 0,
      total: allAlerts.length, // Usar total de todos os alertas
    };

    allAlerts.forEach((alert) => {
      // Usar todos os alertas
      if (alert.nivelAlerta === "VERMELHO" || alert.nivelAlerta === "CRITICO") {
        stats.critico++;
      } else if (alert.nivelAlerta === "AMARELO") {
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
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "var(--gray-800)",
              margin: 0,
            }}
          >
            Central de Alertas
          </h1>
          <p
            style={{
              color: "var(--gray-600)",
              margin: "0.5rem 0 0 0",
            }}
          >
            Monitore e envie alertas críticos do sistema
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
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
            onClick={handleEnviarAlertaNovo}
            icon={<Send size={16} />}
          >
            Enviar Alerta
          </Button>
        </div>
      </div>

      {/* Estatísticas de Alertas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <Card
          style={{
            padding: "1.5rem",
            textAlign: "center",
            border: "2px solid var(--red-200)",
            backgroundColor: "#fef2f2",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "var(--red-600)",
              marginBottom: "0.5rem",
            }}
          >
            {alertStats.total}
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--red-700)",
              fontWeight: "500",
            }}
          >
            Total de Alertas
          </div>
        </Card>

        <Card
          style={{
            padding: "1.5rem",
            textAlign: "center",
            border: "2px solid var(--red-300)",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "var(--red-500)",
              marginBottom: "0.5rem",
            }}
          >
            {alertStats.critico}
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--red-600)",
              fontWeight: "500",
            }}
          >
            Críticos
          </div>
        </Card>

        <Card
          style={{
            padding: "1.5rem",
            textAlign: "center",
            border: "2px solid var(--yellow-300)",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "var(--yellow-600)",
              marginBottom: "0.5rem",
            }}
          >
            {alertStats.medio}
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--yellow-700)",
              fontWeight: "500",
            }}
          >
            Médios
          </div>
        </Card>
      </div>

      {/* Lista de Alertas Críticos */}
      <Card title="Alertas Críticos Recentes" className="mb-4">
        {/* 🔄 ADICIONADO: Header com informações de paginação */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            padding: "0 1rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "var(--gray-800)",
              margin: 0,
            }}
          >
            Alertas Críticos Recentes
          </h3>
          {allAlerts.length > 0 && (
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--gray-600)",
              }}
            >
              Página {pagination.page} de{" "}
              {Math.ceil(pagination.total / pagination.limit)} (
              {pagination.total} total)
            </div>
          )}
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "3rem",
            }}
          >
            <LoadingSpinner size="large" />
          </div>
        ) : criticalAlerts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--gray-500)",
            }}
          >
            <AlertTriangle
              size={48}
              style={{ margin: "0 auto 1rem", opacity: 0.5 }}
            />
            <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>
              Nenhum alerta crítico encontrado
            </p>
            <p style={{ fontSize: "0.875rem" }}>
              Quando houver alertas críticos, eles aparecerão aqui
            </p>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {criticalAlerts.map((alert, index) => {
                const alertLevel = getAlertLevel(alert.nivelAlerta);

                return (
                  <div
                    key={`${alert.id || index}-${alert.timestamp}`}
                    style={{
                      padding: "1rem",
                      border: `2px solid ${alertLevel.color}20`,
                      borderLeft: `4px solid ${alertLevel.color}`,
                      borderRadius: "0.5rem",
                      backgroundColor: `${alertLevel.color}05`,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${alertLevel.color}10`;
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${alertLevel.color}05`;
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "1rem",
                      }}
                    >
                      {/* Informações do Alerta */}
                      <div style={{ flex: 1 }}>
                        {/* Header com timestamp e nível */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--gray-600)",
                            }}
                          >
                            {formatDate(alert.timestamp)}
                          </div>
                          <div
                            style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "12px",
                              backgroundColor: alertLevel.color,
                              color: "white",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              textTransform: "uppercase",
                            }}
                          >
                            {alertLevel.label}
                          </div>
                        </div>

                        {/* Métricas do sensor */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(120px, 1fr))",
                            gap: "0.75rem",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--gray-500)",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                marginBottom: "0.25rem",
                              }}
                            >
                              Umidade Solo
                            </div>
                            <div
                              style={{
                                fontSize: "1rem",
                                fontWeight: "600",
                                color: "var(--primary-blue-light)",
                              }}
                            >
                              {formatNumber(parseFloat(alert.umidadeSolo) || 0)}
                              %
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--gray-500)",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                marginBottom: "0.25rem",
                              }}
                            >
                              Risco Integrado
                            </div>
                            <div
                              style={{
                                fontSize: "1rem",
                                fontWeight: "600",
                                color: alertLevel.color,
                              }}
                            >
                              {formatNumber(
                                parseFloat(alert.riscoIntegrado) || 0
                              )}
                              %
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--gray-500)",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                marginBottom: "0.25rem",
                              }}
                            >
                              Precipitação 24h
                            </div>
                            <div
                              style={{
                                fontSize: "1rem",
                                fontWeight: "600",
                                color: "var(--primary-blue-light)",
                              }}
                            >
                              {formatNumber(
                                parseFloat(alert.precipitacao24h) || 0
                              )}
                              mm
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--gray-500)",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                marginBottom: "0.25rem",
                              }}
                            >
                              Previsão 24h
                            </div>
                            <div
                              style={{
                                fontSize: "1rem",
                                fontWeight: "600",
                                color: "var(--primary-blue-light)",
                              }}
                            >
                              {formatNumber(
                                parseFloat(alert.precipitacaoPrevisao24h) || 0
                              )}
                              mm
                            </div>
                          </div>
                        </div>

                        {/* Recomendação */}
                        {alert.recomendacao && (
                          <div
                            style={{
                              padding: "0.5rem",
                              backgroundColor: "#f8f9fa",
                              borderRadius: "0.25rem",
                              fontSize: "0.875rem",
                              color: "var(--gray-700)",
                              fontStyle: "italic",
                              marginTop: "0.5rem",
                            }}
                          >
                            💡 <strong>Recomendação:</strong>{" "}
                            {alert.recomendacao}
                          </div>
                        )}
                      </div>

                      {/* Botão de Ação */}
                      <div style={{ flexShrink: 0 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotificarAlerta(alert)}
                          style={{
                            borderColor: alertLevel.color,
                            color: alertLevel.color,
                            fontWeight: "600",
                          }}
                        >
                          <Users size={14} />
                          Notificar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🔄 ADICIONADO: Componente de Paginação */}
            {pagination.total > pagination.limit && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "2rem",
                  padding: "1rem 0",
                  borderTop: "1px solid var(--gray-200)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--gray-600)",
                  }}
                >
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  de {pagination.total} alertas
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => pagination.goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </Button>

                  {/* Números de página */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      margin: "0 0.5rem",
                    }}
                  >
                    {Array.from(
                      {
                        length: Math.min(
                          5,
                          Math.ceil(pagination.total / pagination.limit)
                        ),
                      },
                      (_, i) => {
                        const pageNum = pagination.page - 2 + i;
                        if (
                          pageNum < 1 ||
                          pageNum >
                            Math.ceil(pagination.total / pagination.limit)
                        )
                          return null;

                        const isActive = pageNum === pagination.page;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => pagination.goToPage(pageNum)}
                            style={{
                              width: "2rem",
                              height: "2rem",
                              border: "none",
                              borderRadius: "0.25rem",
                              backgroundColor: isActive
                                ? "var(--primary-blue)"
                                : "transparent",
                              color: isActive ? "white" : "var(--gray-600)",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.target.style.backgroundColor =
                                  "var(--gray-100)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.target.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => pagination.goToPage(pagination.page + 1)}
                    disabled={
                      pagination.page >=
                      Math.ceil(pagination.total / pagination.limit)
                    }
                  >
                    Próxima
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal de Envio de Alerta */}
      <Modal
        isOpen={showAlertModal}
        onClose={handleCloseModal}
        title={alertaOrigem ? "Enviar Alerta em Massa" : "Criar Novo Alerta"}
        size="md" // Tamanho reduzido conforme solicitado anteriormente
      >
        <AlertForm
          alertaOrigem={alertaOrigem} // Passar dados do alerta de origem
          onSend={sendMassAlert}
          onCancel={handleCloseModal}
          loading={sendingAlert}
        />
      </Modal>
    </div>
  );
}
