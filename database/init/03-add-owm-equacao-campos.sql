-- backend > init > 03-add-owm-equacao-campos.sql
-- Migration 03: adicionar status_api_owm e campos da Equação 5 TCC
-- Executar no container PostgreSQL: docker exec -i bndmet-postgres psql -U admin -d bndmet
-- Todos os campos são nullable — sem impacto em registros existentes

BEGIN;

-- OWM: status da API (após coluna estacao)
ALTER TABLE leituras_sensor
  ADD COLUMN IF NOT EXISTS status_api_owm VARCHAR(50) DEFAULT NULL;

-- OWM: campos adicionais que estavam ausentes do schema
ALTER TABLE leituras_sensor
  ADD COLUMN IF NOT EXISTS chuva_atual_owm    DECIMAL(8,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS chuva_futura_24h   DECIMAL(8,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS intensidade_previsao VARCHAR(30)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fator_intensidade  DECIMAL(4,2)  DEFAULT NULL;

-- Análise: taxa de variação
ALTER TABLE leituras_sensor
  ADD COLUMN IF NOT EXISTS taxa_variacao_umidade DECIMAL(6,3) DEFAULT NULL;

-- Componentes da Equação 5 TCC
ALTER TABLE leituras_sensor
  ADD COLUMN IF NOT EXISTS v_lencol           DECIMAL(6,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS v_chuva_atual      DECIMAL(6,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS v_chuva_historica  DECIMAL(6,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS v_chuva_mensal     DECIMAL(6,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS v_chuva_futura     DECIMAL(6,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS v_taxa_variacao    DECIMAL(6,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS v_pressao          DECIMAL(6,4) DEFAULT NULL;

-- Reordenar status_api_owm visualmente após estacao (PostgreSQL não suporta
-- AFTER nativamente, mas a posição lógica fica registrada no schema Prisma)
-- Para reordenar fisicamente seria necessário recriar a tabela — não recomendado
-- em produção. A coluna funciona normalmente em qualquer posição.

COMMIT;

-- Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leituras_sensor'
  AND column_name IN (
    'status_api_owm','chuva_atual_owm','chuva_futura_24h',
    'intensidade_previsao','fator_intensidade','taxa_variacao_umidade',
    'v_lencol','v_chuva_atual','v_chuva_historica','v_chuva_mensal',
    'v_chuva_futura','v_taxa_variacao','v_pressao'
  )
ORDER BY ordinal_position;
