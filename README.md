# Finanzia — Frontend

![Stack](https://img.shields.io/badge/React-18-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)
![Node](https://img.shields.io/badge/Node-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)

---

## Stack

- **React 18** + **TypeScript**
- **Vite 8** — build e dev server
- **TailwindCSS 3.4** — estilos e tema claro/escuro
- **React Router DOM 7** — rotas
- **TanStack Query (React Query)** — cache e requisições à API
- **Zustand** — estado global (auth, tema, modal de transação)
- **Axios** — cliente HTTP (baseURL: backend)
- **React Hook Form** + **Zod** + **@hookform/resolvers** — formulários e validação
- **Recharts** — gráficos (área, pizza, barras)
- **Lucide React** — ícones
- **Framer Motion** — animações

---

## Estrutura de pastas

```text
src/
├── components/       # Componentes reutilizáveis
│   ├── auth/         # ProtectedRoute
│   ├── creditCard/   # CreditCardModal, CreditCardAccountModal, ImportCreditCardModal
│   ├── investments/  # InvestmentModal
│   ├── transactions/ # TransactionModal
│   └── ui/           # PeriodFilter, ConfirmModal, ThemeToggle
├── layouts/
│   ├── AuthLayout.tsx    # Layout login/registro
│   └── DashboardLayout.tsx # Sidebar + header + outlet
├── pages/
│   ├── auth/         # LoginPage, RegisterPage
│   ├── dashboard/     # DashboardPage
│   ├── transactions/  # TransactionsPage
│   ├── investments/   # InvestmentsPage
│   ├── categories/    # CategoriesPage
│   ├── creditCard/    # CreditCardPage
│   └── profile/      # ProfilePage
├── services/
│   └── api.ts        # Instância Axios + interceptor (Bearer token)
├── store/
│   ├── authStore.ts   # user, token, login, logout
│   ├── themeStore.ts  # theme (light/dark)
│   └── uiStore.ts     # modal de transação (open/close, mode, initialType)
├── types/             # Tipos TypeScript (dashboard, transaction, category, etc.)
├── utils/
│   ├── currency.ts    # formatBRL, parseBRL
│   └── date.ts        # formatDatePtBR, formatDateShort, formatDateWithShortMonth
├── styles/
│   └── global.css     # Tailwind + scrollbar + variáveis tema
├── App.tsx
└── main.tsx
```

---

## Rotas

### Públicas (AuthLayout)

| Caminho | Página | Descrição |
|---------|--------|-----------|
| `/login` | LoginPage | Login com e-mail e senha. |
| `/register` | RegisterPage | Cadastro (nome, e-mail, senha, confirmar senha). |

### Protegidas (ProtectedRoute + DashboardLayout)

| Caminho | Página | Descrição |
|---------|--------|-----------|
| `/` | DashboardPage | Dashboard: saldo, receitas/despesas do mês, economia, fluxo mensal, gráficos por categoria (despesas e receitas), movimentações recentes. |
| `/transactions` | TransactionsPage | Lista de transações, filtros (período, tag cartão, tipo), ordenação, gráficos por tipo. |
| `/investments` | InvestmentsPage | Lista de investimentos, filtro de período, ordenação. |
| `/categories` | CategoriesPage | Categorias de receita e despesa, CRUD, ordenação A–Z / Z–A. |
| `/credit-card` | CreditCardPage | Compras parceladas, grid “Parcelas por mês”, filtro por cartão, importação de planilha, gerenciar cartões. |
| `/profile` | ProfilePage | Editar nome e avatar. |

Tema claro/escuro é alterado no rodapé da sidebar (DashboardLayout).

---

## Configuração da API

O cliente Axios está em `src/services/api.ts`:

- **baseURL:** `http://localhost:4000`
- **Interceptor:** adiciona `Authorization: Bearer <token>` em todas as requisições (token do `authStore` ou `localStorage` key `finanzia_token`).

Para produção, pode-se usar variável de ambiente (ex.: `VITE_API_URL`) e definir `baseURL` a partir dela.

---

## Principais fluxos

- **Login/Logout:** authStore (Zustand) + persistência do token no localStorage; rotas protegidas checam token e redirecionam para `/login` se não autenticado.
- **Tema:** themeStore + classe no `html` (dark/light) + CSS variables; valor persistido no localStorage.
- **Modal de transação:** uiStore (`openTransactionModal`, `closeTransactionModal`); pode abrir em modo criação com tipo inicial (`income` ou `expense`) para os botões “Adicionar entrada” e “Adicionar saída” do Dashboard.
- **Filtro de período:** componente `PeriodFilter` (mês/ano ou “todos”); usado em Dashboard, Transações, Investimentos, Cartão de crédito.
- **Datas:** utilitários em `utils/date.ts` com formatação em pt-BR e timezone UTC para evitar “um dia a menos” em exibição.

---

## Scripts

```bash
npm run dev     # Servidor de desenvolvimento (Vite, --host)
npm run build   # TypeScript + build de produção (Vite)
npm run preview # Preview do build
```

---

## Build de produção

```bash
cd frontend
npm run build
```

A saída fica em `dist/`. Sirva essa pasta com qualquer servidor estático ou use o backend para servir o frontend (configurando Express para enviar `index.html` nas rotas da SPA).
