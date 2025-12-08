# 🗄️ MIGRAÇÃO SQLITE AUTOMÁTICA - DOCUMENTAÇÃO COMPLETA

## ✅ STATUS FINAL

**✅ SISTEMA DE MIGRAÇÃO AUTOMÁTICA IMPLEMENTADO**

O backend agora executa migrações automaticamente antes de iniciar o servidor, garantindo que todas as tabelas e colunas necessárias existam.

---

## 📋 ARQUIVOS CRIADOS/MODIFICADOS

### 1. `backend/src/migrations.js` (NOVO ARQUIVO)

**Funções Implementadas:**

#### A) `columnExists(db, tableName, columnName)`
- Verifica se uma coluna existe em uma tabela
- Usa `PRAGMA table_info()` para segurança
- Retorna Promise<boolean>

#### B) `tableExists(db, tableName)`
- Verifica se uma tabela existe no banco
- Usa `sqlite_master` para verificação
- Retorna Promise<boolean>

#### C) `runSQL(db, sql, params)`
- Executa SQL de forma segura
- Retorna Promise
- Trata erros adequadamente

#### D) `createTablesIfNotExist(db)`
- Cria todas as tabelas se não existirem
- Tabelas criadas:
  - `usuarios`
  - `proprietarios`
  - `veiculos`
  - `manutencoes`
- Loga cada etapa

#### E) `addMissingColumns(db)`
- Verifica e adiciona colunas faltantes
- Especialmente `usuario_id` em todas as tabelas
- Adiciona colunas opcionais (marca, modelo, ano, telefone)
- Trata erros de coluna duplicada graciosamente

#### F) `runMigrations()` (export default)
- Função principal que executa todas as migrações
- Cria pasta database se não existir
- Conecta ao banco
- Executa `createTablesIfNotExist` e `addMissingColumns`
- Fecha conexão após conclusão
- Loga todo o processo

**Status:** ✅ Implementado

---

### 2. `backend/src/index.js` (MODIFICADO)

**Ajustes Aplicados:**

#### A) Import de migrations adicionado
```diff
+ import runMigrations from './migrations.js';
```

#### B) Código antigo de criação de tabelas removido
```diff
- db.serialize(() => {
-   // Tabela de usuários
-   db.run(`CREATE TABLE IF NOT EXISTS usuarios (...)`);
-   // ... outras tabelas
- });
```

#### C) Execução de migrações antes de iniciar servidor
```diff
- const PORT = process.env.PORT || 3000;
- app.listen(PORT, '0.0.0.0', () => {
-   console.log(`Servidor rodando na porta ${PORT}`);
- });
+ // Executar migrações antes de iniciar o servidor
+ runMigrations()
+   .then(() => {
+     const PORT = process.env.PORT || 3000;
+     app.listen(PORT, '0.0.0.0', () => {
+       console.log(`Servidor rodando na porta ${PORT}`);
+     });
+   })
+   .catch((error) => {
+     console.error('Erro ao executar migrações:', error);
+     process.exit(1);
+   });
```

**Status:** ✅ Atualizado

---

## 📊 DIFS COMPLETOS

### Diff 1: backend/src/index.js - Adicionar import

```diff
  import express from 'express';
  import path from 'path';
  import cors from 'cors';
  import sqlite3 from 'sqlite3';
  import multer from 'multer';
  import fs from 'fs';
  import { fileURLToPath } from 'url';
+ import runMigrations from './migrations.js';

  import authRouter from './routes/auth.js';
  ...
```

### Diff 2: backend/src/index.js - Substituir criação de tabelas

