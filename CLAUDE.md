@AGENTS.md

# CLAUDE.md — Dashboard André Reis (Vektrum)

Este ficheiro dá contexto ao Claude Code. Lê-o antes de começar.

## O que é este projeto

Dashboard frontend para um sistema de geração e gestão de leads imobiliários,
construído pela **Vektrum** para um cliente: **André Reis**, consultor imobiliário
da IAD Portugal, focado em mercados premium na zona de Lisboa.

Este repositório é **só o frontend**. O backend (scraping, enriquecimento por IA,
base de dados) é um projeto separado, da responsabilidade de outra pessoa (ver
"Divisão de trabalho").

## Divisão de trabalho — importante

- **Eu (Pedro)** — responsável por este frontend (dashboard Next.js) e pelo
  segmento de mercado de **Cascais**.
- **Luís** — responsável pelo backend: scraping via Apify, orquestração, base de
  dados Supabase, o agente de research (projeto `lead-researcher` em Python), e o
  segmento de **Algés/Miraflores**.

**Não mexer no projeto `lead-researcher`** nem em código de backend. Esse é
território do Luís. Este dashboard apenas *lê* os dados que o backend produz.

## Stack

- **Next.js** (frontend, React)
- **Vercel** (deploy — configurar deploy contínuo desde o início)
- **Mapbox** (mapa com pins de leads)
- **Supabase** (base de dados — gerida pelo Luís; o frontend lê dela)

## Estratégia de arranque: mock data primeiro

A base de dados Supabase ainda não está acessível para o frontend. **Não esperar
por ela.** Começar com dados falsos (mock data) que imitam a forma dos dados
reais, construir o dashboard inteiro sobre esses dados, e trocar a fonte para o
Supabase quando estiver pronto.

A forma dos dados deve alinhar com os modelos do backend do Luís (ver abaixo).
Manter a estrutura de dados num único sítio (ex: `lib/mockData.ts` + um tipo
`Lead`) para facilitar a troca futura.

## Forma dos dados (alinhar com os models do backend)

O backend trabalha com entidades `Property` e `Lead`. Campos relevantes para o
frontend (nomes aproximados — confirmar com o Luís quando o Supabase estiver pronto):

- `id`
- `zone` (zona/bairro)
- `zone_tier` (1, 2 ou 3 — tier da zona)
- `typology` (T3, T4, moradia...)
- `price_current` (preço atual)
- `price_initial` (preço inicial, para calcular reduções)
- `area_sqm` (área em m²)
- `days_on_market` (dias no mercado)
- `seller_type` (particular / agência)
- `priority` (HIGH / MEDIUM / LOW)
- `score` (pontuação numérica)
- `status` (Por contactar / Contactado / Em negociação / Fechado)
- `listing_url` (link do anúncio)
- `commercial_note` (nota comercial gerada por IA)
- `lat`, `lng` (coordenadas para o mapa)

## Mercados

Dois mercados, ambos premium (preço médio ~€1M+):
- **Cascais** — zonas tier 1: Quinta da Marinha, Birre, Guincho, Monte Estoril.
  Tier 2: Cascais Centro, Estoril.
- **Algés/Miraflores** — segmento do Luís.

## As três vistas do dashboard (por esta ordem de construção)

1. **Tabela de leads** (construir primeiro — é o core)
   - Lista filtrável por: zona, prioridade, estado, tipologia
   - Clicar num lead abre a ficha completa (com a nota comercial e próxima ação)

2. **Mapa** (Mapbox)
   - Pins na localização dos imóveis, cor por prioridade

3. **Fila de outreach** (construir por último)
   - Leads de prioridade alta com mensagem gerada por IA
   - O André revê, ajusta, e aprova o envio
   - **Semi-automático por design** — o André aprova sempre antes de enviar
     (decisão deliberada por razões de RGPD e qualidade de conversão)

## Notas de produto

- O sistema é **semi-automático**, não totalmente automático. A aprovação humana
  do André antes de qualquer contacto é uma decisão de produto, não uma limitação.
- O dashboard é privado (login simples).
- A prioridade dos leads vem de um sistema de scoring no backend; o frontend
  apenas a exibe (ex: cor dos pins, ordenação da tabela).

## Convenções

- Manter o código simples e legível — começar pequeno, deixar a estrutura crescer
  com a necessidade. Não sobre-arquitetar.
- Idioma da interface: Português (Portugal).
- Confirmar com o Luís antes de assumir nomes de campos ou endpoints da API.
