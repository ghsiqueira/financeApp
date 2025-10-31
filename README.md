# 💰 FinanceApp

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.81.4-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-~54.0.7-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-Private-red)

**Aplicativo completo de gestão financeira pessoal**

Controle suas finanças, defina metas, gerencie orçamentos e visualize relatórios detalhados - tudo em um só lugar.

</div>

---

## 📱 Sobre o Projeto

FinanceApp é uma solução mobile completa para gestão de finanças pessoais, desenvolvida com React Native e Expo. O app permite que você:

- 💸 **Registre transações** de receitas e despesas
- 🎯 **Defina metas financeiras** e acompanhe o progresso
- 📊 **Crie orçamentos mensais** por categoria
- 📈 **Visualize relatórios** com gráficos interativos
- 🔮 **Faça projeções** financeiras para o futuro
- 🏷️ **Organize com categorias** personalizadas
- 👥 **Compartilhe metas** com outras pessoas
- 🌙 **Tema claro/escuro** para melhor experiência

---

## 🚀 Funcionalidades

### ✨ Principais Features

#### 📊 Dashboard Completo
- Resumo mensal com saldo, receitas e despesas
- Transações recentes
- Metas ativas com progresso visual
- Orçamentos do mês com alertas de limite
- Ações rápidas para criação de transações, metas e orçamentos

#### 💳 Gestão de Transações
- Criação rápida de receitas e despesas
- Categorização automática
- Transações recorrentes
- Histórico completo com filtros
- Detalhamento por categoria
- Suporte a anexos (em desenvolvimento)

#### 🎯 Metas Financeiras
- Criação de metas com valor alvo e prazo
- Acompanhamento de progresso em tempo real
- Notificações de marcos importantes
- Compartilhamento de metas com outros usuários
- Controle de permissões (visualizar/editar)

#### 💰 Orçamentos
- Orçamentos mensais por categoria
- Alertas quando próximo do limite
- Comparativo gasto vs. planejado
- Histórico de orçamentos anteriores

#### 📈 Relatórios e Análises
- Gráficos de pizza para gastos por categoria
- Gráficos de linha para tendências temporais
- Comparativos mês a mês
- Análise de receitas vs despesas

#### 🔮 Projeções
- Previsão de saldo futuro
- Simulação de cenários
- Análise de tendências

---

## 🛠️ Tecnologias Utilizadas

