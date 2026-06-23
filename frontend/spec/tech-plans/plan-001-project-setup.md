---
id: plan-001
status: active
links:
  - spec/tech-plans/index.md
  - spec/adrs/adr-001-react-vite.md
---
# Tech Plan: Project Setup

## Objective
Inicializar o projeto React + Vite + TypeScript com todas as dependências, configurações de lint, paths e variáveis de ambiente antes de qualquer feature.

## Scope
- In scope: Vite scaffold, TypeScript config, ESLint + Prettier, Tailwind CSS, shadcn/ui init, paths alias, variáveis de env, estrutura de pastas vazia
- Out of scope: qualquer feature, qualquer chamada de API, qualquer componente de UI

## Data Flow
```
npm create vite → TypeScript template → instalar deps → configurar Tailwind →
shadcn/ui init → criar estrutura de pastas → configurar paths → .env.example
```

## Implementation Steps

### 1. Scaffold
```bash
npm create vite@latest . -- --template react-ts
npm install
```

### 2. Dependências
```bash
npm install react-router-dom react-hook-form zod @hookform/resolvers
npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init
```

### 3. Configuração Tailwind
- `tailwind.config.js` com `content: ['./src/**/*.{ts,tsx}']`
- Import no `src/index.css`

### 4. Paths alias (vite.config.ts + tsconfig.json)
```
@/ → src/
@features/ → src/features/
@shared/ → src/shared/
@lib/ → src/lib/
```

### 5. Variáveis de ambiente
```
VITE_API_BASE_URL=http://localhost:8080
VITE_MP_PUBLIC_KEY=TEST-xxx
```

### 6. Estrutura de pastas (diretórios vazios com .gitkeep)
Criar todos os diretórios de `ARCHITECTURE.md` com arquivos placeholder.

## Acceptance Criteria
- `npm run dev` abre em http://localhost:5173 sem erro
- `npm run type-check` passa sem erros
- `npm run lint` passa sem erros
- Paths alias funcionando (import `@/lib/api` resolve corretamente)
- shadcn/ui Button renderiza corretamente
