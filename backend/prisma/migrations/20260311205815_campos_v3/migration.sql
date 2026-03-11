/*
  Warnings:

  - The primary key for the `leituras_sensor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `blynk_conectado` on the `leituras_sensor` table. All the data in the column will be lost.
  - You are about to drop the column `precipitacao_previsao_24h` on the `leituras_sensor` table. All the data in the column will be lost.
  - You are about to drop the column `precipitacao_previsao_6h` on the `leituras_sensor` table. All the data in the column will be lost.
  - You are about to drop the column `previsao_umidade_24h` on the `leituras_sensor` table. All the data in the column will be lost.
  - You are about to drop the column `previsao_umidade_6h` on the `leituras_sensor` table. All the data in the column will be lost.
  - You are about to drop the column `tempo_ate_critico` on the `leituras_sensor` table. All the data in the column will be lost.
  - You are about to drop the column `tendencia_piora` on the `leituras_sensor` table. All the data in the column will be lost.
  - You are about to drop the column `tendencia_tempo` on the `leituras_sensor` table. All the data in the column will be lost.
  - Made the column `created_at` on table `leituras_sensor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `leituras_sensor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "leituras_sensor" DROP CONSTRAINT "leituras_sensor_pkey",
DROP COLUMN "blynk_conectado",
DROP COLUMN "precipitacao_previsao_24h",
DROP COLUMN "precipitacao_previsao_6h",
DROP COLUMN "previsao_umidade_24h",
DROP COLUMN "previsao_umidade_6h",
DROP COLUMN "tempo_ate_critico",
DROP COLUMN "tendencia_piora",
DROP COLUMN "tendencia_tempo",
ADD COLUMN     "amplificado" BOOLEAN DEFAULT false,
ADD COLUMN     "chuva_atual_owm" DECIMAL(8,2),
ADD COLUMN     "chuva_futura_24h" DECIMAL(8,2),
ADD COLUMN     "estacao" VARCHAR(20),
ADD COLUMN     "fator_intensidade" DECIMAL(4,2),
ADD COLUMN     "intensidade_previsao" VARCHAR(30),
ADD COLUMN     "taxa_variacao_umidade" DECIMAL(6,3),
ADD COLUMN     "v_chuva_atual" DECIMAL(5,4),
ADD COLUMN     "v_chuva_futura" DECIMAL(5,4),
ADD COLUMN     "v_chuva_historica" DECIMAL(5,4),
ADD COLUMN     "v_chuva_mensal" DECIMAL(5,4),
ADD COLUMN     "v_lencol" DECIMAL(5,4),
ADD COLUMN     "v_pressao" DECIMAL(5,4),
ADD COLUMN     "v_taxa_variacao" DECIMAL(5,4),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ADD CONSTRAINT "leituras_sensor_pkey" PRIMARY KEY ("id", "timestamp");

-- CreateTable
CREATE TABLE "logs_sistema" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nivel" VARCHAR(20) NOT NULL,
    "componente" VARCHAR(50),
    "mensagem" TEXT NOT NULL,
    "dados_extras" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_sistema_pkey" PRIMARY KEY ("id","timestamp")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" SERIAL NOT NULL,
    "chave" VARCHAR(100) NOT NULL,
    "valor" TEXT,
    "descricao" TEXT,
    "tipo" VARCHAR(20) DEFAULT 'string',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_admin" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "perfil" VARCHAR(20) NOT NULL DEFAULT 'admin',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMPTZ(6),
    "token_reset" VARCHAR(255),
    "token_reset_expira" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_basicos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "receber_notificacoes" BOOLEAN NOT NULL DEFAULT true,
    "tipo_notificacao" VARCHAR(50) NOT NULL DEFAULT 'email,sms',
    "ultimo_alerta_enviado" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_basicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_usuario" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_alertas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_admin_id" UUID,
    "tipo_destinatario" VARCHAR(20) NOT NULL,
    "destinatarios_ids" UUID[],
    "tipo_alerta" VARCHAR(50) NOT NULL,
    "nivel_criticidade" VARCHAR(20) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "canais_envio" VARCHAR(100) NOT NULL,
    "total_enviados" INTEGER NOT NULL DEFAULT 0,
    "total_sucesso" INTEGER NOT NULL DEFAULT 0,
    "total_falhas" INTEGER NOT NULL DEFAULT 0,
    "detalhes_envio" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_alertas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_admin_email_key" ON "usuarios_admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_basicos_email_key" ON "usuarios_basicos"("email");

-- AddForeignKey
ALTER TABLE "sessoes_usuario" ADD CONSTRAINT "sessoes_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_alertas" ADD CONSTRAINT "logs_alertas_usuario_admin_id_fkey" FOREIGN KEY ("usuario_admin_id") REFERENCES "usuarios_admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
