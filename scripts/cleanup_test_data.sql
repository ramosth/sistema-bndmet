-- ============================================================
--  LIMPEZA DE DADOS DE TESTE — Sistema de Monitoramento de Barragens
--  Executar ANTES de reiniciar os testes com o Arduino (firmware v8)
--
--  Remove:
--    IDs 1–3  : inseridos manualmente via Docker (dados sintéticos)
--    ID  4    : inserido via curl com payload incompleto (17 campos NULL)
--    IDs 5–6  : gerados com firmware v7 (bugs já corrigidos na v8)
--
--  Mantém:
--    IDs 7+   : dados reais do Arduino com firmware v8
--
--  ATENÇÃO: execute dentro do container Docker ou com psql conectado ao banco
--  Exemplo de execução:
--    docker exec -it <nome_container_postgres> psql -U <usuario> -d <banco> -f /cleanup_test_data.sql
--  Ou via docker exec com comando inline:
--    docker exec -it <container> psql -U postgres -d monitoramento -c "DELETE FROM leituras_sensor WHERE id <= 6;"
-- ============================================================

BEGIN;

-- Confirmar o que será deletado antes de executar
SELECT
  id,
  timestamp,
  umidade_solo,
  nivel_alerta,
  modo_manual,
  sensor_ok,
  recomendacao
FROM leituras_sensor
WHERE id <= 6
ORDER BY id;

-- Deletar registros de teste (IDs 1 a 6)
DELETE FROM leituras_sensor
WHERE id <= 6;

-- Confirmar resultado
SELECT COUNT(*) AS registros_restantes FROM leituras_sensor;
SELECT MIN(id) AS primeiro_id, MAX(id) AS ultimo_id FROM leituras_sensor;

-- Resetar a sequência do ID para continuar a partir do próximo após o último existente
-- (evita gaps desnecessários na sequência — opcional, mas recomendado para testes limpos)
SELECT setval(
  pg_get_serial_sequence('leituras_sensor', 'id'),
  COALESCE((SELECT MAX(id) FROM leituras_sensor), 0),
  true
);

COMMIT;

-- ============================================================
--  TAMBÉM LIMPAR LOGS gerados pelos registros de teste (opcional)
-- ============================================================
-- DELETE FROM logs_sistema
-- WHERE created_at < '2026-03-12 18:43:00+00';  -- antes dos primeiros dados reais do Arduino

-- ============================================================
--  VERIFICAÇÃO FINAL
-- ============================================================
SELECT
  id,
  timestamp,
  umidade_solo,
  nivel_alerta,
  modo_manual,
  sensor_ok,
  recomendacao
FROM leituras_sensor
ORDER BY id
LIMIT 10;
