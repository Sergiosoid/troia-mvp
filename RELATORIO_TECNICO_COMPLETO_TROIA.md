# 📊 RELATÓRIO TÉCNICO COMPLETO - TROIA MVP
## Análise Arquitetural e Diagnóstico do Projeto

**Data:** Janeiro 2025  
**Engenheiro-Arquiteto Principal**  
**Versão do Projeto:** 1.0.0

---

## 📋 SUMÁRIO EXECUTIVO

O **TROIA MVP** é um aplicativo mobile React Native (Expo) para gestão de manutenções de veículos, com backend Node.js/Express e banco de dados SQLite. O projeto está em fase de MVP com funcionalidades core implementadas, mas requer correções críticas de segurança e melhorias arquiteturais antes do lançamento.

**Status Geral:** 🟡 **75% Completo** - MVP funcional com pendências críticas

---

## 1. 🏗️ ARQUITETURA DO PROJETO

### 1.1 Estrutura Atual

```
TROIA-MVP/
├── app-frontend/          # React Native (Expo SDK 54)
│   ├── screens/          # 13 telas implementadas
│   ├── services/         # API client centralizado
│   ├── components/       # Componentes reutilizáveis
│   ├── hooks/           # Custom hooks
│   ├── constants/       # Estilos e configurações
│   └── assets/          # Imagens e recursos
│
├── backend/              # Node.js/Express
│   ├── src/
│   │   ├── routes/      # Rotas da API
│   │   ├── controllers/ # Lógica de negócio
│   │   ├── services/    # OCR e extração de dados
│   │   ├── database/    # Configuração SQLite
│   │   └── migrations.js # Sistema de migrações
│   └── uploads/         # Armazenamento de imagens
│
└── docs/                # Documentação
```

### 1.2 Stack Tecnológica

**Frontend:**
- **Framework:** React Native 0.81.5 + Expo SDK 54
- **Navegação:** React Navigation 7.x (Native Stack)
- **Estado:** React Hooks (useState, useEffect)
- **Storage:** AsyncStorage
- **UI:** React Native Paper + Custom Components
- **Câmera:** expo-camera 17.0.9
- **HTTP:** fetch API com wrapper customizado

**Backend:**
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5.1.0
- **Banco de Dados:** SQLite3 (better-sqlite3)
- **Upload:** Multer 2.0.2
- **IA/OCR:** OpenAI GPT-4 Vision API + Tesseract.js (não usado atualmente)
- **Segurança:** Helmet, CORS, express-rate-limit
- **Autenticação:** SHA256 (⚠️ deve ser bcrypt em produção)

