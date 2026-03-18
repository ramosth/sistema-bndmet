// Página de login do sistema - Login
// ============= src/app/login/page.js =============
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  Mail,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Fix: window não existe no servidor (SSR). Usar estado inicializado no cliente via useEffect.
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth > 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const onSubmit = async (data, event) => {
    event?.preventDefault();
    setLoading(true);
    try {
      const result = await login(data.email, data.senha);
      if (result.success) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative",
        overflow: "hidden",
        padding: "1rem",
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
          radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(37, 99, 235, 0.2) 0%, transparent 50%)
        `,
          pointerEvents: "none",
        }}
      />

      {/* Botão Voltar */}
      <button
        onClick={handleBackToHome}
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "0.75rem",
          color: "white",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: "500",
          transition: "all 0.3s ease",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
          e.target.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
          e.target.style.transform = "translateY(0)";
        }}
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Container Principal - Layout em Grid para telas maiores */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(480px, 100%), 1fr))",
          gap: "3rem",
          alignItems: "center",
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Seção de Boas-vindas - Visível apenas em telas grandes */}
        {isLargeScreen && (
          <div
            style={{
              color: "white",
              padding: "2rem",
            }}
          >
            <h1
              style={{
                fontSize: "3rem",
                fontWeight: "800",
                marginBottom: "1.5rem",
                lineHeight: 1.2,
                color: "white",
              }}
            >
              Sistema de Monitoramento
            </h1>
            <p
              style={{
                fontSize: "1.25rem",
                marginBottom: "2rem",
                opacity: 0.9,
                lineHeight: 1.6,
              }}
            >
              Acesse o painel administrativo do sistema BNDMET para gerenciar
              sensores, visualizar dados em tempo real e configurar alertas.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginTop: "2rem",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <CheckCircle2 size={20} style={{ marginBottom: "0.5rem" }} />
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    marginBottom: "0.25rem",
                  }}
                >
                  Monitoramento 24/7
                </h3>
                <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Dados em tempo real
                </p>
              </div>

              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <CheckCircle2 size={20} style={{ marginBottom: "0.5rem" }} />
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    marginBottom: "0.25rem",
                  }}
                >
                  Alertas Inteligentes
                </h3>
                <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Notificações automáticas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulário de Login */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            padding: "2.5rem",
            borderRadius: "1.5rem",
            boxShadow:
              "0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            width: "100%",
            maxWidth: "480px",
            justifySelf: "center",
            margin: "0 auto",
          }}
        >
          {/* Header do Formulário - Compacto */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem auto",
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
                position: "relative",
              }}
            >
              <Shield size={24} color="white" />
              <div
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  width: "1.25rem",
                  height: "1.25rem",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid white",
                }}
              >
                <Lock size={10} color="white" />
              </div>
            </div>

            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "800",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: "0 0 0.5rem 0",
                letterSpacing: "-0.02em",
              }}
            >
              Bem-vindo de volta
            </h1>

            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                margin: "0 0 1rem 0",
                fontWeight: "400",
              }}
            >
              Acesse o painel administrativo
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.375rem 0.75rem",
                backgroundColor: "#f0f9ff",
                borderRadius: "1.5rem",
                fontSize: "0.75rem",
                color: "#0369a1",
                border: "1px solid #bae6fd",
              }}
            >
              <CheckCircle2 size={12} />
              TCC IPRJ
            </div>
          </div>

          {/* Formulário - Compacto */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ marginBottom: "1.5rem" }}
          >
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    zIndex: 1,
                  }}
                />
                <input
                  type="email"
                  placeholder="Digite seu email"
                  style={{
                    width: "100%",
                    padding: "0.875rem 0.875rem 0.875rem 2.5rem",
                    border: `2px solid ${errors.email ? "#ef4444" : "#e5e7eb"}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    backgroundColor: "white",
                    color: "#1f2937",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    fontWeight: "400",
                  }}
                  {...register("email", {
                    required: "Email é obrigatório",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email inválido",
                    },
                  })}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(37, 99, 235, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email
                      ? "#ef4444"
                      : "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {errors.email && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    marginTop: "0.375rem",
                    fontWeight: "500",
                  }}
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    zIndex: 1,
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  style={{
                    width: "100%",
                    padding: "0.875rem 3rem 0.875rem 2.5rem",
                    border: `2px solid ${errors.senha ? "#ef4444" : "#e5e7eb"}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    backgroundColor: "white",
                    color: "#1f2937",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    fontWeight: "400",
                  }}
                  {...register("senha", {
                    required: "Senha é obrigatória",
                    minLength: {
                      value: 6,
                      message: "Senha deve ter no mínimo 6 caracteres",
                    },
                  })}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(37, 99, 235, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.senha
                      ? "#ef4444"
                      : "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    cursor: "pointer",
                    padding: "0.375rem",
                    borderRadius: "0.25rem",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "#374151";
                    e.target.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "#6b7280";
                    e.target.style.backgroundColor = "transparent";
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.senha && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    marginTop: "0.375rem",
                    fontWeight: "500",
                  }}
                >
                  {errors.senha.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.875rem",
                background: loading
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                border: "none",
                borderRadius: "0.5rem",
                color: "white",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: loading
                  ? "none"
                  : "0 10px 25px rgba(37, 99, 235, 0.4)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 15px 35px rgba(37, 99, 235, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 10px 25px rgba(37, 99, 235, 0.4)";
                }
              }}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "1rem",
                      height: "1rem",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Entrando...
                </div>
              ) : (
                "Entrar no Sistema"
              )}
            </button>
          </form>

          {/* Features Compactas */}
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f8fafc",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.75rem",
                textAlign: "center",
              }}
            >
              Acesso Administrativo:
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                <CheckCircle2 size={12} color="#10b981" />
                Painel de Controle
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                <CheckCircle2 size={12} color="#10b981" />
                Gestão de Usuários
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                <CheckCircle2 size={12} color="#10b981" />
                Dados dos Sensores
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                <CheckCircle2 size={12} color="#10b981" />
                Relatórios e Alertas
              </div>
            </div>
          </div>

          {/* Footer Info - Compacto */}
          <div
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                margin: "0 0 0.375rem 0",
              }}
            >
              Usuários básicos não precisam fazer login
            </p>
            <button
              onClick={handleBackToHome}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.75rem",
                fontWeight: "500",
              }}
            >
              Cadastre-se para receber alertas
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1024px) {
          .welcome-section {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}