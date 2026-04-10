// Página de redefinição de senha — UC12 + UC13
// ============= src/app/reset-senha/page.js =============
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import {
  Shield, KeyRound, Eye, EyeOff, CheckCircle2,
  ArrowLeft, ClipboardPaste, AlertTriangle, Lock,
} from "lucide-react";

// ── Componente de passo ────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const passos = ["Validar Token", "Nova Senha", "Concluído"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "2rem" }}>
      {passos.map((label, idx) => {
        const num    = idx + 1;
        const ativo  = step === num;
        const feito  = step > num;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
              <div style={{
                width: "2rem", height: "2rem", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8125rem", fontWeight: "700",
                background: feito ? "#16a34a" : ativo ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#e5e7eb",
                color: feito || ativo ? "white" : "#9ca3af",
                boxShadow: ativo ? "0 4px 12px rgba(37,99,235,0.4)" : "none",
                transition: "all 0.3s",
              }}>
                {feito ? <CheckCircle2 size={14} /> : num}
              </div>
              <span style={{ fontSize: "0.6875rem", fontWeight: ativo ? "600" : "400", color: ativo ? "#2563eb" : feito ? "#16a34a" : "#9ca3af", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {idx < passos.length - 1 && (
              <div style={{ width: "3rem", height: "2px", backgroundColor: step > num ? "#16a34a" : "#e5e7eb", margin: "0 0.25rem 1.25rem", transition: "background-color 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ResetSenhaPage() {
  const router = useRouter();

  // Estados de passo
  const [step, setStep]             = useState(1); // 1=validar, 2=nova senha, 3=concluído

  // Passo 1
  const [token, setToken]           = useState("");
  const [tokenError, setTokenError] = useState("");
  const [loadingVal, setLoadingVal] = useState(false);

  // Passo 2
  const [novaSenha, setNovaSenha]       = useState("");
  const [confirmar, setConfirmar]       = useState("");
  const [senhaError, setSenhaError]     = useState("");
  const [showNova, setShowNova]         = useState(false);
  const [showConf, setShowConf]         = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleColarToken = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text.trim());
      setTokenError("");
    } catch {
      setTokenError("Não foi possível acessar a área de transferência. Cole manualmente.");
    }
  };

  const handleValidarToken = async (e) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) { setTokenError("Cole o token recebido por e-mail"); return; }
    if (t.length !== 64) { setTokenError("O token deve ter 64 caracteres. Verifique se foi copiado corretamente."); return; }
    setTokenError("");
    setLoadingVal(true);
    try {
      const res = await authService.validarTokenReset(t);
      if (res.success && res.data?.valido) {
        setStep(2);
      } else {
        setTokenError("Token inválido ou expirado. Solicite um novo reset.");
      }
    } catch {
      setTokenError("Token inválido ou expirado. Solicite um novo reset.");
    } finally {
      setLoadingVal(false);
    }
  };

  const handleRedefinir = async (e) => {
    e.preventDefault();
    // Validações
    if (novaSenha.length < 8) { setSenhaError("A senha deve ter no mínimo 8 caracteres"); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(novaSenha)) { setSenhaError("A senha deve conter ao menos uma letra maiúscula, uma minúscula e um número"); return; }
    if (novaSenha !== confirmar) { setSenhaError("As senhas não coincidem"); return; }
    setSenhaError("");
    setLoadingReset(true);
    try {
      const res = await authService.resetarSenha(token.trim(), novaSenha);
      if (res.success) {
        setStep(3);
      } else {
        setSenhaError(res.message || "Erro ao redefinir senha. Tente novamente.");
      }
    } catch (err) {
      setSenhaError(err.response?.data?.message || "Erro ao redefinir senha. O token pode ter expirado.");
    } finally {
      setLoadingReset(false);
    }
  };

  // ── Força da senha ────────────────────────────────────────────────────────
  const forcaSenha = (s) => {
    if (!s) return { nivel: 0, label: "", cor: "#e5e7eb" };
    let pts = 0;
    if (s.length >= 8)  pts++;
    if (s.length >= 12) pts++;
    if (/[A-Z]/.test(s)) pts++;
    if (/[a-z]/.test(s)) pts++;
    if (/\d/.test(s))    pts++;
    if (/[^A-Za-z0-9]/.test(s)) pts++;
    if (pts <= 2) return { nivel: pts, label: "Fraca",  cor: "#ef4444" };
    if (pts <= 4) return { nivel: pts, label: "Média",  cor: "#f59e0b" };
    return             { nivel: pts, label: "Forte",  cor: "#16a34a" };
  };
  const forca = forcaSenha(novaSenha);

  // ── Estilos compartilhados ────────────────────────────────────────────────
  const inputStyle = (hasErr) => ({
    width: "100%", padding: "0.875rem 0.875rem 0.875rem 2.5rem",
    border: `2px solid ${hasErr ? "#ef4444" : "#e5e7eb"}`,
    borderRadius: "0.5rem", fontSize: "0.875rem", backgroundColor: "white",
    color: "#1f2937", outline: "none", transition: "all 0.2s", boxSizing: "border-box",
  });

  const btnPrimary = (loading) => ({
    width: "100%", padding: "0.875rem",
    background: loading ? "#9ca3af" : "linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)",
    border: "none", borderRadius: "0.5rem", color: "white",
    fontSize: "0.9375rem", fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: loading ? "none" : "0 8px 20px rgba(37,99,235,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
    transition: "all 0.2s",
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', padding: "1rem", position: "relative" }}>

      {/* Background */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 80%,rgba(37,99,235,0.3) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(255,255,255,0.1) 0%,transparent 50%)", pointerEvents: "none" }} />

      {/* Botão Voltar */}
      <button
        onClick={() => router.push("/login")}
        style={{ position: "fixed", top: "1rem", left: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "0.75rem", color: "white", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500", zIndex: 10 }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; }}
      >
        <ArrowLeft size={16} /> Voltar ao Login
      </button>

      {/* Card */}
      <div style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", padding: "2.5rem", borderRadius: "1.5rem", boxShadow: "0 25px 50px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.3)", width: "100%", maxWidth: "480px", position: "relative", zIndex: 5 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ width: "4rem", height: "4rem", background: "linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "0 10px 25px rgba(37,99,235,0.4)" }}>
            <KeyRound size={24} color="white" />
          </div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: "800", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 0.375rem" }}>
            Redefinir Senha
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
            Sistema TCC IPRJ — Monitoramento de Barragens
          </p>
        </div>

        {/* Indicador de passos */}
        <StepIndicator step={step} />

        {/* ── PASSO 1: Validar Token ────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleValidarToken}>
            <div style={{ background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.8125rem", color: "#1e40af", lineHeight: 1.6 }}>
              <strong>📧 Como obter o token:</strong>
              <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                <li>Acesse o login e clique em <strong>"Esqueci minha senha"</strong></li>
                <li>Informe seu e-mail de administrador</li>
                <li>Verifique sua caixa de entrada e <strong>copie o token</strong></li>
                <li>Cole abaixo e clique em <strong>"Validar Token"</strong></li>
              </ol>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                Token de redefinição
              </label>

              {/* Input do token com botão colar */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", zIndex: 1 }} />
                  <input
                    type="text" value={token}
                    onChange={(e) => { setToken(e.target.value); setTokenError(""); }}
                    placeholder="Cole aqui o token de 64 caracteres"
                    style={{ ...inputStyle(!!tokenError), fontFamily: "'Courier New',monospace", fontSize: "0.8125rem", letterSpacing: "0.02em" }}
                    onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = tokenError ? "#ef4444" : "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
                <button
                  type="button" onClick={handleColarToken} title="Colar da área de transferência"
                  style={{ padding: "0.875rem 1rem", background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: "0.5rem", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: "600", whiteSpace: "nowrap", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
                >
                  <ClipboardPaste size={15} /> Colar
                </button>
              </div>

              {/* Contador de caracteres */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {tokenError ? (
                  <p style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: "500", margin: 0, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <AlertTriangle size={12} /> {tokenError}
                  </p>
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                    {token.length > 0 ? `${token.length} caracteres (necessário: 64)` : "O token foi enviado para o seu e-mail"}
                  </span>
                )}
                {token.length > 0 && (
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: token.trim().length === 64 ? "#16a34a" : "#f59e0b" }}>
                    {token.trim().length === 64 ? "✓ Tamanho correto" : `${64 - token.trim().length} restantes`}
                  </span>
                )}
              </div>
            </div>

            <button type="submit" disabled={loadingVal} style={btnPrimary(loadingVal)}>
              {loadingVal ? (
                <><div style={{ width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />Validando...</>
              ) : <><CheckCircle2 size={16} /> Validar Token</>}
            </button>

            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8125rem", color: "#6b7280" }}>
              Não recebeu o token?{" "}
              <a href="/login" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
                Solicitar novamente
              </a>
            </p>
          </form>
        )}

        {/* ── PASSO 2: Nova Senha ───────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleRedefinir}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.75rem", padding: "0.875rem", marginBottom: "1.5rem", fontSize: "0.8125rem", color: "#166534", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={16} color="#16a34a" />
              Token validado com sucesso! Defina sua nova senha abaixo.
            </div>

            {/* Nova Senha */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                Nova senha
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", zIndex: 1 }} />
                <input
                  type={showNova ? "text" : "password"} value={novaSenha} autoFocus
                  onChange={(e) => { setNovaSenha(e.target.value); setSenhaError(""); }}
                  placeholder="Mínimo 8 caracteres"
                  style={{ ...inputStyle(!!senhaError), padding: "0.875rem 3rem 0.875rem 2.5rem" }}
                  onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = senhaError ? "#ef4444" : "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowNova(!showNova)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "0.25rem" }}>
                  {showNova ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Barra de força */}
              {novaSenha && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ height: "4px", backgroundColor: "#e5e7eb", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((forca.nivel / 6) * 100, 100)}%`, backgroundColor: forca.cor, borderRadius: "2px", transition: "all 0.3s" }} />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: forca.cor, marginTop: "0.25rem", fontWeight: "500" }}>
                    Força: {forca.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                Confirmar nova senha
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", zIndex: 1 }} />
                <input
                  type={showConf ? "text" : "password"} value={confirmar}
                  onChange={(e) => { setConfirmar(e.target.value); setSenhaError(""); }}
                  placeholder="Repita a nova senha"
                  style={{ ...inputStyle(!!senhaError), padding: "0.875rem 3rem 0.875rem 2.5rem" }}
                  onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = senhaError ? "#ef4444" : "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowConf(!showConf)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "0.25rem" }}>
                  {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmar && (
                <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", fontWeight: "500", color: confirmar === novaSenha ? "#16a34a" : "#ef4444" }}>
                  {confirmar === novaSenha ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                </p>
              )}

              {senhaError && (
                <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.375rem", fontWeight: "500", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <AlertTriangle size={12} /> {senhaError}
                </p>
              )}
            </div>

            {/* Requisitos */}
            <div style={{ background: "#f8fafc", borderRadius: "0.5rem", padding: "0.875rem", marginBottom: "1.25rem", fontSize: "0.8125rem" }}>
              <p style={{ color: "#374151", fontWeight: "600", margin: "0 0 0.5rem" }}>A senha deve conter:</p>
              {[
                [novaSenha.length >= 8,              "Mínimo 8 caracteres"],
                [/[A-Z]/.test(novaSenha),            "Ao menos uma letra maiúscula"],
                [/[a-z]/.test(novaSenha),            "Ao menos uma letra minúscula"],
                [/\d/.test(novaSenha),               "Ao menos um número"],
              ].map(([ok, txt]) => (
                <div key={txt} style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: ok ? "#16a34a" : "#9ca3af", marginBottom: "0.25rem" }}>
                  <CheckCircle2 size={12} color={ok ? "#16a34a" : "#d1d5db"} /> {txt}
                </div>
              ))}
            </div>

            <button type="submit" disabled={loadingReset} style={btnPrimary(loadingReset)}>
              {loadingReset ? (
                <><div style={{ width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />Redefinindo...</>
              ) : <><Lock size={16} /> Redefinir Senha</>}
            </button>
          </form>
        )}

        {/* ── PASSO 3: Concluído ────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "4rem", height: "4rem", backgroundColor: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <CheckCircle2 size={32} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#111827", margin: "0 0 0.625rem" }}>
              Senha redefinida com sucesso!
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#4b5563", margin: "0 0 2rem", lineHeight: 1.6 }}>
              Sua senha foi alterada e todas as sessões anteriores foram encerradas por segurança.
              Faça login com a nova senha.
            </p>
            <button
              onClick={() => router.push("/login")}
              style={{ ...btnPrimary(false), justifyContent: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(37,99,235,0.45)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(37,99,235,0.35)"; }}
            >
              <ArrowLeft size={16} /> Ir para o Login
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}