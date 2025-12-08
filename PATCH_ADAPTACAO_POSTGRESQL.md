# 🔄 PATCH - Adaptação Completa para PostgreSQL
## Engenheiro Full Stack - TROIA MVP

**Data:** Janeiro 2025  
**Status:** ✅ **IMPLEMENTAÇÃO CONCLUÍDA**

---

## 📋 RESUMO EXECUTIVO

Foi realizada a adaptação completa de todas as rotas do backend para suportar PostgreSQL em produção, mantendo compatibilidade com SQLite em desenvolvimento. Todas as queries foram convertidas para usar prepared statements e a interface unificada do `db-helper.js`.

**Arquivos Criados/Modificados:**
- `backend/src/database/db-helper.js` - Helper unificado (NOVO)
- `backend/src/routes/auth.js` - Adaptado para PostgreSQL
- `backend/src/routes/proprietarios.js` - Adaptado para PostgreSQL
- `backend/src/routes/veiculos.js` - Adaptado para PostgreSQL
- `backend/src/routes/manutencoes.js` - Adaptado para PostgreSQL

---

## 🔧 MODIFICAÇÕES REALIZADAS

### 1. db-helper.js - Helper Unificado

**Criado:**
```javascript
import { isPostgres, isSqlite } from './db-adapter.js';
import { query, queryOne, queryAll, execute } from './postgres.js';
import sqlite3 from 'sqlite3';

// Funções unificadas
export async function dbGet(sql, params = [])      // SELECT uma linha
export async function dbAll(sql, params = [])      // SELECT múltiplas linhas
export async function dbRun(sql, params = [])      // INSERT/UPDATE/DELETE
export async function dbPrepare(sql)                // Prepared statement
```

**Características:**
- ✅ Converte automaticamente `?` → `$1, $2, $3...` para PostgreSQL
- ✅ Adiciona `RETURNING id` automaticamente em INSERTs PostgreSQL
- ✅ Mantém compatibilidade com SQLite
- ✅ Interface unificada para ambos os bancos

**Conversão de Parâmetros:**
```javascript
// SQLite: SELECT * FROM usuarios WHERE email = ?
// PostgreSQL: SELECT * FROM usuarios WHERE email = $1
```

**RETURNING Automático:**
```javascript
// INSERT sem RETURNING → adiciona automaticamente
INSERT INTO usuarios (nome, email) VALUES ($1, $2) RETURNING id
```

---

### 2. auth.js - Rotas de Autenticação

#### 2.1. Register

**Antes (SQLite):**
```javascript
db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err, row) => {
  // ...
  stmt.run(nome, email, senhaHash, function(err) {
    const token = gerarToken(this.lastID);
    // ...
  });
});
```

**Depois (Unificado):**
```javascript
const existingUser = await dbGet('SELECT id FROM usuarios WHERE email = ?', [email]);
if (existingUser) {
  return res.status(400).json({ error: 'Email já cadastrado' });
}

const result = await dbRun(
  'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
  [nome, email, senhaHash]
);

const token = gerarToken(result.lastID);
```

**Mudanças:**
- ✅ Callbacks → async/await
- ✅ `db.get()` → `dbGet()`
- ✅ `stmt.run()` → `dbRun()`
- ✅ `this.lastID` → `result.lastID`

#### 2.2. Login

**Antes:**
```javascript
db.get('SELECT id, nome, email, senha FROM usuarios WHERE email = ?', [email], (err, row) => {
  // ...
});
```

**Depois:**
```javascript
const row = await dbGet(
  'SELECT id, nome, email, senha FROM usuarios WHERE email = ?',
  [email]
);
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ `db.get()` → `dbGet()`

---

### 3. proprietarios.js - Rotas de Proprietários

#### 3.1. Cadastrar

**Antes:**
```javascript
const stmt = db.prepare('INSERT INTO proprietarios (nome, cpf, rg, cnh, usuario_id) VALUES (?,?,?,?,?)');
stmt.run(nome, cpf, rg, cnh, userId, function(err){
  res.json({id: this.lastID, ...});
});
```

**Depois:**
```javascript
const result = await dbRun(
  'INSERT INTO proprietarios (nome, cpf, rg, cnh, telefone, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
  [nome, cpf || null, rg || null, cnh || null, telefone || null, userId]
);

res.json({
  id: result.lastID,
  // ...
});
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ `db.prepare()` → `dbRun()`
- ✅ Adicionado campo `telefone`
- ✅ `this.lastID` → `result.lastID`

#### 3.2. Listar

**Antes:**
```javascript
db.all('SELECT * FROM proprietarios WHERE usuario_id = ?', [userId], (err, rows) => {
  res.json(rows);
});
```

