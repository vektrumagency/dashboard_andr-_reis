# Handoff: filtro multi-agência no dashboard

Estado a 2026-11-05. Para o Pedro e o Luís. Branch: `feat/multi-agencia-filtro` (sem PR aberto, nada em `master`).
Documento completo, plano e diagnóstico: repo `IAD_lead_researcher`, branch `feat/multi-agencia`, ficheiros `HANDOFF-multi-agencia.md` e `docs/PLANO-multi-agencia.md`.

## O que mudou

- `lib/derive/multiAgency.ts` (novo): função única `multiAgencyLevel(lead)`. Lê `lead.multi_agency_likelihood.level`; se o campo não existir, ou se `computed_at` for anterior a `multi_agency_detection.checked_at`, recalcula pelo fallback das fotos (`matched_agency` e `matched_agencies`, `different_advertiser_confirmed`, `status`). O facto mostrado e o filtro usam esta função.
- Filtro "Multi-agência" na URL (`multi=confirmed_or_probable|confirmed|probable|unlikely|unknown`, rótulos PT-PT) em `lib/leadQuery.ts` e `app/components/LeadFilters.tsx`. Valor inválido volta a "Todas".
- `lib/derive/headlineFacts.ts`: facto "Multi-agência" com a origem no "Provável" (descrição / regra da agência / fotos). `skipped` continua a não mostrar nada.
- Tipos em `lib/types.ts` e `lib/types/analysis.ts`: `multi_agency_likelihood` (opcional).
- Testes: `lib/derive/multiAgency.test.ts` (novo) e ajustes em `headlineFacts.test.ts` e `leadQuery.test.ts`. A invariante "facto = filtro" usa `applyLeadQuery`.

Verificado: `npm test` (59 testes), `npx tsc --noEmit`, `npm run lint`, `npm run build`. **Não foi aberto no browser.** A leitura de dados (`lib/api.ts`) não foi alterada: o filtro corre em memória sobre os leads lidos.

## Schema esperado do backend (`multi_agency_likelihood`)

`schema_version`, `level` (`confirmed | probable | unlikely | unknown`), `reasons[]` (`source`, `code`, `detail`), `rules_version`, `computed_at`. Campo opcional: leads sem ele continuam a funcionar. O Luís já deu o ok; o Pedro deve rever antes do PR (o `CLAUDE.md` deste repo pede-o).

## O que falta

1. Abrir o PR (`feat/multi-agencia-filtro`) depois de o Pedro rever. Não há CI no GitHub: o portão é local (testes + build) mais o preview da Vercel. O push para `main` bloqueia a fila de deploys (plano Hobby): só via PR.
2. Abrir a app no browser e verificar a tabela e o detalhe com dados reais (há apenas leads de agosto, quase todos `unknown`).
3. O campo só existe nos leads depois de o backend o calcular (backfill ou próximo run). Até lá o dashboard usa o fallback das fotos, e quase nada aparece (0 `confirmed` em 60 leads).
4. Não leste `node_modules/next/dist/docs/` como o `AGENTS.md` exige: só se mexeu em `lib/` e num componente cliente já existente. Convém uma verificação rápida.
5. Atualizar o `CLAUDE.md` deste repo (fala de Supabase e `lib/mockData.ts`).
6. Filtrar também no `/mapa` (hoje só a tabela).
