# Aivacol Fleet — Frontend

Teste técnico: plataforma de gestão de frota para locadoras. Desenvolvido com Angular 19, signals e Design System CSS próprio.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Angular 19 (standalone components) |
| Estado | @ngrx/signals (Signal Store) |
| Estilo | Design System Aicol (CSS tokens + classes utilitárias) |
| TypeScript | strict mode |
| Testes | Karma + Jasmine |

---

## Início rápido

```bash
npm install
npm start
```

Acesse `http://localhost:4200`. A aplicação sobe com dados mockados — **nenhum backend necessário**.

**Credenciais de acesso (mock):** qualquer combinação funciona. Exemplo: `aivacol` / `aivacol`.

---

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm start` | Sobe com dados mockados (sem backend) |
| `npm run start:api` | Sobe apontando para backend local (`localhost:3000`) |
| `npm run start:prod` | Sobe com environment de produção |
| `npm run build` | Build de produção em `dist/` |
| `npm run build:dev` | Build de desenvolvimento |
| `npm test` | Executa os testes uma vez (CI-friendly) |
| `npm run type-check` | Valida TypeScript sem gerar build |

---

## Funcionalidades

| Módulo | Rota | Descrição |
|---|---|---|
| Login | `/login` | Autenticação com JWT |
| Veículos | `/vehicles` | CRUD completo com máquina de estados |
| Catálogo | `/catalog` | Gestão de marcas e modelos |
| Histórico | `/history` | Log de operações (read-only) |
| Auditoria | `/audit` | Log de interações com o backend (read-only) |

---

## Arquitetura

```
src/app/
├── core/           # AuthStore, guards, interceptors, layout shell
├── shared/         # Design system: Button, Input, Badge, DataTable, Pagination, Icon
└── features/
    ├── auth/       # LoginComponent, AuthApiService
    ├── vehicles/   # VehicleStore, VehicleApiService, VehicleListComponent, VehicleFormComponent
    ├── catalog/    # CatalogStore, BrandApiService, ModelApiService, CatalogListComponent
    ├── history/    # HistoryStore, HistoryApiService, HistoryListComponent
    └── audit/      # AuditStore, AuditApiService, AuditLogComponent
```

**Padrão de estado:** Signal Store por feature. Cada store é singleton (`providedIn: 'root'`) com exceção do `AuditStore` (feature-scoped via `providers` na rota — recarrega sempre).

**Máquina de estados dos veículos:**

```
[disponivel] → check_out  → [em_locacao]   → check_in    → [disponivel]
[disponivel] → maintenance → [em_manutencao] → check_in   → [disponivel]
[disponivel] → deactivation → [inativo]    → reactivation → [disponivel]
```

---

## Estratégia de mock

`npm start` usa `environment.ts` com `useMock: true`. Cada `*ApiService` verifica a flag e retorna dados estáticos de `public/assets/mocks/`:

| Arquivo | Conteúdo |
|---|---|
| `seed_vehicles.json` | 15 veículos, todos os status |
| `seed_operations.json` | 20 operações, todos os tipos |
| `seed_brands.json` | 3 marcas |
| `seed_models.json` | 6 modelos |
| `seed_audit.json` | 20 entradas de auditoria |

Para usar com backend real: `npm run start:api` (espera `http://localhost:3000`).

---

## Decisões técnicas relevantes

**HistoryStore como singleton global:** o `OperationDialogComponent` é aberto via CDK Dialog a partir da rota `/vehicles`. O CDK Dialog resolve dependências no injector root — se o store fosse feature-scoped em `/history`, o dialog lançaria `NullInjectorError`. Solução: `providedIn: 'root'`.

**VehicleStore com Subject + switchMap:** cancela requisições anteriores automaticamente quando `loadVehicles()` é chamado em sequência rápida (filtros). Evita race condition sem debounce adicional.

**Operações append-only:** o histórico é imutável por design. `HistoryStore` não expõe `updateOperation` nem `deleteOperation` — qualquer botão de edição seria erro de produto.

**Mock auth via `of()` com delay:** `POST` para arquivo estático retorna 404. O `AuthApiService` em modo mock retorna um JWT sintético diretamente via `of({token, user}).pipe(delay(400))`, sem request HTTP.

---

## Testes

```bash
npm test
```

Cobertura:

| Arquivo | O que testa |
|---|---|
| `vehicle.utils.spec.ts` | `canDeleteVehicle`, `ALLOWED_OPERATIONS`, `formatKm`, status labels/variants |
| `unique-field.validator.spec.ts` | Validator assíncrono de unicidade (placa, chassi, RENAVAM) |
| `vehicle.store.spec.ts` | Estado inicial, `loadVehicles`, `createVehicle`, `deleteVehicle`, computeds |
| `auth.guard.spec.ts` | `authGuard` e `redirectIfAuthenticatedGuard` |
