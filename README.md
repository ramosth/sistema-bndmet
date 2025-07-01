# Sistema Integrado de Monitoramento Avançado
## ESP8266 NodeMCU com Integração BNDMET

### Resumo Executivo

O presente projeto consiste no desenvolvimento de um sistema integrado de monitoramento baseado no microcontrolador ESP8266 NodeMCU, com integração à Base Nacional de Dados Meteorológicos (BNDMET). A solução implementa uma arquitetura distribuída para coleta, processamento e armazenamento de dados ambientais em tempo real, utilizando tecnologias modernas de desenvolvimento web e banco de dados.

---

## Objetivos do Sistema

### Objetivo Geral
Desenvolver uma plataforma robusta de monitoramento ambiental que integre dispositivos IoT (Internet of Things) com sistemas de armazenamento e análise de dados, fornecendo uma interface web para visualização e gerenciamento das informações coletadas.

### Objetivos Específicos
- Implementar coleta automatizada de dados através do ESP8266 NodeMCU
- Estabelecer comunicação com a Base Nacional de Dados Meteorológicos
- Desenvolver API RESTful para gerenciamento de dados
- Implementar sistema de armazenamento persistente com PostgreSQL
- Criar interface de administração web responsiva

---

## Arquitetura do Sistema

O sistema foi projetado seguindo uma arquitetura em camadas, composta por:

1. **Camada de Dispositivos**: ESP8266 NodeMCU com sensores
2. **Camada de Comunicação**: API REST para integração
3. **Camada de Dados**: PostgreSQL com ORM Prisma
4. **Camada de Apresentação**: Interface web administrativa

---

## Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript para servidor
- **Prisma ORM**: Mapeamento objeto-relacional
- **PostgreSQL**: Sistema de gerenciamento de banco de dados
- **Docker**: Containerização de serviços

### Frontend
- **Interface Web**: Dashboard administrativo
- **Adminer**: Interface de administração de banco de dados

### Hardware
- **ESP8266 NodeMCU**: Microcontrolador principal
- **Sensores Ambientais**: Coleta de dados físicos

---

## Guia de Implementação

### Pré-requisitos do Sistema

O ambiente de desenvolvimento requer as seguintes dependências:
- Docker Desktop instalado e em execução
- Node.js (versão 14 ou superior)
- NPM (Node Package Manager)
- Porta 3001, 8080 e 5432 disponíveis no sistema

### Configuração do Ambiente de Banco de Dados

#### 1. Inicialização dos Containers

A infraestrutura de dados é gerenciada através de containers Docker. Execute o comando abaixo para inicializar os serviços:

```bash
docker-compose up -d
```

#### 2. Verificação do Status dos Serviços

Para validar a correta inicialização dos containers, execute:

```bash
docker-compose ps
```

**Saída esperada:**
```
NAME                STATUS
bndmet-postgres     Up
bndmet-adminer      Up
```

#### 3. Validação da Conectividade

##### 3.1 Acesso via Interface Web (Adminer)

Acesse a interface administrativa através do navegador:
- **URL**: `http://localhost:8080`
- **Credenciais de Acesso**:
  - Sistema: PostgreSQL
  - Servidor: postgres
  - Usuário: admin
  - Senha: senha123
  - Base de dados: bndmet

##### 3.2 Acesso via Terminal

Para validação através de linha de comando:

```bash
docker exec -it bndmet-postgres psql -U admin -d bndmet
```

**Comandos de verificação:**
```sql
\dt                                    -- Listar estrutura de tabelas
SELECT COUNT(*) FROM leituras_sensor;  -- Validar registros existentes
SELECT * FROM view_ultimas_leituras;   -- Consultar dados de teste
\q                                     -- Encerrar sessão
```

#### 4. Comandos de Gerenciamento

```bash
# Visualização de logs do sistema
docker-compose logs postgres

# Interrupção dos serviços
docker-compose down

# Reinicialização dos containers
docker-compose restart

# Limpeza completa do ambiente (ATENÇÃO: Remove todos os dados)
docker-compose down -v
```

### Configuração do Backend

#### 1. Navegação para Diretório de Backend

```bash
cd backend
```

#### 2. Geração do Cliente Prisma

O ORM Prisma requer a geração de cliente para interação com o banco de dados:

```bash
npx prisma generate
```

#### 3. Sincronização do Schema

Para aplicar as definições de esquema ao banco de dados:

```bash
npx prisma db push
```

#### 4. Inicialização do Servidor de Desenvolvimento

```bash
npm run dev
```

**Saída de inicialização bem-sucedida:**
```
✅ Conectado ao banco de dados
🔄 Gerando cliente Prisma...
🚀 Servidor rodando na porta 3001
📊 Ambiente: development
🌐 URL local: http://localhost:3001
📋 Health check: http://localhost:3001/api/sensor/status
```

---

## Testes de Validação do Sistema

### Teste de Conectividade da API

#### 1. Endpoint Principal
- **URL**: `http://localhost:3001/api`
- **Método**: GET
- **Resposta esperada**: Metadados da API

#### 2. Health Check
- **URL**: `http://localhost:3001/api/sensor/status`
- **Método**: GET
- **Resposta esperada**: Status operacional da API e conectividade com banco de dados

### Ferramentas de Teste Recomendadas
- **Postman**: Para testes de API
- **cURL**: Para validação via linha de comando
- **Navegador web**: Para testes básicos de conectividade

---

## Resultados Esperados

Após a implementação completa do sistema, espera-se obter:

1. **Coleta automatizada** de dados ambientais em intervalos configuráveis
2. **Armazenamento persistente** de dados históricos
3. **Interface web responsiva** para monitoramento em tempo real
4. **API REST funcional** para integração com sistemas terceiros
5. **Integração efetiva** com a Base Nacional de Dados Meteorológicos

---

## Conclusões

O sistema desenvolvido representa uma solução tecnológica robusta para monitoramento ambiental, combinando hardware de baixo custo (ESP8266) com tecnologias de software modernas. A arquitetura implementada permite escalabilidade e extensibilidade para futuras funcionalidades, atendendo aos requisitos de um projeto acadêmico de engenharia da computação com aplicabilidade prática em cenários reais de monitoramento.