### Core
- **[React Native](https://reactnative.dev/)** `0.81.4` - Framework mobile
- **[Expo](https://expo.dev/)** `~54.0.7` - Plataforma de desenvolvimento
- **[TypeScript](https://www.typescriptlang.org/)** `~5.9.2` - Tipagem estática
- **[React](https://react.dev/)** `19.1.0` - Biblioteca UI

### Navegação
- **[React Navigation](https://reactnavigation.org/)** `7.x` - Navegação entre telas
  - Native Stack Navigator
  - Bottom Tabs Navigator
  - Stack Navigator

### State Management
- **React Context API** - Gerenciamento de estado global
- **Custom Hooks** - Lógica reutilizável

### UI/UX
- **[@expo/vector-icons](https://icons.expo.fyi/)** - Ícones (Material, Ionicons)
- **[react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)** - Gráficos
- **[react-native-svg](https://github.com/software-mansion/react-native-svg)** - Renderização SVG
- **[expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)** - Gradientes

### Formulários e Validação
- **[react-hook-form](https://react-hook-form.com/)** `7.62.0` - Gerenciamento de forms
- **[yup](https://github.com/jquense/yup)** `1.7.0` - Validação de schemas
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Integração

### API e Armazenamento
- **[Axios](https://axios-http.com/)** `1.12.2` - Cliente HTTP
- **[@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)** - Storage local
- **[expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)** - Armazenamento seguro (em migração)

### Outros
- **[expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)** - Notificações push
- **[react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)** - Animações
- **[react-native-uuid](https://www.npmjs.com/package/react-native-uuid)** - Geração de IDs únicos

---

## 📂 Estrutura do Projeto

```
financeApp/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── charts/          # Componentes de gráficos
│   │   ├── common/          # Componentes comuns (Card, Button, etc)
│   │   ├── forms/           # Formulários (Transaction, Goal, Budget)
│   │   ├── lists/           # Listas (TransactionList, GoalList)
│   │   └── modals/          # Modais e dialogs
│   │
│   ├── screens/             # Telas do app
│   │   ├── auth/            # Autenticação (Login, Register)
│   │   ├── main/            # Home/Dashboard
│   │   ├── transactions/    # Gestão de transações
│   │   ├── goals/           # Gestão de metas
│   │   ├── budgets/         # Gestão de orçamentos
│   │   ├── reports/         # Relatórios e gráficos
│   │   ├── projections/     # Projeções financeiras
│   │   ├── categories/      # Gestão de categorias
│   │   └── profile/         # Perfil do usuário
│   │
│   ├── navigation/          # Configuração de navegação
│   │   ├── AppNavigator.tsx         # Navegador raiz
│   │   ├── AuthNavigator.tsx        # Stack de autenticação
│   │   ├── MainTabNavigator.tsx     # Tabs principais
│   │   └── types/                   # Tipos do React Navigation
│   │
│   ├── contexts/            # Context API providers
│   │   ├── AuthContext.tsx          # Autenticação
│   │   ├── TransactionContext.tsx   # Transações
│   │   ├── GoalContext.tsx          # Metas
│   │   ├── BudgetContext.tsx        # Orçamentos
│   │   ├── CategoryContext.tsx      # Categorias
│   │   ├── ThemeContext.tsx         # Tema (light/dark)
│   │   ├── ToastContext.tsx         # Notificações toast
│   │   └── NotificationContext.tsx  # Push notifications
│   │
│   ├── services/            # Camada de serviços (API)
│   │   ├── api.ts                   # Cliente Axios configurado
│   │   ├── AuthService.ts           # Endpoints de autenticação
│   │   ├── TransactionService.ts    # Endpoints de transações
│   │   ├── GoalService.ts           # Endpoints de metas
│   │   ├── BudgetService.ts         # Endpoints de orçamentos
│   │   ├── CategoryService.ts       # Endpoints de categorias
│   │   ├── GoalShareService.ts      # Compartilhamento de metas
│   │   └── ProjectionService.ts     # Projeções financeiras
│   │
│   ├── hooks/               # Custom React Hooks
│   │   ├── useAuth.tsx              # Hook de autenticação
│   │   ├── useTransactions.tsx      # Hook de transações
│   │   ├── useGoals.tsx             # Hook de metas
│   │   ├── useBudgets.tsx           # Hook de orçamentos
│   │   ├── useCategories.tsx        # Hook de categorias
│   │   ├── useTheme.tsx             # Hook de tema
│   │   ├── useToast.tsx             # Hook de toast
│   │   └── useConfirm.tsx           # Hook de confirmação
│   │
│   ├── types/               # TypeScript types/interfaces
│   │   └── index.ts                 # Todos os tipos da aplicação
│   │
│   ├── utils/               # Funções utilitárias
│   │   ├── colorUtils.ts            # Manipulação de cores
│   │   ├── currencyUtils.ts         # Formatação de moeda
│   │   ├── dateUtils.ts             # Manipulação de datas
│   │   ├── formatters.ts            # Formatadores diversos
│   │   ├── mappingUtils.ts          # Mapeamento de dados
│   │   ├── storageUtils.ts          # Helpers de storage
│   │   └── validators.ts            # Validadores
│   │
│   ├── helpers/             # Helper functions
│   │   ├── apiHelpers.ts            # Helpers de API
│   │   ├── chartHelpers.ts          # Helpers de gráficos
│   │   └── navigationHelpers.ts     # Helpers de navegação
│   │
│   ├── constants/           # Constantes da aplicação
│   │   └── index.ts                 # Cores, fontes, spacing, etc
│   │
│   └── index.ts             # Entry point da aplicação
│
├── App.tsx                  # Componente raiz (providers)
├── index.ts                 # Entry point do Expo
├── app.json                 # Configuração do Expo
├── package.json             # Dependências
├── tsconfig.json            # Configuração TypeScript
├── babel.config.js          # Configuração Babel
└── metro.config.js          # Configuração Metro bundler
```

---

## 🏁 Como Começar

### Pré-requisitos

- **Node.js** >= 18.x
- **npm** ou **yarn**
- **Expo CLI** (instalado globalmente)
- **Android Studio** (para emulador Android) ou **Xcode** (para iOS)
- **Backend da API** rodando na porta 5000

```bash
# Instalar Expo CLI (se não tiver)
npm install -g expo-cli
```

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd financeApp
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Copie o arquivo de exemplo e configure conforme necessário:
```bash
cp .env.example .env.development
```

Edite `.env.development`:
```env
API_URL=http://localhost:5000/api  # URL da API backend
NODE_ENV=development
```

### Executando o App

#### Modo de Desenvolvimento

```bash
# Iniciar o Expo
npm start
```

Isso abrirá o Expo DevTools no navegador. A partir daí você pode:

#### Rodar no Android
```bash
npm run android
```
ou pressione `a` no terminal do Expo

#### Rodar no iOS
```bash
npm run ios
```
ou pressione `i` no terminal do Expo

#### Rodar na Web
```bash
npm run web
```
ou pressione `w` no terminal do Expo

### Configuração do Backend

O app espera uma API REST rodando em:
- **Android Emulator:** `http://10.0.2.2:5000/api`
- **iOS Simulator:** `http://localhost:5000/api`
- **Web:** `http://localhost:5000/api`

> **Nota:** Certifique-se de que o backend está rodando antes de iniciar o app!

---

## 🏗️ Arquitetura

### Padrão de Arquitetura

O projeto segue uma **arquitetura em camadas** (Layered Architecture):

```
┌─────────────────────────────────────┐
│   Presentation Layer (Screens)      │  ← Interface do usuário
├─────────────────────────────────────┤
│   Components Layer                  │  ← Componentes reutilizáveis
├─────────────────────────────────────┤
│   State Management (Contexts)       │  ← Estado global da aplicação
├─────────────────────────────────────┤
│   Business Logic (Hooks)            │  ← Regras de negócio
├─────────────────────────────────────┤
│   Data Access (Services)            │  ← Comunicação com API
├─────────────────────────────────────┤
│   Utilities & Helpers               │  ← Funções auxiliares
└─────────────────────────────────────┘
```

### Fluxo de Dados

```
User Interaction
      ↓
   Screen
      ↓
   Hook (useTransactions, useGoals, etc)
      ↓
   Context (atualiza estado global)
      ↓
   Service (chama API)
      ↓
   API Response
      ↓
   Context (atualiza estado)
      ↓
   Screen (re-renderiza)
```

### Design Patterns Utilizados

- **Context API Pattern** - Gerenciamento de estado global
- **Custom Hooks Pattern** - Encapsulamento de lógica reutilizável
- **Service Layer Pattern** - Abstração da comunicação com API
- **Component Composition** - Composição de componentes
- **Singleton Pattern** - ApiService (única instância)

---

## 🎨 Temas e Estilos

O app suporta **modo claro e escuro**. A troca é gerenciada pelo `ThemeContext`.

### Estrutura de Tema

```typescript
interface Theme {
  // Cores principais
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Cores de fundo
  background: string;
  surface: string;

  // Cores de texto
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // Cores semânticas
  success: string;
  error: string;
  warning: string;
  info: string;

  // Outras cores
  border: string;
  white: string;
  black: string;
}
```

### Como usar temas nos componentes

```typescript
import { useTheme } from '../../contexts/ThemeContext';

const MyComponent = () => {
  const { theme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.textPrimary }}>Hello!</Text>
    </View>
  );
};
```

---

## 🔐 Autenticação

O app usa **JWT (JSON Web Tokens)** para autenticação.

### Fluxo de Autenticação

1. Usuário faz login com email/senha
2. Backend retorna JWT token
3. Token é armazenado em **AsyncStorage** (migrando para SecureStore)
4. Token é enviado automaticamente em todas as requisições via **Axios Interceptor**
5. Se token expirar (401), usuário é deslogado automaticamente

### Endpoints de Autenticação

```typescript
POST /api/auth/register  // Criar conta
POST /api/auth/login     // Fazer login
POST /api/auth/logout    // Fazer logout
POST /api/auth/refresh   // Refresh token
```

---

## 📡 Comunicação com API

### Configuração do Axios

O `ApiService` (src/services/api.ts) configura o Axios com:
- Base URL automática baseada na plataforma
- Timeout de 15 segundos
- Interceptors para adicionar token
- Tratamento de erros centralizado

### Exemplo de uso

```typescript
import apiService from '../services/api';

const fetchTransactions = async () => {
  const response = await apiService.getTransactions({
    page: 1,
    limit: 20,
    type: 'expense'
  });

  if (response.success) {
    console.log(response.data);
  } else {
    console.error(response.message);
  }
};
```

---

## 🧪 Testes

> **Status:** Testes em implementação

### Stack de Testes (planejado)
- Jest
- React Native Testing Library
- Testing Library Hooks

```bash
# Rodar testes (quando implementado)
npm test

# Rodar com coverage
npm run test:coverage

# Modo watch
npm run test:watch
```

---

## 🚢 Deploy

### Build de Produção

#### Android (APK/AAB)
```bash
eas build --platform android
```

#### iOS (IPA)
```bash
eas build --platform ios
```

#### Configurar EAS

1. Instalar EAS CLI:
```bash
npm install -g eas-cli
```

2. Login:
```bash
eas login
```

3. Configurar projeto:
```bash
eas build:configure
```

---

## 📦 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `API_URL` | URL da API backend | `http://localhost:5000/api` |
| `NODE_ENV` | Ambiente de execução | `development` ou `production` |

---

## 🤝 Contribuindo

> Este é um projeto privado. Contribuições são aceitas apenas de membros autorizados.

### Workflow

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
3. Push para a branch: `git push origin feature/nova-feature`
4. Abra um Pull Request

### Padrão de Commits

Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas gerais
```

---

## 🐛 Troubleshooting

### Erro: "Network Error" ao fazer login

**Solução:** Verifique se o backend está rodando na porta 5000:
```bash
# No diretório do backend
npm start
```

### Erro: "Unable to resolve module"

**Solução:** Limpe o cache e reinstale:
```bash
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Android Emulator não conecta ao backend

**Solução:** Use `10.0.2.2` ao invés de `localhost`:
- O emulador Android tem sua própria rede
- `10.0.2.2` aponta para o localhost da máquina host

### iOS Simulator não conecta ao backend

**Solução:** Use `localhost` normalmente no iOS.

---

## 📄 Licença

Este projeto é privado e proprietário. Todos os direitos reservados.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ por [Seu Nome/Empresa]

---

## 📞 Suporte

- **Email:** [seu-email@exemplo.com]
- **Issues:** [Link do repositório/issues]

---

## 🗺️ Roadmap

### ✅ Implementado
- [x] Autenticação (login/registro)
- [x] Gestão de transações
- [x] Metas financeiras
- [x] Orçamentos mensais
- [x] Relatórios com gráficos
- [x] Categorias customizadas
- [x] Compartilhamento de metas
- [x] Tema claro/escuro
- [x] Projeções financeiras

### 🚧 Em Desenvolvimento
- [ ] Testes automatizados
- [ ] Migração para expo-secure-store
- [ ] Modo offline
- [ ] Exportação de relatórios (PDF/Excel)

### 📋 Planejado
- [ ] Notificações push configuradas
- [ ] Biometria (Face ID / Touch ID)
- [ ] Anexos em transações (fotos de recibos)
- [ ] Widgets para home screen
- [ ] Integração bancária (Open Banking)
- [ ] IA para insights automáticos
- [ ] Internacionalização (i18n)
- [ ] Modo família (compartilhamento de orçamentos)

---

<div align="center">

**⭐ Se este projeto foi útil, deixe uma estrela!**

</div>