```diff
- // Criar DB e tabelas se não existirem
- const dbPath = path.join(__dirname, 'database', 'manutencoes.db');
- const db = new sqlite3.Database(dbPath);
-
- db.serialize(() => {
-   // Tabela de usuários
-   db.run(`CREATE TABLE IF NOT EXISTS usuarios (
-     id INTEGER PRIMARY KEY AUTOINCREMENT,
-     nome TEXT NOT NULL,
-     email TEXT UNIQUE NOT NULL,
-     senha TEXT NOT NULL,
-     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-   )`);
-
-   db.run(`CREATE TABLE IF NOT EXISTS proprietarios (
-     id INTEGER PRIMARY KEY AUTOINCREMENT,
-     nome TEXT NOT NULL,
-     cpf TEXT,
-     rg TEXT,
-     cnh TEXT,
-     usuario_id INTEGER NOT NULL,
-     FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
-   )`);
-
-   db.run(`CREATE TABLE IF NOT EXISTS veiculos (
-     id INTEGER PRIMARY KEY AUTOINCREMENT,
-     placa TEXT NOT NULL,
-     renavam TEXT NOT NULL,
-     proprietario_id INTEGER,
-     usuario_id INTEGER NOT NULL,
-     FOREIGN KEY (proprietario_id) REFERENCES proprietarios(id),
-     FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
-   )`);
-
-   db.run(`CREATE TABLE IF NOT EXISTS manutencoes (
-     id INTEGER PRIMARY KEY AUTOINCREMENT,
-     veiculo_id INTEGER,
-     usuario_id INTEGER NOT NULL,
-     descricao TEXT,
-     data TEXT,
-     valor REAL,
-     tipo TEXT,
-     imagem TEXT,
-     FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
-     FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
-   )`);
- });
-
- const PORT = process.env.PORT || 3000;
- app.listen(PORT, '0.0.0.0', () => {
-   console.log(`Servidor rodando na porta ${PORT}`);
- });
+ // Criar DB (será usado pelas rotas)
+ const dbPath = path.join(__dirname, 'database', 'manutencoes.db');
+ const db = new sqlite3.Database(dbPath);
+
+ // Executar migrações antes de iniciar o servidor
+ runMigrations()
+   .then(() => {
+     const PORT = process.env.PORT || 3000;
+     app.listen(PORT, '0.0.0.0', () => {
+       console.log(`Servidor rodando na porta ${PORT}`);
+     });
+   })
+   .catch((error) => {
+     console.error('Erro ao executar migrações:', error);
+     process.exit(1);
+   });
```

### Diff 3: backend/src/migrations.js - Arquivo completo (NOVO)

```javascript
// Arquivo completo criado com todas as funções de migração
// Ver arquivo para detalhes completos
```

---

## 🗂️ ESTRUTURA DAS TABELAS

### Tabela: `usuarios`
```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Tabela: `proprietarios`
```sql
CREATE TABLE proprietarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  rg TEXT,
  cnh TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
)
```

**Colunas adicionadas automaticamente se faltarem:**
- `usuario_id` (se não existir)
- `telefone` (se não existir)

### Tabela: `veiculos`
```sql
CREATE TABLE veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  proprietario_id INTEGER,
  marca TEXT,
  modelo TEXT,
  ano TEXT,
  placa TEXT UNIQUE,
  renavam TEXT,
  FOREIGN KEY (proprietario_id) REFERENCES proprietarios(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
)
```

**Colunas adicionadas automaticamente se faltarem:**
- `usuario_id` (se não existir)
- `marca` (se não existir)
- `modelo` (se não existir)
- `ano` (se não existir)

### Tabela: `manutencoes`
```sql
CREATE TABLE manutencoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  veiculo_id INTEGER,
  descricao TEXT,
  data TEXT,
  valor REAL,
  tipo TEXT,
  imagem TEXT,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
)
```

**Colunas adicionadas automaticamente se faltarem:**
- `usuario_id` (se não existir)

---

## 📝 LOGS ESPERADOS NO DEPLOY

### Primeira execução (banco vazio):
```
🚀 Iniciando migrações do banco de dados...
  ✓ Conectado ao banco de dados
📋 Verificando tabelas...
  ✓ Criando tabela usuarios...
  ✓ Tabela usuarios criada
  ✓ Criando tabela proprietarios...
  ✓ Tabela proprietarios criada
  ✓ Criando tabela veiculos...
  ✓ Tabela veiculos criada
  ✓ Criando tabela manutencoes...
  ✓ Tabela manutencoes criada
🔧 Verificando colunas faltantes...
  ✓ Todas as colunas verificadas
✅ Migrações concluídas com sucesso
Servidor rodando na porta 3000
```

### Execuções subsequentes (banco já existe):
```
🚀 Iniciando migrações do banco de dados...
  ✓ Conectado ao banco de dados
📋 Verificando tabelas...
  ✓ Tabela usuarios já existe
  ✓ Tabela proprietarios já existe
  ✓ Tabela veiculos já existe
  ✓ Tabela manutencoes já existe
🔧 Verificando colunas faltantes...
  ✓ Todas as colunas verificadas
✅ Migrações concluídas com sucesso
Servidor rodando na porta 3000
```

### Se faltar coluna `usuario_id`:
```
🚀 Iniciando migrações do banco de dados...
  ✓ Conectado ao banco de dados
📋 Verificando tabelas...
  ✓ Tabela usuarios já existe
  ✓ Tabela proprietarios já existe
  ✓ Tabela veiculos já existe
  ✓ Tabela manutencoes já existe