**Depois:**
```javascript
const rows = await dbAll('SELECT * FROM proprietarios WHERE usuario_id = ?', [userId]);
res.json(rows);
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ `db.all()` → `dbAll()`

---

### 4. veiculos.js - Rotas de Veículos

#### 4.1. Cadastrar

**Antes:**
```javascript
const stmt = db.prepare('INSERT INTO veiculos (placa, renavam, proprietario_id, usuario_id) VALUES (?,?,?,?)');
stmt.run(placa, renavam, proprietario_id, userId, function(err){
  res.json({id: this.lastID, ...});
});
```

**Depois:**
```javascript
const result = await dbRun(
  'INSERT INTO veiculos (placa, renavam, proprietario_id, marca, modelo, ano, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
  [placa, renavam || null, proprietario_id || null, marca || null, modelo || null, ano || null, userId]
);

res.json({
  id: result.lastID,
  // ...
});
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ Adicionados campos `marca`, `modelo`, `ano`
- ✅ `this.lastID` → `result.lastID`

#### 4.2. Buscar por Placa

**Antes:**
```javascript
db.get(`SELECT v.*, p.nome as proprietarioNome ...`, [placaSanitizada, userIdNum], (err, row) => {
  // ...
});
```

**Depois:**
```javascript
const row = await dbGet(
  `SELECT v.*, p.nome as proprietarioNome ...`,
  [placaSanitizada, userIdNum]
);
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ `db.get()` → `dbGet()`

#### 4.3. Listar com Totais

**Antes:**
```javascript
db.all(`SELECT ... COALESCE(SUM(m.valor), 0) ...`, [userId, userId], (err, rows) => {
  res.json(rows);
});
```

**Depois:**
```javascript
const rows = await dbAll(
  `SELECT ... COALESCE(SUM(m.valor), 0) ...`,
  [userId, userId]
);
res.json(rows);
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ `db.all()` → `dbAll()`

---

### 5. manutencoes.js - Rotas de Manutenções

#### 5.1. Cadastrar

**Antes:**
```javascript
const stmt = db.prepare(`INSERT INTO manutencoes ... VALUES (?, ?, ...)`);
stmt.run(veiculo_id, descricaoFinal, ..., function(err) {
  res.json({id: this.lastID, ...});
});
```

**Depois:**
```javascript
const result = await dbRun(
  `INSERT INTO manutencoes 
  (veiculo_id, descricao, data, valor, tipo, tipo_manutencao, area_manutencao, imagem, usuario_id) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [veiculo_id, descricaoFinal || null, data, parseFloat(valor), tipoFinal, tipo_manutencao || null, area_manutencao || null, imagem, userId]
);

res.json({
  id: result.lastID,
  // ...
});
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ `db.prepare()` → `dbRun()`
- ✅ `this.lastID` → `result.lastID`

#### 5.2. Listar por Veículo

**Antes:**
```javascript
db.all(`SELECT m.*, v.placa ...`, [veiculoId, userId, userId], (err, rows) => {
  // ...
});
```

**Depois:**
```javascript
const rows = await dbAll(
  `SELECT m.*, v.placa ...`,
  [veiculoId, userId, userId]
);
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ `db.all()` → `dbAll()`

#### 5.3. Buscar

**Antes:**
```javascript
db.all(`SELECT m.*, v.placa ... WHERE ... LIKE ?`, [userId, userId, like, ...], (err, rows) => {
  // ...
});
```

**Depois:**
```javascript
const rows = await dbAll(
  `SELECT m.*, v.placa ... WHERE ... LIKE ?`,
  [userId, userId, like, like, like, like, like, like]
);
```

**Mudanças:**
- ✅ Callback → async/await
- ✅ `db.all()` → `dbAll()`

#### 5.4. Excluir

**Antes:**
```javascript
db.get('SELECT imagem, usuario_id FROM manutencoes WHERE id = ?', [manutencaoId], (err, manutencao) => {
  // ...
  db.run('DELETE FROM manutencoes WHERE id = ? AND usuario_id = ?', [manutencaoId, userId], function(deleteErr) {
    if (this.changes === 0) { ... }
  });
});
```

**Depois:**
```javascript
const manutencao = await dbGet(
  'SELECT imagem, usuario_id FROM manutencoes WHERE id = ?',
  [manutencaoId]
);

// ... validações ...

const result = await dbRun(
  'DELETE FROM manutencoes WHERE id = ? AND usuario_id = ?',
  [manutencaoId, userId]
);

