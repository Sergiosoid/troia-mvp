# 🧪 INSTRUÇÕES - Testar Backend Localmente
## Guia para Testar SQLite e PostgreSQL

**Data:** Janeiro 2025

---

## 📋 PRÉ-REQUISITOS

1. Node.js 18+ instalado
2. PostgreSQL instalado (opcional, para teste com Postgres)
3. Backend do TROIA configurado

---

## 🔧 TESTE 1: SQLite (Desenvolvimento)

### 1.1. Configurar Ambiente

```bash
cd backend

# Não definir DATABASE_URL (usa SQLite por padrão)
# Ou garantir que DATABASE_URL não está definida
unset DATABASE_URL  # Linux/Mac
# ou no PowerShell: Remove-Item Env:\DATABASE_URL
```

### 1.2. Instalar Dependências

```bash
npm install
```

### 1.3. Iniciar Servidor

```bash
npm start
```

**Saída esperada:**
```
✅ Usando SQLite (desenvolvimento)
🚀 Iniciando migrações do banco de dados...
  ✓ Conectado ao banco de dados
✅ Migrações concluídas com sucesso
✅ Servidor rodando na porta 3000
```

### 1.4. Testar Endpoints

**Registrar usuário:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "email": "teste@test.com",
    "senha": "123456"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@test.com",
    "senha": "123456"
  }'
```

**Salvar o token retornado para próximos testes:**
```bash
export TOKEN="seu-token-aqui"
```

**Cadastrar proprietário:**
```bash
curl -X POST http://localhost:3000/proprietarios/cadastrar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "telefone": "(11) 99999-9999"
  }'
```

**Listar proprietários:**
```bash
curl -X GET http://localhost:3000/proprietarios \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🗄️ TESTE 2: PostgreSQL (Produção Local)

### 2.1. Instalar PostgreSQL

**Windows:**
- Baixar de: https://www.postgresql.org/download/windows/
- Instalar e configurar senha do usuário `postgres`

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

### 2.2. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco e usuário
CREATE DATABASE troia;
CREATE USER troia_user WITH PASSWORD 'troia_password';
GRANT ALL PRIVILEGES ON DATABASE troia TO troia_user;
\q
```

### 2.3. Configurar DATABASE_URL

**Linux/Mac:**
```bash
export DATABASE_URL="postgresql://troia_user:troia_password@localhost:5432/troia"
```

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://troia_user:troia_password@localhost:5432/troia"
```

**Windows (CMD):**
```cmd
set DATABASE_URL=postgresql://troia_user:troia_password@localhost:5432/troia
```

### 2.4. Iniciar Servidor

```bash
cd backend
npm start
```

**Saída esperada:**
```
✅ Conectado ao PostgreSQL
✅ Usando PostgreSQL
🚀 Iniciando migrações do banco de dados PostgreSQL...
📋 Verificando tabelas...
  ✓ Tabela usuarios criada
  ✓ Tabela proprietarios criada
  ✓ Tabela veiculos criada
  ✓ Tabela manutencoes criada
✅ Migrações concluídas com sucesso
✅ Servidor rodando na porta 3000
✅ Ambiente: development
✅ Banco: PostgreSQL
```

### 2.5. Testar Endpoints

**Mesmos comandos do Teste 1:**
```bash
# Registrar
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@test.com","senha":"123456"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@test.com","senha":"123456"}'

# Salvar token
export TOKEN="seu-token"

# Cadastrar proprietário
curl -X POST http://localhost:3000/proprietarios/cadastrar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nome":"João Silva","cpf":"123.456.789-00"}'

# Listar proprietários
curl -X GET http://localhost:3000/proprietarios \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ CHECKLIST DE TESTES

### SQLite
- [ ] Servidor inicia sem erros
- [ ] Migrações executam
- [ ] Register funciona
- [ ] Login funciona
- [ ] Cadastrar proprietário funciona
- [ ] Listar proprietários funciona
- [ ] Cadastrar veículo funciona
- [ ] Listar veículos funciona
- [ ] Cadastrar manutenção funciona
- [ ] Listar manutenções funciona
- [ ] Excluir manutenção funciona

### PostgreSQL
- [ ] Servidor inicia sem erros
- [ ] Conecta ao PostgreSQL
- [ ] Migrações executam
- [ ] Todas as rotas funcionam
- [ ] Dados persistem corretamente

---

## 🐛 TROUBLESHOOTING

### Erro: "DATABASE_URL não configurada"

**Solução:**
- Para SQLite: Não definir DATABASE_URL
- Para PostgreSQL: Definir DATABASE_URL corretamente

### Erro: "Cannot connect to PostgreSQL"

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
psql -U postgres -c "SELECT version();"

# Verificar conexão
psql $DATABASE_URL
```

### Erro: "relation does not exist"

**Solução:**
- Verificar se migrações executaram
- Verificar logs do servidor
- Executar migrações manualmente se necessário

### Erro: "syntax error at or near"

**Solução:**
- Verificar se queries usam `?` (será convertido automaticamente)
- Verificar se RETURNING está sendo adicionado em INSERTs

---

## 📊 VERIFICAR DADOS

### SQLite

```bash
# Verificar banco
sqlite3 backend/src/database/manutencoes.db

# Listar tabelas
.tables

# Ver dados
SELECT * FROM usuarios;
SELECT * FROM proprietarios;
SELECT * FROM veiculos;
SELECT * FROM manutencoes;
```

### PostgreSQL

```bash
# Conectar
psql $DATABASE_URL

# Listar tabelas
\dt

# Ver dados
SELECT * FROM usuarios;
SELECT * FROM proprietarios;
SELECT * FROM veiculos;
SELECT * FROM manutencoes;
```

---

## 🎯 CONCLUSÃO

Após testar localmente:
- ✅ SQLite funciona
- ✅ PostgreSQL funciona
- ✅ Todas as rotas funcionam
- ✅ Dados persistem corretamente

**Pronto para deploy no Render!** 🚀

---

**Testes concluídos!** ✅