🔧 Verificando colunas faltantes...
  ✓ Adicionando coluna usuario_id em veiculos...
  ✓ Coluna usuario_id adicionada em veiculos
  ✓ Todas as colunas verificadas
✅ Migrações concluídas com sucesso
Servidor rodando na porta 3000
```

---

## 🔧 O QUE SERÁ CORRIGIDO NO PRÓXIMO DEPLOY

### Erros que serão resolvidos:

1. ✅ **`SQLITE_ERROR: no such column: v.usuario_id`**
   - **Causa:** Tabela `veiculos` criada sem coluna `usuario_id`
   - **Solução:** Migração adiciona `usuario_id` automaticamente se faltar

2. ✅ **`SQLITE_ERROR: no such column: m.usuario_id`**
   - **Causa:** Tabela `manutencoes` criada sem coluna `usuario_id`
   - **Solução:** Migração adiciona `usuario_id` automaticamente se faltar

3. ✅ **`SQLITE_ERROR: no such column: p.usuario_id`**
   - **Causa:** Tabela `proprietarios` criada sem coluna `usuario_id`
   - **Solução:** Migração adiciona `usuario_id` automaticamente se faltar

4. ✅ **Tabelas faltantes**
   - **Causa:** Banco de dados novo ou resetado
   - **Solução:** Migração cria todas as tabelas automaticamente

5. ✅ **Colunas opcionais faltantes**
   - **Causa:** Estrutura antiga do banco
   - **Solução:** Migração adiciona `marca`, `modelo`, `ano`, `telefone` se faltarem

---

## ✅ REGRAS DE MIGRAÇÃO IMPLEMENTADAS

- ✅ **Não apaga nada** - Apenas adiciona o que falta
- ✅ **Adiciona apenas o que faltar** - Verifica antes de adicionar
- ✅ **Cria tabelas vazias caso não existam** - `CREATE TABLE IF NOT EXISTS`
- ✅ **Roda SEM TRAVAR no Render** - Usa Promises e async/await
- ✅ **Compatível com SQLite efêmero** - Funciona mesmo se banco for resetado
- ✅ **Logs claros** - Facilita debug no deploy
- ✅ **Tratamento de erros** - Não quebra se coluna já existir

---

## 🚀 COMO FUNCIONA

### Fluxo de Execução:

1. **Servidor inicia** → `index.js` é executado
2. **Importa migrations** → `import runMigrations from './migrations.js'`
3. **Executa migrações** → `runMigrations()` é chamado
4. **Verifica tabelas** → `createTablesIfNotExist()`
5. **Verifica colunas** → `addMissingColumns()`
6. **Inicia servidor** → `app.listen()` só roda após migrações

### Segurança:

- ✅ Usa `PRAGMA table_info()` para verificar colunas (seguro)
- ✅ Usa `sqlite_master` para verificar tabelas (seguro)
- ✅ Trata erros de coluna duplicada (não quebra)
- ✅ Usa Promises para evitar travamentos
- ✅ Fecha conexão após migrações

---

## 📋 RESUMO DAS MIGRAÇÕES CRIADAS

### Migração 1: Criar Tabelas
- Cria `usuarios` se não existir
- Cria `proprietarios` se não existir
- Cria `veiculos` se não existir
- Cria `manutencoes` se não existir

### Migração 2: Adicionar Colunas Faltantes
- Adiciona `usuario_id` em `proprietarios` se faltar
- Adiciona `telefone` em `proprietarios` se faltar
- Adiciona `usuario_id` em `veiculos` se faltar
- Adiciona `marca` em `veiculos` se faltar
- Adiciona `modelo` em `veiculos` se faltar
- Adiciona `ano` em `veiculos` se faltar
- Adiciona `usuario_id` em `manutencoes` se faltar

---

## ✅ CONCLUSÃO

**STATUS:** ✅ **SISTEMA DE MIGRAÇÃO AUTOMÁTICA IMPLEMENTADO**

**Arquivos Criados:**
- `backend/src/migrations.js` (novo)

**Arquivos Modificados:**
- `backend/src/index.js` (atualizado)

**Benefícios:**
- ✅ Erros de coluna faltante serão corrigidos automaticamente
- ✅ Banco sempre terá estrutura correta
- ✅ Funciona mesmo após reset do banco (Render free plan)
- ✅ Logs claros para debug
- ✅ Não quebra se estrutura já estiver correta

**Próximo Deploy:**
- As migrações rodarão automaticamente
- Todos os erros de coluna faltante serão corrigidos
- O servidor só iniciará após migrações concluídas

---

**Data:** 2025-01-XX
**Versão:** 1.0.0