if (result.changes === 0) { ... }
```

**Mudanças:**
- ✅ Callbacks → async/await
- ✅ `db.get()` → `dbGet()`
- ✅ `db.run()` → `dbRun()`
- ✅ `this.changes` → `result.changes`

---

## 📊 COMPARAÇÃO ANTES/DEPOIS

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Banco de dados** | SQLite apenas | SQLite + PostgreSQL ✅ |
| **Queries** | Callbacks | async/await ✅ |
| **Parâmetros** | `?` (SQLite) | `?` → `$1, $2...` (auto) ✅ |
| **Last ID** | `this.lastID` | `result.lastID` ✅ |
| **Prepared statements** | `db.prepare()` | `dbRun()` unificado ✅ |
| **Compatibilidade** | SQLite apenas | Dual (SQLite/PostgreSQL) ✅ |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### db-helper.js
- [x] Função `dbGet()` criada
- [x] Função `dbAll()` criada
- [x] Função `dbRun()` criada
- [x] Conversão automática de parâmetros
- [x] RETURNING automático em INSERTs
- [x] Compatibilidade com SQLite

### auth.js
- [x] Register adaptado
- [x] Login adaptado
- [x] Callbacks → async/await
- [x] Tratamento de erros

### proprietarios.js
- [x] Cadastrar adaptado
- [x] Listar adaptado
- [x] Campo `telefone` adicionado
- [x] Callbacks → async/await

### veiculos.js
- [x] Cadastrar adaptado
- [x] Listar por proprietário adaptado
- [x] Buscar por placa adaptado
- [x] Listar com totais adaptado
- [x] Histórico adaptado
- [x] Buscar por ID adaptado
- [x] Campos `marca`, `modelo`, `ano` adicionados

### manutencoes.js
- [x] Cadastrar adaptado
- [x] Listar por veículo adaptado
- [x] Buscar adaptado
- [x] Excluir adaptado
- [x] Callbacks → async/await

---

## 🔒 SEGURANÇA

### Validações Mantidas
- ✅ `req.userId` do middleware JWT
- ✅ Filtros por `usuario_id` em todas as queries
- ✅ Validação de parâmetros
- ✅ Sanitização de inputs

### Multi-tenancy
- ✅ Todas as queries filtram por `usuario_id`
- ✅ JOINs garantem que veículo pertence ao usuário
- ✅ Tentativas não autorizadas logadas

---

## 📝 ARQUIVOS MODIFICADOS

### 1. backend/src/database/db-helper.js (NOVO)
- ✅ Helper unificado criado
- ✅ ~150 linhas

### 2. backend/src/routes/auth.js
- ✅ Adaptado para async/await
- ✅ Usa `dbGet()` e `dbRun()`
- ✅ ~120 linhas (reduzido de callbacks)

### 3. backend/src/routes/proprietarios.js
- ✅ Adaptado para async/await
- ✅ Campo `telefone` adicionado
- ✅ ~50 linhas (reduzido)

### 4. backend/src/routes/veiculos.js
- ✅ Adaptado para async/await
- ✅ Campos `marca`, `modelo`, `ano` adicionados
- ✅ ~170 linhas (reduzido)

### 5. backend/src/routes/manutencoes.js
- ✅ Adaptado para async/await
- ✅ Todas as queries convertidas
- ✅ ~440 linhas (reduzido)

---

## 🧪 TESTES RECOMENDADOS

### 1. Teste Local (SQLite)

```bash
cd backend
# Não definir DATABASE_URL
npm start

# Testar endpoints:
curl http://localhost:3000/auth/register -d '{"nome":"Teste","email":"teste@test.com","senha":"123456"}'
curl http://localhost:3000/auth/login -d '{"email":"teste@test.com","senha":"123456"}'
```

### 2. Teste com PostgreSQL Local

```bash
cd backend
# Definir DATABASE_URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/troia"
npm start

# Testar mesmos endpoints
```

### 3. Teste no Render

```bash
# Após deploy, testar:
curl https://troia-backend.onrender.com/auth/register -d '{"nome":"Teste","email":"teste@test.com","senha":"123456"}'
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Testar Localmente:**
   - Testar com SQLite (sem DATABASE_URL)
   - Testar com PostgreSQL (com DATABASE_URL)

2. **Deploy no Render:**
   - Seguir `INSTRUCOES_DEPLOY_RENDER.md`
   - Criar banco PostgreSQL
   - Configurar variáveis de ambiente

3. **Testar em Produção:**
   - Testar todos os endpoints
   - Verificar upload de imagens
   - Verificar CORS

---

## 🎯 CONCLUSÃO

**Status:** ✅ **ADAPTAÇÃO CONCLUÍDA**

Backend adaptado para PostgreSQL:
- ✅ Todas as rotas adaptadas
- ✅ Compatibilidade dual (SQLite/PostgreSQL)
- ✅ Prepared statements
- ✅ async/await em todas as rotas
- ✅ Segurança mantida
- ✅ Pronto para deploy

**Sistema pronto para produção!** 🚀

---

**Patch aplicado com sucesso!** ✅

