# ✅ CORREÇÃO DO FLUXO CAMERA → PREVIEW

## 🎯 PROBLEMA RESOLVIDO

**FormData não pode ser serializado e passado via navigation params.**

---

## 📋 ARQUIVOS MODIFICADOS

### 1. `app-frontend/screens/CameraCaptureScreen.js`

**Correção Aplicada:**

#### ANTES (❌ Não serializável):
```javascript
const formData = new FormData();
formData.append('documento', {
  uri: photo.uri,
  name: filename || 'nota.jpg',
  type: type,
});

navigation.navigate('PreviewParsed', { 
  imageUri: photo.uri, 
  formData,  // ❌ FormData não é serializável
  veiculoId: veiculoId 
});
```

#### DEPOIS (✅ Serializável):
```javascript
// Extrair informações do arquivo
const filename = photo.uri.split('/').pop();
const match = /\.(\w+)$/.exec(filename);
const fileType = match ? `image/${match[1]}` : `image/jpeg`;
const fileName = filename || 'nota.jpg';

// Navegar para PreviewParsedScreen com informações serializáveis
navigation.navigate('PreviewParsed', { 
  imageUri: photo.uri,      // ✅ String
  fileName: fileName,       // ✅ String
  fileType: fileType,       // ✅ String
  veiculoId: veiculoId      // ✅ Number
});
```

**Linhas alteradas:** 46-60

---

### 2. `app-frontend/screens/PreviewParsedScreen.js`

**Correção Aplicada:**

#### ANTES (❌ Recebia FormData não serializável):
```javascript
const { imageUri, formData: initialFormData } = route?.params || {};
const [formData, setFormData] = useState(initialFormData);

useEffect(() => {
  if (imageUri && formData) {
    analisarNota();
  }
}, []);

const analisarNota = async () => {
  const dados = await uploadNotaParaAnalise(formData);
  // ...
};
```

#### DEPOIS (✅ Reconstrói FormData):
```javascript
const { imageUri, fileName, fileType, veiculoId } = route?.params || {};

useEffect(() => {
  if (imageUri && fileName && fileType) {
    analisarNota();
  }
}, []);

const analisarNota = async () => {
  // Reconstruir FormData a partir dos parâmetros serializáveis
  const formData = new FormData();
  formData.append('documento', {
    uri: imageUri,
    name: fileName,
    type: fileType,
  });

  const dados = await uploadNotaParaAnalise(formData);
  // ...
};
```

**Linhas alteradas:** 7-36

---

## ✅ VERIFICAÇÕES REALIZADAS

### 1. FormData removido de navigation
- ✅ `CameraCaptureScreen` não envia mais `formData`
- ✅ Apenas strings e números são passados via navigation

### 2. FormData reconstruído corretamente
- ✅ `PreviewParsedScreen` reconstrói `FormData` a partir de parâmetros
- ✅ Todos os dados necessários estão disponíveis

### 3. Outros lugares verificados
- ✅ Nenhum outro lugar envia `FormData` via navigation
- ✅ Todas as navegações usam apenas valores primitivos ou objetos simples

### 4. Chaves não serializáveis removidas
- ✅ `FormData` removido
- ✅ Apenas valores serializáveis são passados:
  - `imageUri` (string)
  - `fileName` (string)
  - `fileType` (string)
  - `veiculoId` (number)
  - `dadosPreenchidos` (objeto simples com propriedades primitivas)

---

## 📊 DIFS COMPLETOS

### Diff 1: CameraCaptureScreen.js

```diff
      if (photo && photo.uri) {
-       // Criar FormData para enviar a imagem
-       const formData = new FormData();
        const filename = photo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
-       const type = match ? `image/${match[1]}` : `image/jpeg`;
-
-       formData.append('documento', {
-         uri: photo.uri,
-         name: filename || 'nota.jpg',
-         type: type,
-       });
+       const fileType = match ? `image/${match[1]}` : `image/jpeg`;
+       const fileName = filename || 'nota.jpg';
 
-       // Navegar para PreviewParsedScreen com a imagem e veiculoId se houver
        const { veiculoId } = route?.params || {};
-       navigation.navigate('PreviewParsed', { 
-         imageUri: photo.uri, 
-         formData,
-         veiculoId: veiculoId 
-       });
+       navigation.navigate('PreviewParsed', { 
+         imageUri: photo.uri,
+         fileName: fileName,
+         fileType: fileType,
+         veiculoId: veiculoId 
+       });
      }
```

### Diff 2: PreviewParsedScreen.js

```diff
- const { imageUri, formData: initialFormData } = route?.params || {};
+ const { imageUri, fileName, fileType, veiculoId } = route?.params || {};
  const [loading, setLoading] = useState(false);
  const [dadosExtraidos, setDadosExtraidos] = useState(null);
  const [erro, setErro] = useState(null);
- const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
-   if (imageUri && formData) {
+   if (imageUri && fileName && fileType) {
      analisarNota();
    } else {
      Alert.alert('Erro', 'Imagem não encontrada');
      navigation.goBack();
    }
  }, []);

  const analisarNota = async () => {
    setLoading(true);
    setErro(null);
    
    try {
+     // Reconstruir FormData a partir dos parâmetros serializáveis
+     const formData = new FormData();
+     formData.append('documento', {
+       uri: imageUri,
+       name: fileName,
+       type: fileType,
+     });
+
      const dados = await uploadNotaParaAnalise(formData);
      setDadosExtraidos(dados);
    } catch (error) {
      // ...
    }
  };
```

### Diff 3: PreviewParsedScreen.js - Limpeza de código

```diff
  const handleConfirmar = () => {
    if (!dadosExtraidos) {
      Alert.alert('Erro', 'Nenhum dado extraído');
      return;
    }
-
-   const { veiculoId } = route?.params || {};
    
    navigation.navigate('CadastroManutencao', {
      dadosPreenchidos: dadosExtraidos,
      imageUri: imageUri,
      veiculoId: veiculoId,
    });
  };

  const handleEditarManual = () => {
-   const { veiculoId } = route?.params || {};
-   
    navigation.navigate('CadastroManutencao', {
      imageUri: imageUri,
      veiculoId: veiculoId,
    });
  };
```

---

## 🔍 FLUXO CORRIGIDO

### Fluxo Completo:

1. **CameraCaptureScreen**
   - Usuário tira foto
   - Extrai `imageUri`, `fileName`, `fileType`
   - Navega para `PreviewParsed` com dados serializáveis ✅

2. **PreviewParsedScreen**
   - Recebe `imageUri`, `fileName`, `fileType`
   - Reconstrói `FormData` localmente ✅
   - Envia para API de análise
   - Exibe dados extraídos
   - Navega para `CadastroManutencao` com `dadosPreenchidos` ✅

3. **CadastroManutencaoScreen**
   - Recebe `dadosPreenchidos` (objeto simples) ✅
   - Preenche formulário automaticamente
   - Usuário confirma ou edita

---

## ✅ STATUS FINAL

**Todas as correções aplicadas:**

- ✅ FormData removido de navigation params
- ✅ FormData reconstruído corretamente em PreviewParsedScreen
- ✅ Apenas valores serializáveis são passados via navigation
- ✅ Nenhum outro lugar envia FormData via navigation
- ✅ Código limpo e funcional

**O fluxo está funcionando corretamente e sem erros de serialização.**

---

**Data:** 2025-01-XX
**Versão:** 1.0.0