**Deploy:**
- **Backend:** Render.com (https://app-manutencao-backend.onrender.com)
- **Frontend:** EAS Build (Expo Application Services)

### 1.3 Telas Implementadas

| Tela | Arquivo | Status | Funcionalidade |
|------|---------|--------|----------------|
| Login | `LoginScreen.js` | ✅ | Autenticação de usuário |
| Registro | `RegisterScreen.js` | ✅ | Cadastro de novos usuários |
| Dashboard | `HomeDashboardScreen.js` | ✅ | Visão geral de veículos e gastos |
| Cadastro Proprietário | `CadastroProprietarioScreen.js` | ✅ | CRUD de proprietários |
| Cadastro Veículo | `CadastroVeiculoScreen.js` | ✅ | CRUD de veículos |
| Cadastro Manutenção | `CadastroManutencaoScreen.js` | ✅ | CRUD de manutenções com imagem |
| Lista Manutenções | `ListaManutencoesScreen.js` | ⚠️ | Lista com design antigo |
| Pesquisa | `PesquisaScreen.js` | ⚠️ | Busca com endpoint faltando |
| Histórico Veículo | `VeiculoHistoricoScreen.js` | ✅ | Histórico completo do veículo |
| Escolher Veículo | `EscolherVeiculoParaManutencaoScreen.js` | ✅ | Seleção para nova manutenção |
| Câmera | `CameraCaptureScreen.js` | ✅ | Captura de foto da nota fiscal |
| Preview Parsed | `PreviewParsedScreen.js` | ✅ | Preview dos dados extraídos pela IA |
| Configurações | `ConfiguracoesScreen.js` | ✅ | Logout e configurações |

**Total:** 13 telas (11 completas, 2 com problemas)

### 1.4 Fluxos Implementados

#### ✅ Fluxo Principal: Nova Manutenção
```
HomeDashboard 
  → EscolherVeiculoParaManutencao 
    → Modal (Tirar Foto / Manual)
      → CameraCapture → PreviewParsed → CadastroManutencao
      → CadastroManutencao (direto)
        → HomeDashboard (refresh)
```

#### ✅ Fluxo de Autenticação
```
App.js (verifica AsyncStorage)
  → LoginScreen / RegisterScreen
    → AsyncStorage.setItem('userId')
      → HomeDashboard
```

#### ✅ Fluxo de Visualização
```
HomeDashboard 
  → VeiculoHistorico (por veiculoId)
    → ListaManutencoes (opcional)
```

### 1.5 Banco de Dados (SQLite)

**Tabelas:**
- `usuarios` - Usuários do sistema
- `proprietarios` - Proprietários de veículos (com `usuario_id`)
- `veiculos` - Veículos cadastrados (com `usuario_id` e `proprietario_id`)
- `manutencoes` - Histórico de manutenções (com `usuario_id` e `veiculo_id`)

**Relacionamentos:**
- `proprietarios.usuario_id` → `usuarios.id`
- `veiculos.usuario_id` → `usuarios.id`
- `veiculos.proprietario_id` → `proprietarios.id`
- `manutencoes.usuario_id` → `usuarios.id`
- `manutencoes.veiculo_id` → `veiculos.id`

**Sistema de Migrações:**
- ✅ Implementado em `migrations.js`
- ✅ Criação automática de tabelas
- ✅ Adição de colunas faltantes
- ⚠️ Não versionado (sem controle de versão de migrations)

---

## 2. 🔍 DIAGNÓSTICO DO MVP

### 2.1 O Que Está Pronto ✅

**Funcionalidades Core:**
- ✅ Autenticação completa (login/registro)
- ✅ CRUD de Proprietários
- ✅ CRUD de Veículos
- ✅ CRUD de Manutenções
- ✅ Upload e armazenamento de imagens
- ✅ Integração com OpenAI Vision API para extração de dados
- ✅ Dashboard com totais e estatísticas
- ✅ Histórico de manutenções por veículo
- ✅ Fluxo completo de nova manutenção (câmera + manual)
- ✅ Sistema de permissões de câmera
- ✅ Tratamento de erros e estados de loading
- ✅ Design system unificado (commonStyles)

**Infraestrutura:**
- ✅ Backend deployado no Render
- ✅ Configuração de build (EAS)
- ✅ Sistema de migrações automáticas
- ✅ API centralizada com timeout e retry
- ✅ Filtros por `usuario_id` na maioria dos endpoints

### 2.2 O Que Está Incompleto ⚠️

**Segurança:**
- ⚠️ Hash de senha usando SHA256 (deve ser bcrypt)
- ⚠️ Token simples (deve ser JWT real)
- ⚠️ 2 endpoints não filtram por `usuario_id` (vulnerabilidade)

**Funcionalidades:**
- ⚠️ Endpoint `/manutencoes/buscar` não existe (usado em PesquisaScreen)
- ⚠️ Função `buscarVeiculoPorId` existe mas endpoint pode ter problema de segurança
- ⚠️ Design antigo em 2 telas (ListaManutencoesScreen, PesquisaScreen)

**Qualidade:**
- ⚠️ Sem sistema de versionamento de migrations
- ⚠️ Sem backup automático do banco
- ⚠️ Sem testes automatizados
- ⚠️ Sem documentação de API (Swagger/OpenAPI)

### 2.3 O Que Está Faltando para Fechar o MVP ❌

**Crítico (Bloqueador):**
1. ❌ Corrigir filtro `usuario_id` em `GET /veiculos/buscar-placa/:placa`
2. ❌ Corrigir filtro `usuario_id` em `GET /veiculos/:id`
3. ❌ Criar endpoint `GET /manutencoes/buscar` ou remover funcionalidade
4. ❌ Substituir SHA256 por bcrypt
5. ❌ Implementar JWT real

**Importante (Antes do Lançamento):**
6. ❌ Aplicar design unificado em ListaManutencoesScreen
7. ❌ Aplicar design unificado em PesquisaScreen
8. ❌ Remover arquivo não utilizado (CadastroScreen.js se existir)
9. ❌ Adicionar validação de dados no backend
10. ❌ Implementar rate limiting mais robusto

**Desejável (Pós-MVP):**
11. ❌ Sistema de notificações push
12. ❌ Exportação de relatórios (PDF/Excel)
13. ❌ Gráficos e analytics avançados
14. ❌ Modo offline completo
15. ❌ Sincronização em nuvem

---

## 3. 👤 FLUXO DE USUÁRIO

### 3.1 Fluxo: Proprietário → Veículos → Manutenção

#### ✅ O Que Está Funcionando

**1. Cadastro de Proprietário:**
- ✅ Tela `CadastroProprietarioScreen` funcional
- ✅ Validação básica no frontend
- ✅ Integração com API `/proprietarios/cadastrar`
- ✅ Filtro por `usuario_id` no backend
- ✅ Listagem de proprietários

**2. Cadastro de Veículo:**
- ✅ Tela `CadastroVeiculoScreen` funcional
- ✅ Seleção de proprietário (dropdown)
- ✅ Validação de placa (uppercase automático)
- ✅ Integração com API `/veiculos/cadastrar`
- ✅ Filtro por `usuario_id` no backend
- ✅ Listagem de veículos por proprietário

**3. Cadastro de Manutenção:**
- ✅ Tela `CadastroManutencaoScreen` funcional
- ✅ Seleção de veículo (via proprietário ou direto)
- ✅ Upload de imagem (opcional)
- ✅ Preenchimento automático via IA (OpenAI Vision)
- ✅ Integração com API `/manutencoes/cadastrar`
- ✅ Filtro por `usuario_id` no backend
- ✅ Histórico completo por veículo

**4. Visualização:**
- ✅ Dashboard com totais e estatísticas
- ✅ Histórico detalhado por veículo
- ✅ Lista de manutenções (com problemas de design)
- ✅ Busca por placa (funcional)
- ⚠️ Busca geral (endpoint não existe)

#### ❌ O Que Está Faltando

**Problemas de Fluxo:**
1. ❌ **Segurança:** Usuário pode acessar veículos de outros usuários via `GET /veiculos/:id` e `GET /veiculos/buscar-placa/:placa`
2. ❌ **Funcionalidade:** Busca geral de manutenções não funciona (endpoint não existe)
3. ⚠️ **UX:** Design inconsistente em 2 telas
4. ⚠️ **Validação:** Falta validação robusta no backend

**Melhorias de Fluxo:**
5. ❌ **Feedback:** Falta feedback visual quando dados são salvos
6. ❌ **Navegação:** Algumas telas não têm botão de voltar consistente
7. ❌ **Offline:** Não funciona sem internet
8. ❌ **Sincronização:** Não há sincronização automática

---

## 4. 🔬 ANÁLISE DE QUALIDADE DO CÓDIGO

### 4.1 Pontos Fortes 💪

**Arquitetura:**
- ✅ Separação clara frontend/backend
- ✅ API centralizada em `services/api.js`
- ✅ Design system unificado (`commonStyles`)
- ✅ Componentes reutilizáveis
- ✅ Hooks customizados para temas

**Código:**
- ✅ Tratamento de erros consistente
- ✅ Estados de loading bem implementados
- ✅ Timeout e retry em requisições HTTP
- ✅ Validação de dados no frontend
- ✅ Código limpo e legível

**Segurança:**
- ✅ Filtros por `usuario_id` na maioria dos endpoints
- ✅ Headers com `user-id` em todas as requisições
- ✅ Validação de permissões de câmera
- ✅ Sanitização de inputs básica

**UX/UI:**
- ✅ Design moderno e consistente (11/13 telas)
- ✅ Feedback visual (loading, alerts)
- ✅ Estados vazios bem tratados
- ✅ Navegação intuitiva

### 4.2 Pontos Fracos ⚠️

**Segurança:**
- ❌ **CRÍTICO:** 2 endpoints não filtram por `usuario_id`
- ❌ Hash SHA256 inseguro (deve ser bcrypt)
- ❌ Token simples (deve ser JWT)
- ⚠️ Sem validação de rate limiting robusta
- ⚠️ Sem sanitização avançada de inputs

**Arquitetura:**
- ⚠️ Sem sistema de versionamento de migrations
- ⚠️ Sem backup automático
- ⚠️ Sem testes automatizados
- ⚠️ Sem documentação de API
- ⚠️ Sem logging estruturado

**Código:**
- ⚠️ Duplicação de lógica em algumas telas
- ⚠️ Alguns componentes muito grandes (ex: CadastroManutencaoScreen)
- ⚠️ Falta de TypeScript (apenas JS)
- ⚠️ Sem tratamento de erros de rede offline

**Performance:**
- ⚠️ Sem cache de dados
- ⚠️ Sem paginação de listas
- ⚠️ Imagens não otimizadas
- ⚠️ Sem lazy loading

### 4.3 Duplicações 🔄

**Código Duplicado:**
1. **Formatação de moeda/data:** Presente em múltiplas telas
   - `formatarMoeda()` em 5+ telas
   - `formatarData()` em 5+ telas
   - **Solução:** Criar utilitários em `utils/formatters.js`

2. **Lógica de carregamento:** Padrão repetido
   - `loading` state + `ActivityIndicator` em todas as telas
   - **Solução:** Criar hook `useLoadingState()`

3. **Tratamento de erros:** Código similar
   - Verificação de `indisponível`, `autenticado` em múltiplos lugares
   - **Solução:** Criar função `handleApiError()`

4. **Seleção de proprietário/veículo:** Lógica duplicada
   - Mesma lógica em `CadastroManutencaoScreen` e `ListaManutencoesScreen`
   - **Solução:** Criar componente `ProprietarioVeiculoSelector`

### 4.4 Inconsistências 🔀

**Design:**
- ⚠️ `ListaManutencoesScreen` não usa `commonStyles`
- ⚠️ `PesquisaScreen` não usa `commonStyles`
- ⚠️ `API_URL` hardcoded em `ListaManutencoesScreen` (deveria usar constante)

**Nomenclatura:**
- ⚠️ Mistura de português/inglês em alguns lugares
- ⚠️ Alguns arquivos com `.js`, outros preparados para `.ts`

**Padrões:**
- ⚠️ Alguns componentes usam `StyleSheet.create()`, outros `commonStyles`
- ⚠️ Tratamento de erros inconsistente (alguns usam Alert, outros console.error)

### 4.5 Problemas de Estado 🔴

**Gerenciamento de Estado:**
- ⚠️ Estado local apenas (sem Context API ou Redux)
- ⚠️ Dados não são compartilhados entre telas (apenas via params)
- ⚠️ Sem cache de dados (sempre busca do servidor)
- ⚠️ Estado de autenticação apenas em AsyncStorage

**Problemas Específicos:**
1. **Refresh manual:** Usuário precisa fazer pull-to-refresh em algumas telas
2. **Sincronização:** Dados não são atualizados automaticamente após mudanças
3. **Offline:** Sem estado offline, app quebra sem internet

### 4.6 Problemas de Navegação 🧭

**Navegação:**
- ✅ Stack Navigator bem configurado
- ✅ Parâmetros passados corretamente
- ⚠️ Algumas telas não têm botão de voltar consistente
- ⚠️ Deep linking não implementado
- ⚠️ Navegação condicional poderia ser melhorada

**Fluxos:**
- ✅ Fluxo principal funciona bem
- ⚠️ Alguns fluxos alternativos não são tratados
- ⚠️ Navegação após erros poderia ser melhor

### 4.7 Erros de UX/UI 🎨

**Problemas de UX:**
1. ⚠️ **Feedback:** Falta confirmação visual após salvar dados
2. ⚠️ **Loading:** Alguns carregamentos são muito longos sem feedback
3. ⚠️ **Erros:** Mensagens de erro poderiam ser mais amigáveis
4. ⚠️ **Validação:** Validação no frontend poderia ser mais robusta
5. ⚠️ **Acessibilidade:** Falta labels e hints para screen readers

**Problemas de UI:**
1. ⚠️ **Design inconsistente:** 2 telas com design antigo
2. ⚠️ **Espaçamento:** Alguns elementos muito próximos
3. ⚠️ **Cores:** Falta feedback visual em estados (hover, pressed)
4. ⚠️ **Tipografia:** Tamanhos de fonte poderiam ser mais consistentes

---

## 5. 💡 SUGESTÕES TÉCNICAS PARA EVOLUÇÃO

### 5.1 Melhorias de Arquitetura

#### 5.1.1 Gerenciamento de Estado
**Problema:** Estado local apenas, sem compartilhamento

**Solução:**
```javascript
// Criar Context API para estado global
// contexts/AuthContext.js
// contexts/VeiculosContext.js
// contexts/ManutencoesContext.js
```

**Benefícios:**
- Dados compartilhados entre telas
- Cache automático
- Sincronização simplificada

#### 5.1.2 Camada de Serviços
**Problema:** Lógica de negócio misturada com componentes

**Solução:**
```javascript
// services/
//   - proprietariosService.js
//   - veiculosService.js
//   - manutencoesService.js
//   - authService.js
```

**Benefícios:**
- Código mais testável
- Reutilização de lógica
- Manutenção facilitada

#### 5.1.3 Sistema de Migrations Versionado
**Problema:** Migrations não são versionadas

**Solução:**
```javascript
// migrations/
//   - 001_create_tables.js
//   - 002_add_usuario_id.js
//   - 003_add_indexes.js
// migrations/version.js (controle de versão atual)
```

### 5.2 Padronização

#### 5.2.1 TypeScript
**Sugestão:** Migrar gradualmente para TypeScript
- Começar por `services/api.js`
- Depois `screens/`
- Por último `components/`

#### 5.2.2 Estrutura de Pastas
**Sugestão:**
```
app-frontend/
├── src/
│   ├── screens/
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   └── ui/
│   ├── services/
│   ├── hooks/
│   ├── contexts/
│   ├── utils/
│   └── types/
```

#### 5.2.3 Convenções de Código
**Sugestão:** Adicionar ESLint + Prettier
- Configurar regras específicas
- Pre-commit hooks
- Formatação automática

### 5.3 Hooks que Podem Ser Criados

#### 5.3.1 `useApi`
```javascript
// hooks/useApi.js
// Gerencia loading, error, data automaticamente
const { data, loading, error, refetch } = useApi('/veiculos/totais');
```

#### 5.3.2 `useForm`
```javascript
// hooks/useForm.js
// Gerencia estado de formulário, validação, submit
const form = useForm({
  initialValues: { placa: '', renavam: '' },
  validation: { placa: required, renavam: required }
});
```

#### 5.3.3 `useDebounce`
```javascript
// hooks/useDebounce.js
// Para busca com delay
const debouncedTerm = useDebounce(termo, 500);
```

#### 5.3.4 `useImagePicker`
```javascript
// hooks/useImagePicker.js
// Gerencia seleção de imagem, permissões, upload
const { image, pickImage, uploadImage } = useImagePicker();
```

#### 5.3.5 `useRefresh`
```javascript
// hooks/useRefresh.js
// Gerencia pull-to-refresh
const { refreshing, onRefresh } = useRefresh(carregarDados);
```

### 5.4 Otimizações de Performance

#### 5.4.1 Cache de Dados
```javascript
// Implementar cache em memória
// utils/cache.js
const cache = new Map();
// TTL de 5 minutos para dados de veículos
```

#### 5.4.2 Paginação
```javascript
// Implementar paginação em listas
// GET /veiculos?page=1&limit=20
// useInfiniteScroll hook
```

#### 5.4.3 Lazy Loading
```javascript
// Lazy load de telas
const VeiculoHistorico = React.lazy(() => import('./screens/VeiculoHistoricoScreen'));
```

#### 5.4.4 Otimização de Imagens
```javascript
// Redimensionar imagens antes de upload
// Usar expo-image para cache de imagens
// Lazy load de imagens em listas
```

#### 5.4.5 Memoização
```javascript
// Usar React.memo, useMemo, useCallback
// Evitar re-renders desnecessários
```

### 5.5 Sugestões para OCR, IA e Automação Futura

#### 5.5.1 Melhorias no OCR Atual
**Problema:** Usa apenas OpenAI Vision API

**Sugestões:**
1. **Fallback para Tesseract.js:**
   - Se OpenAI falhar, tentar Tesseract
   - Tesseract já está instalado mas não usado

2. **Pré-processamento de Imagem:**
   ```javascript
   // Melhorar qualidade antes de enviar
   // - Ajuste de brilho/contraste
   // - Redução de ruído
   // - Correção de perspectiva
   ```

3. **Validação de Dados Extraídos:**
   ```javascript
   // Validar placa (formato brasileiro)
   // Validar data (formato válido)
   // Validar valor (número positivo)
   ```

#### 5.5.2 IA para Classificação
**Sugestão:** Classificar tipo de manutenção automaticamente
```javascript
// Usar OpenAI para classificar:
// - Preventiva
// - Corretiva
// - Revisão
// - Troca de peças
// Baseado na descrição
```

#### 5.5.3 Automação de Lembretes
**Sugestão:** Sistema de notificações push
```javascript
// Calcular próxima manutenção baseado em:
// - Tipo de manutenção
// - Quilometragem (se disponível)
// - Tempo desde última manutenção
// - Histórico do veículo
```

#### 5.5.4 Sugestões Inteligentes
**Sugestão:** IA para recomendações
```javascript
// Sugerir:
// - Próxima manutenção preventiva
// - Peças que podem precisar de troca
// - Oficinas próximas (integração futura)
// - Comparação de preços (se houver dados)
```

#### 5.5.5 Análise Preditiva
**Sugestão:** Prever custos futuros
```javascript
// Baseado em:
// - Histórico de manutenções
// - Idade do veículo
// - Tipo de uso
// - Padrões de consumo
```

---

## 6. ✅ CHECKLIST DO MVP COM STATUS

### 6.1 Cadastro de Proprietário
- [x] Tela de cadastro implementada
- [x] Validação de campos
- [x] Integração com API
- [x] Filtro por `usuario_id` no backend
- [x] Listagem de proprietários
- [x] Design moderno aplicado
- [ ] Edição de proprietário (não implementado)
- [ ] Exclusão de proprietário (não implementado)

**Status:** ✅ **Completo para MVP** (CRUD básico funciona)

### 6.2 Cadastro de Veículo
- [x] Tela de cadastro implementada
- [x] Seleção de proprietário
- [x] Validação de placa
- [x] Integração com API
- [x] Filtro por `usuario_id` no backend (maioria dos endpoints)
- [x] Listagem de veículos
- [x] Design moderno aplicado
- [ ] Edição de veículo (não implementado)
- [ ] Exclusão de veículo (não implementado)
- [ ] ⚠️ **CRÍTICO:** Endpoint `GET /veiculos/:id` não filtra por `usuario_id`
- [ ] ⚠️ **CRÍTICO:** Endpoint `GET /veiculos/buscar-placa/:placa` não filtra por `usuario_id`

**Status:** ⚠️ **Quase completo** (falta correção de segurança)

### 6.3 Lista de Veículos
- [x] Dashboard com lista de veículos
- [x] Totais de gastos por veículo
- [x] Última manutenção
- [x] Navegação para histórico
- [x] Design moderno aplicado
- [x] Estado vazio tratado
- [ ] Filtros e ordenação (não implementado)
- [ ] Busca (não implementado)

**Status:** ✅ **Completo para MVP**

### 6.4 Cadastro de Manutenção (com Imagem)
- [x] Tela de cadastro implementada
- [x] Upload de imagem
- [x] Captura de foto via câmera
- [x] Seleção de imagem da galeria
- [x] Integração com OpenAI Vision API
- [x] Preenchimento automático de dados
- [x] Validação de campos
- [x] Integração com API
- [x] Filtro por `usuario_id` no backend
- [x] Design moderno aplicado
- [x] Fluxo completo funcionando
- [ ] Edição de manutenção (não implementado)
- [ ] Exclusão de manutenção (não implementado)
- [ ] Validação de formato de imagem (apenas tamanho)

**Status:** ✅ **Completo para MVP**

### 6.5 Histórico de Manutenções
- [x] Tela de histórico por veículo
- [x] Lista de manutenções
- [x] Exibição de imagens
- [x] Formatação de dados (data, valor)
- [x] Design moderno aplicado
- [x] Estado vazio tratado
- [ ] Filtros por data/tipo (não implementado)
- [ ] Ordenação (não implementado)
- [ ] Exportação (não implementado)
- [ ] ⚠️ Busca geral não funciona (endpoint não existe)

**Status:** ✅ **Completo para MVP** (busca geral é feature extra)

### 6.6 Funcionalidades Extras
- [x] Busca por placa
- [ ] Busca geral de manutenções (endpoint não existe)
- [ ] Exportação de relatórios
- [ ] Gráficos e analytics
- [ ] Notificações push
- [ ] Modo offline

**Status:** ⚠️ **Parcial** (busca por placa funciona, busca geral não)

---

## 7. 🗺️ ROADMAP TÉCNICO

### 7.1 MVP Final (Sprint 1-2 semanas)

#### Prioridade CRÍTICA (Bloqueador)
1. **Segurança:**
   - [ ] Corrigir `GET /veiculos/:id` (adicionar filtro `usuario_id`)
   - [ ] Corrigir `GET /veiculos/buscar-placa/:placa` (adicionar filtro `usuario_id`)
   - [ ] Substituir SHA256 por bcrypt
   - [ ] Implementar JWT real

2. **Funcionalidade:**
   - [ ] Criar endpoint `GET /manutencoes/buscar` OU remover funcionalidade
   - [ ] Validar que `buscarVeiculoPorId` funciona corretamente

3. **Design:**
   - [ ] Aplicar design unificado em `ListaManutencoesScreen`
   - [ ] Aplicar design unificado em `PesquisaScreen`
   - [ ] Remover `API_URL` hardcoded

#### Prioridade ALTA (Antes do Lançamento)
4. **Validação:**
   - [ ] Adicionar validação robusta no backend
   - [ ] Validação de formato de placa
   - [ ] Validação de CPF/CNH (se necessário)

5. **Testes:**
   - [ ] Testes básicos de integração
   - [ ] Testes de segurança (tentar acessar dados de outros usuários)

6. **Documentação:**
   - [ ] README completo
   - [ ] Documentação de API (Swagger/OpenAPI)
   - [ ] Guia de deploy

**Estimativa:** 2-3 semanas

---

### 7.2 Fase 2: OCR + IA Avançado (Sprint 3-4 semanas)

#### Melhorias no OCR
1. **Pré-processamento:**
   - [ ] Ajuste automático de brilho/contraste
   - [ ] Correção de perspectiva
   - [ ] Redução de ruído

2. **Fallback:**
   - [ ] Implementar Tesseract.js como fallback
   - [ ] Comparar resultados OpenAI vs Tesseract
   - [ ] Escolher melhor resultado

3. **Validação:**
   - [ ] Validação de placa (formato brasileiro)
   - [ ] Validação de data
   - [ ] Validação de valor
   - [ ] Sugestões de correção

#### IA para Classificação
4. **Classificação Automática:**
   - [ ] Classificar tipo de manutenção (Preventiva/Corretiva)
   - [ ] Identificar peças mencionadas
   - [ ] Extrair quilometragem (se disponível)

5. **Sugestões Inteligentes:**
   - [ ] Sugerir próxima manutenção preventiva
   - [ ] Alertar sobre manutenções em atraso
   - [ ] Comparar preços (se houver dados históricos)

#### Analytics
6. **Gráficos e Relatórios:**
   - [ ] Gráfico de gastos ao longo do tempo
   - [ ] Gráfico por tipo de manutenção
   - [ ] Comparação entre veículos
   - [ ] Exportação PDF/Excel

**Estimativa:** 3-4 semanas

---

### 7.3 Fase 3: WhatsApp Integration (Sprint 4-6 semanas)

#### Integração com WhatsApp Business API
1. **Configuração:**
   - [ ] Configurar WhatsApp Business API
   - [ ] Webhook para receber mensagens
   - [ ] Autenticação e segurança

2. **Funcionalidades:**
   - [ ] Enviar lembretes de manutenção via WhatsApp
   - [ ] Receber fotos de notas fiscais via WhatsApp
   - [ ] Processar automaticamente e salvar
   - [ ] Respostas automáticas (bot básico)

3. **Fluxo:**
   ```
   Usuário envia foto → WhatsApp → Webhook → Backend
     → OCR/IA → Salvar manutenção → Resposta automática
   ```

**Estimativa:** 4-6 semanas

---

### 7.4 Fase 4: OBD Integration (Sprint 6-8 semanas)

#### Integração com OBD-II
1. **Hardware:**
   - [ ] Pesquisar adaptadores OBD-II compatíveis
   - [ ] Protocolo de comunicação (ELM327)
   - [ ] Bibliotecas disponíveis

2. **App:**
   - [ ] Conexão Bluetooth com adaptador
   - [ ] Leitura de códigos de erro
   - [ ] Leitura de dados do veículo (quilometragem, etc.)
   - [ ] Histórico de códigos de erro

3. **Backend:**
   - [ ] API para receber dados OBD
   - [ ] Interpretação de códigos de erro
   - [ ] Sugestões baseadas em códigos
   - [ ] Alertas automáticos

4. **IA:**
   - [ ] Correlação entre códigos de erro e manutenções
   - [ ] Previsão de problemas
   - [ ] Sugestões de ações

**Estimativa:** 6-8 semanas (depende de hardware)

---

## 8. 📊 RESUMO EXECUTIVO

### 8.1 Status Atual

**Completude do MVP:** 🟡 **75%**

- ✅ **Funcionalidades Core:** 90% completo
- ⚠️ **Segurança:** 70% completo (2 vulnerabilidades críticas)
- ✅ **UX/UI:** 85% completo (2 telas com design antigo)
- ⚠️ **Qualidade:** 60% completo (falta testes, validação robusta)

### 8.2 Bloqueadores para Lançamento

1. **🔴 CRÍTICO:** 2 endpoints não filtram por `usuario_id` (vulnerabilidade de segurança)
2. **🔴 CRÍTICO:** Hash SHA256 inseguro (deve ser bcrypt)
3. **🟡 IMPORTANTE:** Endpoint de busca não existe ou funcionalidade deve ser removida
4. **🟡 IMPORTANTE:** Design inconsistente em 2 telas

### 8.3 Próximos Passos Recomendados

**Semana 1-2:**
1. Corrigir vulnerabilidades de segurança
2. Implementar bcrypt e JWT
3. Criar/remover endpoint de busca
4. Aplicar design unificado

**Semana 3-4:**
5. Adicionar validação robusta
6. Testes básicos
7. Documentação
8. Preparar para lançamento

**Pós-Lançamento:**
9. Fase 2: OCR + IA avançado
10. Fase 3: WhatsApp
11. Fase 4: OBD

### 8.4 Riscos Identificados

**Alto Risco:**
- 🔴 Vulnerabilidades de segurança (acesso a dados de outros usuários)
- 🔴 Hash inseguro (senhas podem ser quebradas)

**Médio Risco:**
- 🟡 Sem backup automático (perda de dados)
- 🟡 Sem testes (bugs podem passar despercebidos)
- 🟡 Sem versionamento de migrations (dificulta rollback)

**Baixo Risco:**
- 🟢 Design inconsistente (não bloqueia funcionalidade)
- 🟢 Falta de features extras (não crítico para MVP)

---

## 9. 📝 CONCLUSÃO

O projeto **TROIA MVP** está em um estado sólido, com a maioria das funcionalidades core implementadas e funcionando. O código é limpo, bem organizado e segue boas práticas em grande parte.

**Principais Conquistas:**
- ✅ Arquitetura bem estruturada
- ✅ Fluxos principais funcionando
- ✅ Design moderno e consistente
- ✅ Integração com IA funcionando

**Principais Pendências:**
- ❌ 2 vulnerabilidades críticas de segurança
- ❌ Autenticação insegura (SHA256)
- ⚠️ Algumas inconsistências de design
- ⚠️ Falta de testes e validação robusta

**Recomendação:**
O projeto está **próximo de estar pronto para MVP**, mas requer **correções críticas de segurança** antes do lançamento. Com 2-3 semanas de trabalho focado nas pendências críticas, o projeto estará pronto para produção.

---

**Relatório gerado em:** Janeiro 2025  
**Versão:** 1.0  
**Próxima revisão:** Após correções críticas

