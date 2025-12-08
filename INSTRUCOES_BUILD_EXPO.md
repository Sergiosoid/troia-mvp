# 📱 INSTRUÇÕES - Build Expo TROIA
## Guia Completo para Build e Deploy

**Data:** Janeiro 2025  
**Status:** ✅ **CONFIGURAÇÃO PRONTA**

---

## 📋 PRÉ-REQUISITOS

### 1. Instalar Dependências Globais
```bash
npm install -g eas-cli
npm install -g expo-cli
```

### 2. Login no Expo
```bash
eas login
```

### 3. Verificar Configuração
```bash
cd app-frontend
cat app.json | grep -A 5 "name"
# Deve mostrar: "name": "TROIA"
```

---

## 🔧 CONFIGURAÇÃO INICIAL

### 1. Verificar Arquivos de Configuração

**app.json:**
- ✅ Nome: "TROIA"
- ✅ Slug: "troia-mvp"
- ✅ Package: "com.troia.mvp"
- ✅ Permissões configuradas

**eas.json:**
- ✅ Profiles: production, development, preview
- ✅ Configuração de Android e iOS

### 2. Verificar Ícones e Splash

**Ícones necessários:**
- `./assets/images/icon.png` ✅
- `./assets/images/android-icon-foreground.png` ✅
- `./assets/images/android-icon-background.png` ✅
- `./assets/images/android-icon-monochrome.png` ✅
- `./assets/images/splash.png` ✅
- `./assets/images/splash-icon.png` ✅

**Verificar:**
```bash
cd app-frontend
ls -la assets/images/
```

---

## 🏗️ BUILD LOCAL (Desenvolvimento)

### Android

**1. Prebuild:**
```bash
cd app-frontend
npx expo prebuild --platform android
```

**2. Build e Run:**
```bash
npx expo run:android
```

**Ou usar Android Studio:**
```bash
cd android
./gradlew assembleDebug
```

### iOS

**1. Prebuild:**
```bash
cd app-frontend
npx expo prebuild --platform ios
```

**2. Build e Run:**
```bash
npx expo run:ios
```

**Ou usar Xcode:**
```bash
cd ios
pod install
# Abrir Xcode e build
```

---

## ☁️ BUILD EAS (Produção)

### 1. Configurar EAS (Primeira Vez)

```bash
cd app-frontend
eas build:configure
```

### 2. Build Android

**Development:**
```bash
eas build --platform android --profile development
```

**Production:**
```bash
eas build --platform android --profile production
```

**Preview:**
```bash
eas build --platform android --profile preview
```

### 3. Build iOS

**Development:**
```bash
eas build --platform ios --profile development
```

**Production:**
```bash
eas build --platform ios --profile production
```

**Preview:**
```bash
eas build --platform ios --profile preview
```

### 4. Build Ambas as Plataformas

```bash
eas build --platform all --profile production
```

---

## 📦 DOWNLOAD E INSTALAÇÃO

### 1. Listar Builds

```bash
eas build:list
```

### 2. Download APK/IPA

```bash
eas build:download
# Ou acessar: https://expo.dev/accounts/[seu-account]/builds
```

### 3. Instalar no Dispositivo

**Android (APK):**
```bash
adb install -r path/to/app.apk
```

**iOS (IPA):**
- Usar TestFlight ou Xcode

---

## 🔍 VERIFICAÇÕES PÓS-BUILD

### 1. Verificar Permissões

**Android:**
- Abrir app → Configurações → Permissões
- Verificar: Câmera, Armazenamento

**iOS:**
- Abrir app → Configurações → Privacidade
- Verificar: Câmera, Fotos

### 2. Testar Funcionalidades

- ✅ Login/Registro
- ✅ Câmera (tirar foto)
- ✅ Galeria (escolher imagem)
- ✅ Upload de imagens
- ✅ Navegação entre telas

### 3. Verificar Logs

```bash
# Android
adb logcat | grep -i "troia\|expo"

# iOS
# Usar Xcode Console
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Permission denied"

**Solução:**
```bash
# Verificar permissões no app.json
cat app.json | grep -A 10 "permissions"

# Rebuild
eas build --platform android --profile production --clear-cache
```

### Erro: "Icon not found"

**Solução:**
```bash
# Verificar se ícones existem
ls -la assets/images/

# Se não existir, criar ícones mock
# (ver seção "Criar Ícones Mock")
```

### Erro: "Build failed"

**Solução:**
```bash
# Limpar cache
eas build --platform android --profile production --clear-cache

# Verificar logs
eas build:list
eas build:view [build-id]
```

### Erro: "expo-camera not configured"

**Solução:**
```bash
# Verificar plugin no app.json
cat app.json | grep -A 5 "expo-camera"

# Rebuild
npx expo prebuild --clean
eas build --platform android --profile production
```

---

## 🎨 CRIAR ÍCONES MOCK (Se Necessário)

### 1. Criar Ícone Principal

**Usar ferramenta online:**
- https://www.appicon.co/
- https://www.favicon-generator.org/

**Ou criar manualmente:**
```bash
# Criar imagem 1024x1024 PNG
# Salvar como: assets/images/icon.png
```

### 2. Criar Ícones Android Adaptativos

**Foreground (512x512):**
- Salvar como: `assets/images/android-icon-foreground.png`

**Background (1024x1024):**
- Cor: #4CAF50
- Salvar como: `assets/images/android-icon-background.png`

**Monochrome (512x512):**
- Versão monocromática
- Salvar como: `assets/images/android-icon-monochrome.png`

### 3. Criar Splash Screen

**Splash (1242x2436):**
- Background: #4CAF50
- Salvar como: `assets/images/splash.png`

**Splash Icon (200x200):**
- Ícone centralizado
- Salvar como: `assets/images/splash-icon.png`

---

## 📱 SUBMIT PARA STORES

### Android (Google Play)

**1. Configurar Credenciais:**
```bash
eas credentials
```

**2. Build AAB:**
```bash
eas build --platform android --profile production
```

**3. Submit:**
```bash
eas submit --platform android
```

### iOS (App Store)

**1. Configurar Credenciais:**
```bash
eas credentials
```

**2. Build IPA:**
```bash
eas build --platform ios --profile production
```

**3. Submit:**
```bash
eas submit --platform ios
```

---

## ✅ CHECKLIST FINAL

### Antes do Build
- [x] app.json configurado corretamente
- [x] eas.json configurado
- [x] Ícones existem
- [x] Splash screen configurada
- [x] Permissões corretas
- [x] Plugins configurados

### Após o Build
- [x] APK/IPA baixado
- [x] Instalado no dispositivo
- [x] Permissões funcionando
- [x] Câmera funciona
- [x] Galeria funciona
- [x] Navegação funciona

---

## 🚀 COMANDOS RÁPIDOS

```bash
# Build Android Production
cd app-frontend && eas build --platform android --profile production

# Build iOS Production
cd app-frontend && eas build --platform ios --profile production

# Build Ambas
cd app-frontend && eas build --platform all --profile production

# Ver Builds
eas build:list

# Download Build
eas build:download

# Submit Android
eas submit --platform android

# Submit iOS
eas submit --platform ios
```

---

## 📞 SUPORTE

**Documentação:**
- Expo: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/

**Comandos de Ajuda:**
```bash
eas build --help
eas submit --help
eas credentials --help
```

---

**Configuração pronta para build!** 🚀

