// ============= src/components/alerts/AlertForm.js =============
// Ajuste #22: precipitacaoPrevisao24h → chuvaFutura24h (campo correto do banco)
// Ajuste #23: riscoIntegrado exibido como % na mensagem (× 100 ou usar indiceRisco)
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Users,
  Mail,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckSquare,
} from "lucide-react";

export default function AlertForm({
  onSend,
  onCancel,
  loading = false,
  alertaOrigem = null,
}) {
  const [selectedChannels, setSelectedChannels] = useState(["email"]);
  const [mensagemSelecionada, setMensagemSelecionada] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      titulo: "",
      mensagem: "",
      nivelCriticidade: "medio",
      tipoDestinatario: "todos",
      canaisEnvio: ["email"],
      destinatariosIds: [],
    },
  });

  const tipoDestinatario = watch("tipoDestinatario");
  const nivelCriticidade = watch("nivelCriticidade");

  // Ajuste #23: usar indiceRisco (0-100 inteiro) ou multiplicar riscoIntegrado por 100
  const formatarRiscoParaMensagem = (alerta) => {
    if (!alerta) return 'N/A';
    // indiceRisco já é inteiro 0-100 — usar diretamente se disponível
    if (alerta.indiceRisco != null) return `${alerta.indiceRisco}%`;
    // fallback: riscoIntegrado (0-1) × 100
    if (alerta.riscoIntegrado != null) return `${(parseFloat(alerta.riscoIntegrado) * 100).toFixed(0)}%`;
    return 'N/A';
  };

  // Ajuste #22: campo correto é chuvaFutura24h, não precipitacaoPrevisao24h
  const gerarMensagemComDadosSensor = (alerta) => {
    if (!alerta) return "";

    const timestamp = new Date(alerta.timestamp).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `🚨 DADOS DO MONITORAMENTO DO SENSOR DETECTADOS 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Data/Hora: ${timestamp}
🌡️ Umidade do Solo: ${alerta.umidadeSolo || 'N/A'}%
⚠️ Risco Integrado: ${formatarRiscoParaMensagem(alerta)}
📊 Nível de Alerta: ${alerta.nivelAlerta || 'N/A'}

💧 PRECIPITAÇÃO:
• Próximas 24h: ${alerta.chuvaFutura24h != null ? `${parseFloat(alerta.chuvaFutura24h).toFixed(1)}mm` : 'N/A'}${alerta.intensidadePrevisao ? ` (${alerta.intensidadePrevisao})` : ''}
• Últimas 24h: ${alerta.precipitacao24h != null ? `${parseFloat(alerta.precipitacao24h).toFixed(1)}mm` : 'N/A'}

📊 QUALIDADE:
• Confiabilidade: ${alerta.confiabilidade != null ? `${alerta.confiabilidade}%` : 'N/A'}
• BNDMET: ${alerta.statusApiBndmet || 'N/A'} | OWM: ${alerta.statusApiOwm || 'N/A'}

💡 RECOMENDAÇÃO:
${alerta.recomendacao || 'Nenhuma recomendação específica disponível.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ATENÇÃO: Esta é uma notificação automática baseada nos dados coletados pelo sistema de monitoramento. Verifique o painel de controle para mais detalhes.

Sistema TCC IPRJ - Monitoramento de Barragens`;
  };

  // Templates de mensagens padrão
  const templatesMensagem = {
    informativo: {
      titulo: "Informação do Sistema de Monitoramento",
      mensagem: `Informamos que o sistema de monitoramento da barragem registrou dados dentro dos parâmetros normais de segurança.

📊 Status: Operação normal
🔍 Monitoramento: Ativo e funcionando
✅ Recomendação: Manter acompanhamento de rotina

Esta é uma comunicação informativa do sistema BNDMET.`,
    },
    atencao: {
      titulo: "Alerta de Atenção - Monitoramento da Barragem Alpha",
      mensagem: `O sistema de monitoramento detectou condições que requerem atenção especial na barragem.

⚠️ Nível: Atenção
📈 Situação: Parâmetros em elevação
🔍 Ação necessária: Acompanhamento mais frequente
⏰ Prazo: Monitorar nas próximas 24 horas

Mantenha-se atento aos próximos boletins do sistema.`,
    },
    critico: {
      titulo: "Alerta Crítico - Monitoramento da Barragem Alpha",
      mensagem: `O sistema de monitoramento detectou condições CRÍTICAS na barragem.

❗ Nível: Crítico
📈 Situação: Parâmetros em níveis perigosos
🔍 Ação: IMEDIATA
🚨 Recomendação: Ativar protocolo de emergência

ATENÇÃO: Esta situação requer resposta imediata das equipes responsáveis. Entre em contato com a coordenação técnica URGENTEMENTE.`,
    },
  };

  // Atualizar formulário quando alertaOrigem mudar
  useEffect(() => {
    if (alertaOrigem) {
      // MODIFICADO: Usar dados completos do sensor
      const tituloGerado = `Alerta do Sistema de Monitoramento da Barragem Alpha - ${alertaOrigem.nivelAlerta || 'ATENÇÃO'}`;
      const mensagemGerada = gerarMensagemComDadosSensor(alertaOrigem);

      setValue("titulo", tituloGerado);
      setValue("mensagem", mensagemGerada);

      const nivelAlerta = alertaOrigem.nivelAlerta?.toUpperCase();
      let criticidade = "medio";
      if (nivelAlerta === "VERMELHO" || nivelAlerta === "CRITICO") {
        criticidade = "critico";
      } else if (nivelAlerta === "AMARELO") {
        criticidade = "medio";
      } else {
        criticidade = "baixo";
      }

      setValue("nivelCriticidade", criticidade);
      setMensagemSelecionada("sensor_data");
    } else {
      // Modal de "Enviar Alerta" - valores padrão
      setValue("titulo", "");
      setValue("mensagem", "");
      setValue("nivelCriticidade", "medio");
      setMensagemSelecionada("");
    }
  }, [alertaOrigem, setValue]);

  const handleChannelChange = (channel, isChecked) => {
    let newChannels;
    if (isChecked) {
      newChannels = [...selectedChannels, channel];
    } else {
      newChannels = selectedChannels.filter((c) => c !== channel);
    }
    setSelectedChannels(newChannels);
    setValue("canaisEnvio", newChannels);
  };

  const handleTemplateSelect = (tipo) => {
    const template = templatesMensagem[tipo];
    if (template) {
      setValue("titulo", template.titulo);
      setValue("mensagem", template.mensagem);
      if (tipo === "informativo") setValue("nivelCriticidade", "baixo");
      else if (tipo === "atencao") setValue("nivelCriticidade", "medio");
      else if (tipo === "critico") setValue("nivelCriticidade", "critico");
      setMensagemSelecionada(tipo);
    }
  };

  const onSubmit = async (data) => {
    const alertData = {
      ...data,
      canaisEnvio: selectedChannels,
      // Ajuste #22: usar chuvaFutura24h no objeto de dados do sensor
      dadosSensor: alertaOrigem ? {
        timestamp: alertaOrigem.timestamp,
        umidadeSolo: alertaOrigem.umidadeSolo,
        riscoIntegrado: alertaOrigem.riscoIntegrado,
        indiceRisco: alertaOrigem.indiceRisco,
        nivelAlerta: alertaOrigem.nivelAlerta,
        precipitacao24h: alertaOrigem.precipitacao24h,
        chuvaFutura24h: alertaOrigem.chuvaFutura24h,       // Ajuste #22: campo correto
        intensidadePrevisao: alertaOrigem.intensidadePrevisao,
        confiabilidade: alertaOrigem.confiabilidade,
        statusApiBndmet: alertaOrigem.statusApiBndmet,
        statusApiOwm: alertaOrigem.statusApiOwm,
        recomendacao: alertaOrigem.recomendacao
      } : null
    };
    await onSend(alertData);
  };

  const getCriticalityColor = (level) => {
    const colors = { baixo: "var(--green-500)", medio: "var(--yellow-500)", critico: "var(--red-500)" };
    return colors[level] || "var(--gray-500)";
  };

  const getCriticalityLabel = (level) => {
    const labels = { baixo: "Informativo", medio: "Atenção", critico: "Crítico" };
    return labels[level] || "Médio";
  };

  const getRecipientCount = (tipo) => {
    const counts = { todos: "Todos os usuários ativos", admin: "Apenas administradores", basico: "Apenas usuários básicos" };
    return counts[tipo] || "";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 0 }}>
      {/* Preview do Alerta */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: alertaOrigem ? "#fff3cd" : "#e8f4fd",
        border: `1px solid ${alertaOrigem ? "#ffeaa7" : "#b3d9ff"}`,
        borderRadius: "6px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <AlertTriangle size={18} color={alertaOrigem ? "#d4ac0d" : "#0369a1"} />
        <div>
          <div style={{ fontWeight: "600", fontSize: "14px", color: alertaOrigem ? "#8b6e00" : "#0369a1" }}>
            {alertaOrigem ? "DADOS DO SENSOR DETECTADOS" : "CRIAR NOVO ALERTA"}
          </div>
          <div style={{ fontSize: "12px", color: alertaOrigem ? "#a67c00" : "#0284c7", marginTop: "2px" }}>
            {alertaOrigem
              ? "Os dados do sensor serão incluídos automaticamente no email"
              : "Preencha os campos para criar um novo alerta personalizado"}
          </div>
        </div>
      </div>

      {/* Título */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "var(--gray-700)", fontSize: "14px" }}>
          Título do Alerta *
        </label>
        <Input
          {...register("titulo", { required: "Título é obrigatório" })}
          placeholder="Ex: Alerta de monitoramento da barragem"
          style={{ fontSize: "14px", padding: "10px 12px" }}
        />
        {errors.titulo && (
          <span style={{ color: "var(--red-500)", fontSize: "12px", marginTop: "4px", display: "block" }}>
            {errors.titulo.message}
          </span>
        )}
      </div>

      {/* Templates rápidos — apenas se não houver alerta de origem */}
      {!alertaOrigem && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", color: "var(--gray-700)", fontSize: "14px" }}>
            Templates Rápidos
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Object.entries(templatesMensagem).map(([key]) => (
              <Button
                key={key}
                type="button"
                variant={mensagemSelecionada === key ? "primary" : "outline"}
                size="small"
                onClick={() => handleTemplateSelect(key)}
                style={{ fontSize: "12px", padding: "6px 12px", textTransform: "capitalize" }}
              >
                {key}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "var(--gray-700)", fontSize: "14px" }}>
          Mensagem do Alerta *
        </label>
        <textarea
          {...register("mensagem", { required: "Mensagem é obrigatória" })}
          placeholder="Digite a mensagem que será enviada aos usuários..."
          rows={alertaOrigem ? 14 : 8}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid var(--gray-300)",
            borderRadius: "6px",
            fontSize: "13px",
            fontFamily: "monospace",
            lineHeight: "1.4",
            resize: "vertical",
            minHeight: alertaOrigem ? "320px" : "120px",
          }}
        />
        {errors.mensagem && (
          <span style={{ color: "var(--red-500)", fontSize: "12px", marginTop: "4px", display: "block" }}>
            {errors.mensagem.message}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {/* Nível de Criticidade */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", color: "var(--gray-700)", fontSize: "14px" }}>
            Nível de Criticidade
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {["baixo", "medio", "critico"].map((level) => (
              <label key={level} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 8px",
                border: `2px solid ${nivelCriticidade === level ? getCriticalityColor(level) : "var(--gray-300)"}`,
                borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "500",
                backgroundColor: nivelCriticidade === level ? getCriticalityColor(level) + "15" : "transparent",
                color: nivelCriticidade === level ? getCriticalityColor(level) : "var(--gray-600)",
              }}>
                <input type="radio" value={level} {...register("nivelCriticidade")} style={{ display: "none" }} />
                <CheckSquare size={12} style={{ color: nivelCriticidade === level ? getCriticalityColor(level) : "var(--gray-400)" }} />
                {getCriticalityLabel(level)}
              </label>
            ))}
          </div>
        </div>

        {/* Tipo de Destinatário */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", color: "var(--gray-700)", fontSize: "14px" }}>
            Destinatários
          </label>
          <select {...register("tipoDestinatario")} style={{
            width: "100%", padding: "8px 12px", border: "1px solid var(--gray-300)",
            borderRadius: "6px", fontSize: "14px", backgroundColor: "white",
          }}>
            <option value="todos">Todos os usuários ativos</option>
            <option value="admin">Apenas administradores</option>
            <option value="basico">Apenas usuários básicos</option>
          </select>
          <div style={{ fontSize: "12px", color: "var(--gray-500)", marginTop: "4px" }}>
            {getRecipientCount(tipoDestinatario)}
          </div>
        </div>

        {/* Canais de Envio */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", color: "var(--gray-700)", fontSize: "14px" }}>
            Canais de Envio
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px",
              border: `2px solid ${selectedChannels.includes("email") ? "var(--blue-500)" : "var(--gray-300)"}`,
              borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500",
              backgroundColor: selectedChannels.includes("email") ? "var(--blue-50)" : "transparent",
              color: selectedChannels.includes("email") ? "var(--blue-700)" : "var(--gray-600)",
            }}>
              <input type="checkbox" checked={selectedChannels.includes("email")}
                onChange={(e) => handleChannelChange("email", e.target.checked)} style={{ display: "none" }} />
              <Mail size={14} /> Email
            </label>

            <label style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px",
              border: "2px solid var(--gray-300)", borderRadius: "6px",
              fontSize: "13px", fontWeight: "500", opacity: 0.6, cursor: "not-allowed",
              color: "var(--gray-600)",
            }}>
              <input type="checkbox" checked={selectedChannels.includes("sms")}
                onChange={(e) => handleChannelChange("sms", e.target.checked)} disabled style={{ display: "none" }} />
              <MessageSquare size={14} /> SMS (Em breve)
            </label>
          </div>
        </div>
      </div>

      {/* Informações importantes */}
      <div style={{
        padding: "12px", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd",
        borderRadius: "6px", marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "#1d4ed8", fontWeight: "600", fontSize: "14px" }}>
          <Info size={16} /> Informações Importantes
        </div>
        <ul style={{ fontSize: "12px", color: "#1e40af", margin: 0, paddingLeft: "16px", lineHeight: "1.4" }}>
          <li>Alertas críticos são enviados imediatamente</li>
          <li>Usuários inativos não receberão notificações</li>
          <li>O sistema registra todas as tentativas de envio</li>
          {alertaOrigem && <li><strong>Os dados do sensor serão incluídos automaticamente no email</strong></li>}
          <li>Verifique sempre os dados antes de enviar</li>
        </ul>
      </div>

      {/* Botões de ação */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}
          style={{ padding: "8px 16px", fontSize: "14px", fontWeight: "500" }}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={loading}
          disabled={loading || selectedChannels.length === 0}
          style={{ padding: "8px 20px", fontSize: "14px", fontWeight: "500", backgroundColor: getCriticalityColor(nivelCriticidade), borderColor: getCriticalityColor(nivelCriticidade) }}>
          {loading ? "Enviando..." : "📤 Enviar Alerta"}
        </Button>
      </div>
    </form>
  );
}