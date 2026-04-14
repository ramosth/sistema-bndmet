// Central de alertas — Estrutura UX completa
// ============= src/components/alerts/AlertsContent.js =============
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  AlertTriangle, Send, RefreshCw, Users, Bell, History,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Zap,
  CheckCircle, XCircle, AlertCircle, Mail
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertForm from "@/components/alerts/AlertForm";
import { sensorService, alertService, userService } from "@/services/api";
import { formatDateBR, getAlertLevel } from "@/utils";
import { usePagination } from "@/hooks";

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Mesma lógica do ReportsContent:
// Ruptura       = VERMELHO + recomendacao contém 'RUPTURA'
// Vermelho puro = VERMELHO + recomendacao contém 'CRÍTICO'
const isRupturaAlert = (a) =>
  a.nivelAlerta === 'VERMELHO' &&
  typeof a.recomendacao === 'string' &&
  a.recomendacao.includes('RUPTURA');

const isVermelhoPuro = (a) =>
  a.nivelAlerta === 'VERMELHO' &&
  typeof a.recomendacao === 'string' &&
  a.recomendacao.includes('CRÍTICO');

const fmt = (v, decimals = 1) => {
  const x = parseFloat(v);
  if (isNaN(x) || v == null) return "—";
  return x.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// riscoIntegrado vem como decimal (0-1); indiceRisco como inteiro (0-100)
const fmtRisco = (alert) => {
  if (alert.indiceRisco != null) return fmt(alert.indiceRisco, 1);
  if (alert.riscoIntegrado != null) return fmt(parseFloat(alert.riscoIntegrado) * 100, 1);
  return "—";
};

const ApiBadge = ({ status, label }) => {
  const ok = status === "OK";
  return (
    <span style={{
      padding: "0.125rem 0.4rem", borderRadius: "0.25rem",
      fontSize: "0.7rem", fontWeight: "600",
      backgroundColor: !status ? "#f3f4f6" : ok ? "#dcfce7" : "#fee2e2",
      color: !status ? "#9ca3af" : ok ? "#166534" : "#991b1b",
    }}>
      {label}: {status || "—"}
    </span>
  );
};

const ConfBadge = ({ value }) => {
  if (value == null) return <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>—</span>;
  const color = value >= 90 ? "#166534" : value >= 70 ? "#854d0e" : "#991b1b";
  const bg = value >= 90 ? "#dcfce7" : value >= 70 ? "#fef9c3" : "#fee2e2";
  return (
    <span style={{
      padding: "0.125rem 0.4rem", borderRadius: "0.25rem",
      fontSize: "0.7rem", fontWeight: "600",
      backgroundColor: bg, color,
    }}>
      🎯 {value}%
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function AlertsContent() {
  const [allAlerts, setAllAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertaOrigem, setAlertaOrigem] = useState(null);
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [expandedCard, setExpandedCard] = useState(null);
  const [alertStats, setAlertStats] = useState(null);

  // ── Estado do modal de Log de Envios ─────────────────────────────────────
  const [showLogModal,  setShowLogModal]  = useState(false);
  const [logsEnvios,    setLogsEnvios]    = useState([]);
  const [logsLoading,   setLogsLoading]   = useState(false);
  const [logsTotal,     setLogsTotal]     = useState(0);
  const [logsPagina,    setLogsPagina]    = useState(1);
  const [expandedLog,   setExpandedLog]   = useState(null);
  const LOGS_POR_PAGINA = 10;

  const pagination = usePagination(1, 10);

  // ── Carregamento ──────────────────────────────────────────────────────────
  const loadCriticalAlerts = async () => {
    setLoading(true);
    try {
      const response = await sensorService.getAlerts(200);
      if (response.success) {
        setAllAlerts(response.data || []);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Erro ao carregar alertas");
      setAllAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success) setAlertStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de alertas:', error);
    }
  };

  // ── Log de Envios ────────────────────────────────────────────────────────
  const loadLogsEnvios = async (pagina = 1) => {
    setLogsLoading(true);
    try {
      const response = await alertService.getLogsAlertas(pagina, LOGS_POR_PAGINA);
      if (response.success) {
        setLogsEnvios(response.data || []);
        setLogsTotal(response.pagination?.total || 0);
        setLogsPagina(pagina);
        setExpandedLog(null);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Erro ao carregar logs de alertas");
      setLogsEnvios([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleAbrirLogs = () => {
    setShowLogModal(true);
    if (logsEnvios.length === 0) loadLogsEnvios(1);
  };

  useEffect(() => { loadCriticalAlerts(); loadUserStats(); }, []);

  // ── Filtro ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const mapa = {
      amarelo: (a) => a.nivelAlerta === "AMARELO",
      vermelho: (a) => isVermelhoPuro(a),
      ruptura: (a) => isRupturaAlert(a),
    };
    const result = filtroNivel === "todos" ? allAlerts : allAlerts.filter(mapa[filtroNivel] || (() => true));
    setFilteredAlerts(result);
    pagination.setTotal(result.length);
    pagination.goToPage(1);
  }, [allAlerts, filtroNivel]);

  // ── Paginação ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const start = (pagination.page - 1) * pagination.limit;
    setVisibleAlerts(filteredAlerts.slice(start, start + pagination.limit));
  }, [filteredAlerts, pagination.page, pagination.limit]);

  // ── Ações ─────────────────────────────────────────────────────────────────
  const handleNotificarAlerta = (alerta) => { setAlertaOrigem(alerta); setShowAlertModal(true); };
  const handleEnviarAlertaNovo = () => { setAlertaOrigem(null); setShowAlertModal(true); };
  const handleCloseModal = () => { setShowAlertModal(false); setAlertaOrigem(null); };

  const sendMassAlert = async (alertData) => {
    setSendingAlert(true);
    try {
      const response = await alertService.enviarAlertaMassa(alertData);
      if (response.success) {
        const { totalSucesso, totalFalhas } = response.data;
        const mensagem = `Alerta enviado: ${totalSucesso} sucesso${totalSucesso !== 1 ? 's' : ''} e ${totalFalhas} falha${totalFalhas !== 1 ? 's' : ''}. Verifique os logs para detalhes.`;

        if (totalFalhas > 0) {
          toast(mensagem, {
            duration: 6000,
            icon: '⚠️',
            style: {
              background: '#fef9c3',
              color: '#854d0e',
              border: '1px solid #fde047',
            },
          });
        } else {
          toast.success(mensagem, { duration: 6000 });
        }

        handleCloseModal();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Erro ao enviar alerta");
    } finally {
      setSendingAlert(false);
    }
  };

  // ── Estatísticas ──────────────────────────────────────────────────────────
  const stats = {
    total: allAlerts.length,
    vermelho: allAlerts.filter(a => isVermelhoPuro(a)).length,
    amarelo: allAlerts.filter(a => a.nivelAlerta === "AMARELO").length,
    ruptura: allAlerts.filter(a => isRupturaAlert(a)).length,
  };

  const totalPages = Math.ceil(filteredAlerts.length / pagination.limit);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Cabeçalho */}
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "var(--gray-800)", margin: 0 }}>
            Central de Alertas
          </h1>
          <p style={{ color: "var(--gray-600)", margin: "0.5rem 0 0 0" }}>
            Monitore e notifique usuários sobre eventos críticos do sistema
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outline" onClick={loadCriticalAlerts} loading={loading}>
            <RefreshCw size={16} /> Atualizar
          </Button>
          <Button variant="outline" onClick={handleAbrirLogs}>
            <History size={16} /> Log de Envios
          </Button>
          <Button variant="primary" onClick={handleEnviarAlertaNovo}>
            <Send size={16} /> Enviar Alerta
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1rem", marginBottom: "1.5rem",
      }}>
        {[
          { label: "Total de Alertas", value: stats.total, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "🔴 Críticos", value: stats.vermelho, color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
          { label: "🟡 Atenção", value: stats.amarelo, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
          { label: "🚨 Rupturas", value: stats.ruptura, color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
          { label: "📨 Enviados (30d)", value: alertStats?.alertasUltimos30Dias ?? "—", color: "#0891b2", bg: "#f0f9ff", border: "#bae6fd", sub: "via Central de Alertas" },
        ].map(({ label, value, color, bg, border, sub }) => (
          <div key={label} style={{
            padding: "1.25rem", borderRadius: "0.5rem", textAlign: "center",
            backgroundColor: bg, border: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color }}>{value}</div>
            <div style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.25rem", fontWeight: "500" }}>
              {label}
            </div>
            {sub && <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.125rem" }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Lista */}
      <Card>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--gray-800)", margin: 0 }}>
            Alertas Críticos
            {filteredAlerts.length > 0 && (
              <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#6b7280", fontWeight: "400" }}>
                ({filteredAlerts.length} registros)
              </span>
            )}
          </h3>

          {/* Filtro por nível */}
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {[
              { id: "todos", label: "Todos" },
              { id: "vermelho", label: "🔴 Vermelho" },
              { id: "amarelo", label: "🟡 Amarelo" },
              { id: "ruptura", label: "🚨 Ruptura" },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setFiltroNivel(id)} style={{
                padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
                border: `1px solid ${filtroNivel === id ? "#2563eb" : "#e5e7eb"}`,
                backgroundColor: filtroNivel === id ? "#2563eb" : "white",
                color: filtroNivel === id ? "white" : "#374151",
                fontSize: "0.8rem", fontWeight: "500", cursor: "pointer",
                transition: "all 0.15s ease",
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <LoadingSpinner size="large" />
          </div>
        ) : visibleAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            <AlertTriangle size={48} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
            <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem", color: "#6b7280" }}>
              Nenhum alerta encontrado
            </p>
            <p style={{ fontSize: "0.875rem" }}>
              {filtroNivel === "todos"
                ? "Quando houver alertas críticos, eles aparecerão aqui."
                : `Nenhum alerta com nível "${filtroNivel}" no período carregado.`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {visibleAlerts.map((alert, index) => {
              const alertLevel = getAlertLevel(alert.nivelAlerta);
              const isRuptura = isRupturaAlert(alert);
              const isExpanded = expandedCard === index;

              // Componentes V_x
              const vx = [
                { label: "V_lençol (×0,40)", value: alert.vLencol },
                { label: "V_ch.24h (×0,08)", value: alert.vChuvaAtual },
                { label: "V_ch.7d (×0,12)", value: alert.vChuvaHistorica },
                { label: "V_ch.30d (×0,10)", value: alert.vChuvaMensal },
                { label: "V_ch.fut (×0,15)", value: alert.vChuvaFutura },
                { label: "V_taxa (×0,10)", value: alert.vTaxaVariacao },
                { label: "V_pressão (×0,05)", value: alert.vPressao },
              ];
              const frSoma = vx.reduce((s, v) => s + (parseFloat(v.value) || 0), 0);
              const det = alert.dadosBrutos?.confiabilidade_detalhes || null;

              const descontoInfo = {
                sensor_falha: "Sensor físico com falha (ADC=1024)",
                bndmet_indisponivel: "API BNDMET indisponível",
                qualidade_bndmet: "Qualidade BNDMET < 80%",
                owm_indisponivel: "API OWM indisponível",
                wifi_desconectado: "WiFi desconectado",
                buffer_insuficiente: "Buffer histórico insuficiente",
              };

              return (
                <div key={`${alert.id || index}-${alert.timestamp}`} style={{
                  borderRadius: "0.5rem",
                  border: `1px solid ${isRuptura ? "#fca5a5" : alertLevel.color + "30"}`,
                  borderLeft: `5px solid ${isRuptura ? "#dc2626" : alertLevel.color}`,
                  backgroundColor: isRuptura ? "#fff5f5" : `${alertLevel.color}06`,
                  overflow: "hidden",
                }}>

                  {/* Animação pulsante ruptura */}
                  {isRuptura && (
                    <style>{`
                      @keyframes pulse-left { 0%,100%{border-left-color:#dc2626} 50%{border-left-color:#fca5a5} }
                    `}</style>
                  )}
                  {isRuptura && Object.assign(
                    document.getElementById(`card-${index}`) || {},
                    { style: "animation: pulse-left 2s infinite" }
                  ) && null}

                  <div style={{ padding: "1rem" }}>

                    {/* ── Zona 1: Header ──────────────────────────────── */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.875rem",
                    }}>
                      {/* Esquerda: timestamp + badges de estado */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.825rem", color: "#4b5563", fontWeight: "500" }}>
                          {formatDateBR(alert.timestamp)}
                        </span>

                        <span style={{
                          padding: "0.2rem 0.625rem", borderRadius: "9999px",
                          backgroundColor: alertLevel.color, color: "white",
                          fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase",
                        }}>
                          {alertLevel.text}
                        </span>

                        {isRuptura && (
                          <span style={{
                            padding: "0.2rem 0.625rem", borderRadius: "9999px",
                            backgroundColor: "#dc2626", color: "white",
                            fontSize: "0.7rem", fontWeight: "700",
                          }}>
                            🚨 RUPTURA
                          </span>
                        )}

                        {alert.amplificado && (
                          <span style={{
                            padding: "0.2rem 0.5rem", borderRadius: "0.25rem",
                            backgroundColor: "#fff7ed", border: "1px solid #fdba74",
                            color: "#c2410c", fontSize: "0.7rem", fontWeight: "700",
                            display: "inline-flex", alignItems: "center", gap: "0.2rem",
                          }}>
                            <Zap size={10} /> ×1,20
                          </span>
                        )}
                      </div>

                      {/* Direita: qualidade + botões */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <ConfBadge value={alert.confiabilidade} />
                        <ApiBadge status={alert.statusApiBndmet} label="BNDMET" />
                        <ApiBadge status={alert.statusApiOwm} label="OWM" />

                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : index)}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.25rem",
                            padding: "0.25rem 0.5rem", borderRadius: "0.375rem",
                            border: "1px solid #e5e7eb", backgroundColor: "white",
                            color: "#6b7280", fontSize: "0.75rem", cursor: "pointer",
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? "Menos" : "Detalhes"}
                        </button>

                        <Button
                          variant="outline" size="sm"
                          onClick={() => handleNotificarAlerta(alert)}
                          style={{
                            borderColor: isRuptura ? "#dc2626" : alertLevel.color,
                            color: isRuptura ? "#dc2626" : alertLevel.color,
                            fontWeight: "600", fontSize: "0.75rem",
                          }}
                        >
                          <Users size={13} /> Notificar
                        </Button>
                      </div>
                    </div>

                    {/* ── Zona 2: Métricas principais ─────────────────── */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                      gap: "0.625rem", marginBottom: "0.75rem",
                    }}>
                      {[
                        {
                          label: "Umidade Solo",
                          value: `${fmt(alert.umidadeSolo)}%`,
                          color: parseFloat(alert.umidadeSolo) >= 30 ? "#dc2626"
                            : parseFloat(alert.umidadeSolo) >= 20 ? "#d97706" : "#2563eb",
                          sub: parseFloat(alert.umidadeSolo) >= 30 ? "⚠️ Acima do limiar" : null,
                        },
                        {
                          label: "Risco (FR)",
                          value: `${fmtRisco(alert)}%`,
                          color: alertLevel.color,
                          sub: alert.amplificado ? "×1,20 aplicado" : isRuptura ? "override firmware" : null,
                        },
                        {
                          label: "Precip. 24h",
                          value: `${fmt(alert.precipitacao24h)} mm`,
                          color: "#1d4ed8", sub: null,
                        },
                        {
                          label: "Precip. 7d",
                          value: `${fmt(alert.precipitacao7d)} mm`,
                          color: "#1d4ed8", sub: null,
                        },
                        {
                          label: "Precip. 30d",
                          value: `${fmt(alert.precipitacao30d)} mm`,
                          color: "#1d4ed8", sub: null,
                        },
                        {
                          label: "Prev. 24h",
                          value: `${fmt(alert.chuvaFutura24h)} mm`,
                          color: "#0891b2",
                          sub: alert.intensidadePrevisao || null,
                        },
                      ].map(({ label, value, color, sub }) => (
                        <div key={label} style={{
                          padding: "0.625rem 0.75rem", backgroundColor: "white",
                          borderRadius: "0.375rem", border: "1px solid #f3f4f6",
                        }}>
                          <div style={{
                            fontSize: "0.68rem", color: "#6b7280", textTransform: "uppercase",
                            fontWeight: "600", marginBottom: "0.25rem", letterSpacing: "0.03em",
                          }}>
                            {label}
                          </div>
                          <div style={{ fontSize: "1rem", fontWeight: "700", color }}>{value}</div>
                          {sub && (
                            <div style={{ fontSize: "0.65rem", color: "#9ca3af", marginTop: "0.1rem" }}>
                              {sub}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Recomendação */}
                    {alert.recomendacao && (
                      <div style={{
                        padding: "0.5rem 0.75rem",
                        backgroundColor: isRuptura ? "#fef2f2" : "#f8fafc",
                        borderRadius: "0.375rem",
                        border: `1px solid ${isRuptura ? "#fca5a5" : "#e2e8f0"}`,
                        fontSize: "0.825rem",
                        color: isRuptura ? "#991b1b" : "#374151",
                        lineHeight: 1.5,
                      }}>
                        💡 <strong>Recomendação:</strong> {alert.recomendacao}
                      </div>
                    )}

                    {/* ── Zona 3: Detalhes expandíveis ────────────────── */}
                    {isExpanded && (
                      <div style={{
                        marginTop: "1rem", paddingTop: "1rem",
                        borderTop: "1px solid #e5e7eb",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "1rem",
                      }}>

                        {/* Componentes V_x */}
                        <div>
                          <p style={{
                            fontSize: "0.75rem", fontWeight: "700", color: "#1d4ed8",
                            margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.375rem",
                          }}>
                            ⚙️ Componentes da Equação 5
                            {isRuptura && (
                              <span style={{
                                fontSize: "0.65rem", padding: "0.1rem 0.375rem",
                                backgroundColor: "#fee2e2", color: "#991b1b",
                                borderRadius: "0.25rem", fontWeight: "600",
                              }}>
                                calculados mas descartados
                              </span>
                            )}
                          </p>
                          <div style={{ fontSize: "0.775rem" }}>
                            {vx.map(({ label, value }) => (
                              <div key={label} style={{
                                display: "flex", justifyContent: "space-between",
                                padding: "0.25rem 0", borderBottom: "1px solid #eff6ff",
                              }}>
                                <span style={{ color: "#6b7280" }}>{label}</span>
                                <span style={{ fontWeight: "700", color: "#1d4ed8", fontFamily: "monospace" }}>
                                  {value != null
                                    ? parseFloat(value).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                                    : "—"}
                                </span>
                              </div>
                            ))}
                            <div style={{
                              display: "flex", justifyContent: "space-between",
                              padding: "0.3rem 0", marginTop: "0.25rem",
                              borderTop: "2px solid #bfdbfe",
                            }}>
                              <span style={{ fontWeight: "700", color: "#374151" }}>
                                Σ FR {isRuptura ? "(sem override)" : ""}
                              </span>
                              <span style={{
                                fontWeight: "700", fontFamily: "monospace",
                                color: isRuptura ? "#d97706" : alertLevel.color,
                              }}>
                                {(frSoma * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                                {isRuptura && " ⚠️"}
                              </span>
                            </div>
                            {isRuptura && (
                              <div style={{
                                marginTop: "0.375rem", padding: "0.375rem 0.5rem",
                                backgroundColor: "#fef2f2", borderRadius: "0.25rem",
                                fontSize: "0.7rem", color: "#991b1b", lineHeight: 1.4,
                              }}>
                                Umidade {alert.umidadeSolo}% ≥ 30% → firmware forçou FR = 100% via <code>acionarRuptura()</code>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contexto meteorológico */}
                        <div>
                          <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "#1d4ed8", margin: "0 0 0.5rem 0" }}>
                            🌧 Contexto Meteorológico
                          </p>
                          <div style={{ fontSize: "0.775rem" }}>
                            {[
                              ["Temperatura", `${fmt(alert.temperatura)} °C`],
                              ["Umidade externa", `${fmt(alert.umidadeExterna)}%`],
                              ["Pressão atm.", `${fmt(alert.pressaoAtmosferica)} hPa`],
                              ["Vento", `${fmt(alert.velocidadeVento)} m/s`],
                              ["Descrição tempo", alert.descricaoTempo || "—"],
                              ["Chuva atual (OWM)", `${fmt(alert.chuvaAtualOwm)} mm/h`],
                              ["Taxa var. umidade", fmt(alert.taxaVariacaoUmidade, 3)],
                            ].map(([k, v]) => (
                              <div key={k} style={{
                                display: "flex", justifyContent: "space-between",
                                padding: "0.25rem 0", borderBottom: "1px solid #eff6ff",
                              }}>
                                <span style={{ color: "#6b7280" }}>{k}</span>
                                <span style={{ fontWeight: "500" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Hardware */}
                        <div>
                          <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "#1d4ed8", margin: "0 0 0.5rem 0" }}>
                            🔧 Hardware e Diagnóstico
                          </p>
                          <div style={{ fontSize: "0.775rem" }}>
                            {[
                              ["freeHeap", `${(alert.dadosBrutos?.freeHeap || 0).toLocaleString("pt-BR")} bytes`],
                              ["RSSI", `${alert.dadosBrutos?.rssi || "—"} dBm`],
                              ["Uptime", `${Math.round((alert.dadosBrutos?.uptime || 0) / 1000)}s`],
                              ["Tent. envio", String(alert.dadosBrutos?.tentativasEnvio || 0)],
                              ["Sensor OK", alert.sensorOk ? "✅ Sim" : "❌ Não"],
                              ["Modo", alert.modoManual ? "⚠️ Manual" : "🤖 Automático"],
                              ["Buzzer", alert.buzzerAtivo ? "🔊 Ativo" : "Inativo"],
                            ].map(([k, v]) => (
                              <div key={k} style={{
                                display: "flex", justifyContent: "space-between",
                                padding: "0.25rem 0", borderBottom: "1px solid #eff6ff",
                              }}>
                                <span style={{ color: "#6b7280" }}>{k}</span>
                                <span style={{ fontWeight: "500" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cálculo de Confiabilidade */}
                        {det && (
                          <div>
                            <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "#1d4ed8", margin: "0 0 0.5rem 0" }}>
                              📊 Cálculo de Confiabilidade
                            </p>
                            {det.estado_especial === "RUPTURA" ? (
                              <div style={{
                                padding: "0.5rem", backgroundColor: "#f0fdf4",
                                borderRadius: "0.375rem", border: "1px solid #bbf7d0",
                                fontSize: "0.75rem", color: "#166534",
                              }}>
                                <strong>100% — Estado especial: RUPTURA</strong><br />
                                <span style={{ color: "#4b5563" }}>
                                  Sensor confirmou estado por hardware. Descontos ignorados.
                                </span>
                              </div>
                            ) : (
                              <div style={{ fontSize: "0.775rem" }}>
                                {Object.entries(det.descontos || {}).map(([chave, valor]) => (
                                  <div key={chave} style={{
                                    display: "flex", justifyContent: "space-between",
                                    padding: "0.25rem 0", borderBottom: "1px solid #eff6ff",
                                    backgroundColor: valor > 0 ? "#fefce8" : "transparent",
                                    paddingLeft: valor > 0 ? "0.25rem" : 0,
                                  }}>
                                    <span style={{ color: valor > 0 ? "#92400e" : "#6b7280" }}>
                                      {descontoInfo[chave] || chave}
                                    </span>
                                    <span style={{ fontWeight: "700", color: valor > 0 ? "#dc2626" : "#16a34a" }}>
                                      {valor > 0 ? `−${valor}%` : "0%"}
                                    </span>
                                  </div>
                                ))}
                                <div style={{
                                  display: "flex", justifyContent: "space-between",
                                  padding: "0.3rem 0", marginTop: "0.25rem",
                                  borderTop: "2px solid #bfdbfe",
                                }}>
                                  <span style={{ fontWeight: "700" }}>
                                    100% − {det.total_desconto || 0}% =
                                  </span>
                                  <span style={{
                                    fontWeight: "700",
                                    color: det.resultado >= 90 ? "#16a34a"
                                      : det.resultado >= 70 ? "#d97706" : "#dc2626",
                                  }}>
                                    {det.resultado}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {filteredAlerts.length > pagination.limit && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb",
            flexWrap: "wrap", gap: "0.5rem",
          }}>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              Mostrando {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, filteredAlerts.length)} de {filteredAlerts.length} alertas
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Button variant="outline" size="small"
                onClick={() => pagination.goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}>
                <ChevronLeft size={16} /> Anterior
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = pagination.page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => pagination.goToPage(p)} style={{
                    width: "2rem", height: "2rem", border: "none", borderRadius: "0.25rem",
                    backgroundColor: p === pagination.page ? "#2563eb" : "transparent",
                    color: p === pagination.page ? "white" : "#374151",
                    cursor: "pointer", fontSize: "0.875rem", fontWeight: "500",
                  }}>
                    {p}
                  </button>
                );
              })}
              <Button variant="outline" size="small"
                onClick={() => pagination.goToPage(pagination.page + 1)}
                disabled={pagination.page >= totalPages}>
                Próxima <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Modal: Log de Alertas Enviados ─────────────────────────────── */}
      <Modal
        isOpen={showLogModal}
        onClose={() => { setShowLogModal(false); setExpandedLog(null); }}
        title="📋 Log de Alertas Enviados"
        size="xl"
      >
        {/* Cabeçalho do modal */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem",
        }}>
          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {logsLoading ? "Carregando..." : `${logsTotal} ${logsTotal === 1 ? "registro" : "registros"} no histórico`}
          </span>
          <Button variant="outline" size="small" onClick={() => loadLogsEnvios(logsPagina)} loading={logsLoading}>
            <RefreshCw size={14} /> Atualizar
          </Button>
        </div>

        {/* Conteúdo */}
        {logsLoading && logsEnvios.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <LoadingSpinner size="large" />
          </div>
        ) : logsEnvios.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            <Mail size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p style={{ fontSize: "1rem", color: "#6b7280", marginBottom: "0.5rem" }}>
              Nenhum alerta foi enviado ainda.
            </p>
            <p style={{ fontSize: "0.875rem" }}>
              Use o botão "Enviar Alerta" para notificar os usuários cadastrados.
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    {[
                      ["Data / Hora", "left"], ["Título", "left"], ["Nível", "center"],
                      ["Destinatários", "center"], ["Canal", "center"],
                      ["Resultado", "center"], ["", "center"],
                    ].map(([h, align]) => (
                      <th key={h} style={{
                        padding: "0.625rem 0.75rem", textAlign: align,
                        fontWeight: "600", color: "#6b7280", fontSize: "0.7rem",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logsEnvios.map((log, i) => {
                    const isExp   = expandedLog === i;
                    const sucPct  = log.totalEnviados > 0 ? Math.round((log.totalSucesso / log.totalEnviados) * 100) : 0;
                    const resultColor = sucPct === 100 ? "#16a34a" : sucPct > 0 ? "#d97706" : "#dc2626";
                    const ResultIcon  = sucPct === 100 ? CheckCircle : sucPct > 0 ? AlertCircle : XCircle;
                    const nivelMap  = {
                      baixo:   { label: "Informativo", bg: "#dcfce7", color: "#166534" },
                      medio:   { label: "Atenção",     bg: "#fef9c3", color: "#854d0e" },
                      critico: { label: "Crítico",     bg: "#fee2e2", color: "#991b1b" },
                    };
                    const destMap   = { basico: "Usuários Básicos", admin: "Administradores", todos: "Todos" };
                    const nivel     = nivelMap[log.nivelCriticidade] || { label: log.nivelCriticidade, bg: "#f3f4f6", color: "#374151" };
                    const detalhes  = Array.isArray(log.detalhesEnvio) ? log.detalhesEnvio : [];

                    return (
                      <>
                        <tr key={log.id || i} style={{
                          borderBottom: isExp ? "none" : "1px solid #f3f4f6",
                          backgroundColor: isExp ? "#eff6ff" : "transparent",
                          transition: "background 0.12s",
                        }}>
                          <td style={{ padding: "0.625rem 0.75rem", whiteSpace: "nowrap", color: "#4b5563", fontSize: "0.78rem" }}>
                            {formatDateBR(log.createdAt)}
                          </td>
                          <td style={{ padding: "0.625rem 0.75rem", maxWidth: "200px" }}>
                            <span title={log.titulo} style={{
                              display: "block", overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap",
                              fontWeight: "500", color: "#111827",
                            }}>
                              {log.titulo}
                            </span>
                          </td>
                          <td style={{ padding: "0.625rem 0.75rem", textAlign: "center" }}>
                            <span style={{
                              padding: "0.2rem 0.5rem", borderRadius: "9999px",
                              fontSize: "0.7rem", fontWeight: "700",
                              backgroundColor: nivel.bg, color: nivel.color,
                            }}>
                              {nivel.label}
                            </span>
                          </td>
                          <td style={{ padding: "0.625rem 0.75rem", textAlign: "center", color: "#374151", fontSize: "0.78rem" }}>
                            {destMap[log.tipoDestinatario] || log.tipoDestinatario || "—"}
                          </td>
                          <td style={{ padding: "0.625rem 0.75rem", textAlign: "center" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#0891b2" }}>
                              <Mail size={13} /> {log.canaisEnvio || "email"}
                            </span>
                          </td>
                          <td style={{ padding: "0.625rem 0.75rem", textAlign: "center" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: "700", color: resultColor, fontSize: "0.8rem" }}>
                              <ResultIcon size={14} /> {log.totalSucesso}/{log.totalEnviados}
                            </span>
                            {log.totalFalhas > 0 && (
                              <div style={{ fontSize: "0.65rem", color: "#dc2626", marginTop: "0.1rem" }}>
                                {log.totalFalhas} falha{log.totalFalhas > 1 ? "s" : ""}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "0.625rem 0.75rem", textAlign: "center" }}>
                            {detalhes.length > 0 && (
                              <button
                                onClick={() => setExpandedLog(isExp ? null : i)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.2rem",
                                  padding: "0.2rem 0.5rem", borderRadius: "0.25rem",
                                  border: "1px solid #e5e7eb", backgroundColor: "white",
                                  color: "#6b7280", fontSize: "0.72rem", cursor: "pointer",
                                }}
                              >
                                {isExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {isExp ? "Fechar" : "Detalhes"}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Linha expandida — detalhes por destinatário */}
                        {isExp && detalhes.length > 0 && (
                          <tr key={`log-exp-${i}`}>
                            <td colSpan={7} style={{
                              padding: "0 0.75rem 0.875rem 0.75rem",
                              backgroundColor: "#eff6ff",
                              borderBottom: "2px solid #bfdbfe",
                            }}>
                              <div style={{ padding: "0.75rem", backgroundColor: "white", borderRadius: "0.375rem", border: "1px solid #dbeafe" }}>
                                <p style={{ fontSize: "0.72rem", fontWeight: "700", color: "#1d4ed8", margin: "0 0 0.5rem 0" }}>
                                  📧 Detalhes de entrega — {log.totalSucesso} de {log.totalEnviados} enviados com sucesso
                                </p>
                                {log.mensagem && (
                                  <div style={{ padding: "0.5rem 0.75rem", marginBottom: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "0.25rem", border: "1px solid #e2e8f0", fontSize: "0.75rem", color: "#4b5563" }}>
                                    <span style={{ fontWeight: "600", color: "#374151" }}>Mensagem: </span>{log.mensagem}
                                  </div>
                                )}
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                                  <thead>
                                    <tr style={{ backgroundColor: "#f1f5f9" }}>
                                      {["Nome", "E-mail", "Status", "Detalhe"].map(h => (
                                        <th key={h} style={{ padding: "0.375rem 0.5rem", textAlign: "left", fontWeight: "600", color: "#6b7280", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detalhes.map((d, di) => {
                                      const ok = d.status === "enviado" || d.status === "success";
                                      return (
                                        <tr key={di} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                          <td style={{ padding: "0.375rem 0.5rem", color: "#111827", fontWeight: "500" }}>{d.nome || "—"}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", color: "#6b7280", fontFamily: "monospace" }}>{d.email || d.destinatarioId || "—"}</td>
                                          <td style={{ padding: "0.375rem 0.5rem" }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", fontWeight: "600", color: ok ? "#166534" : "#991b1b" }}>
                                              {ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                              {ok ? "Enviado" : "Falha"}
                                            </span>
                                          </td>
                                          <td style={{ padding: "0.375rem 0.5rem", color: ok ? "#6b7280" : "#dc2626", fontSize: "0.7rem" }}>
                                            {!ok && d.erro ? d.erro : ok ? "—" : "Erro desconhecido"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação do modal */}
            {logsTotal > LOGS_POR_PAGINA && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: "1rem", paddingTop: "0.875rem", borderTop: "1px solid #e5e7eb",
                flexWrap: "wrap", gap: "0.5rem",
              }}>
                <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  Página {logsPagina} de {Math.ceil(logsTotal / LOGS_POR_PAGINA)} · {logsTotal} registros
                </span>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <Button variant="outline" size="small"
                    onClick={() => loadLogsEnvios(logsPagina - 1)}
                    disabled={logsPagina <= 1 || logsLoading}>
                    <ChevronLeft size={14} /> Anterior
                  </Button>
                  <Button variant="outline" size="small"
                    onClick={() => loadLogsEnvios(logsPagina + 1)}
                    disabled={logsPagina >= Math.ceil(logsTotal / LOGS_POR_PAGINA) || logsLoading}>
                    Próxima <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Modal */}
      <Modal
        isOpen={showAlertModal}
        onClose={handleCloseModal}
        title={alertaOrigem ? "Enviar Alerta em Massa" : "Criar Novo Alerta"}
        size="md"
      >
        <AlertForm
          alertaOrigem={alertaOrigem}
          onSend={sendMassAlert}
          onCancel={handleCloseModal}
          loading={sendingAlert}
        />
      </Modal>
    </div>
  );
}