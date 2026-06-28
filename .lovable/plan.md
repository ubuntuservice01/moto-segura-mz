## MotoVerify MZ — Ubuntu Link

Plataforma pública moçambicana para verificação de propriedade de motas + marketplace, com painel de gestão Ubuntu Link.

### Stack & Backend
- TanStack Start + Tailwind v4 (já configurado)
- Lovable Cloud (Supabase) — base de dados e histórico persistente
- Painel de gestão **sem autenticação** nesta fase (decisão do utilizador)
- Fontes: Inter via `@fontsource-variable/inter`

### Paleta (tokens em `src/styles.css`)
- `--primary`: Azul escuro `#0A1628` (autoridade)
- `--secondary`: Verde Moçambique `#009A44`
- `--accent`: Âmbar `#F5A623` (CTAs)
- `--background`: `#F7F8FA` / `--card`: `#FFFFFF`
- `--destructive`: Vermelho para alerta "ROUBADA"

### Schema da BD

**`motos`** — chassi (unique), matricula, marca, modelo, ano, cilindrada, cor, km, proprietario_nome, proprietario_bi, proprietario_contacto, proprietario_localidade, proprietario_provincia, estado (`activa`|`a_venda`|`roubada`|`transferida`), preco_venda, notas_internas, timestamps.

**`historico_motos`** — moto_id (FK), tipo_evento (`registo`|`transferencia`|`actualizacao`|`mudanca_estado`), campo_alterado, valor_antes, valor_depois (JSONB para diffs multi-campo), operador, motivo, created_at.

**`transferencias`** — moto_id, proprietario_anterior (snapshot JSONB), proprietario_novo (JSONB), valor_transaccao, created_at.

Trigger PostgreSQL em `motos` regista automaticamente diffs em `historico_motos` no UPDATE. RLS: SELECT público (com colunas sensíveis filtradas via views/server fns); INSERT/UPDATE/DELETE permitido a `anon` por agora (painel aberto), com nota para fechar depois.

### Privacidade do contacto
Contacto do proprietário **só visível quando `estado = 'a_venda'`**. Caso contrário ocultado totalmente. BI nunca exposto publicamente — apenas no painel de gestão.

### Rotas
```
/                          → Home (hero, 3 cards de entrada, stats rápidas)
/verificar                 → Pesquisa por chassi (parcial), resultado partilhável
/verificar/$chassi         → Página pública da mota: ficha, alerta roubada, timeline completa, CTA contacto se à venda
/comprar                   → Marketplace (filtros marca/preço/província, grid de cards)
/comprar/$id               → Detalhe da mota à venda + botão Ubuntu Link
/gestao                    → Lista + filtros + estatísticas
/gestao/nova               → Formulário de registo
/gestao/$id                → Editar mota
/gestao/$id/transferir     → Modal/página de transferência
/gestao/historico          → Log global filtrável
```

### Server functions (`src/lib/motos.functions.ts`)
- `searchMotosByChassi(parcial)` — pesquisa pública, oculta contacto se não à venda
- `getMotoByChassi(chassi)` — ficha + timeline
- `listMarketplace(filtros)` — só `a_venda`, chassi mascarado (ex: `BR••••••KZ12`)
- `listAllMotos(filtros)` — gestão
- `createMoto`, `updateMoto`, `transferOwner`, `changeEstado` — todas registam histórico
- `listHistorico(filtros)` — log global
- `getStats()` — contadores + agregação por marca

### Componentes-chave
- `<MotoCard>` — variantes `marketplace` | `gestao` | `resultado`
- `<ChassisFingerprint>` — assinatura visual animada (SVG com padrão de "impressão digital" que aparece ao carregar resultado)
- `<EstadoBadge>` — pills coloridas + badge "VERIFICADA" verde
- `<Timeline>` — histórico vertical com ícones por tipo de evento e diffs antes→depois
- `<AlertaRoubada>` — banner vermelho destacado
- `<MotoForm>` — formulário partilhado registo/edição com validação Zod
- `<TransferenciaModal>` — fluxo dedicado com snapshot do dono anterior
- `<StatsChart>` — barras por marca (Recharts)
- `<SiteHeader>` com nav para as 3 secções + footer

### Histórico — detalhe
Diffs guardados como JSONB `{ campo: { antes, depois } }` para suportar múltiplas alterações num só UPDATE. Timeline na página pública mostra eventos legíveis ("Estado alterado: Activa → À Venda", "Transferida para Carlos M. por 45.000 MT"). BI e notas internas nunca aparecem na timeline pública.

### Entregáveis
1. Migration: tabelas, trigger de histórico, RLS, GRANTs, seed com 6-8 motas de exemplo (incluindo 1 roubada, 3 à venda)
2. Tokens de design + Inter
3. Layout raiz com header/footer
4. 9 rotas listadas acima
5. Componentes partilhados
6. Server functions + validação Zod

### Notas
- Painel aberto agora — adicionar aviso visível "Acesso restrito a operadores Ubuntu Link" e marcar para proteger com login na próxima iteração
- Marketplace mostra chassi mascarado; página `/verificar/$chassi` mostra completo (é o propósito de verificação)
- Todas as mutações passam por server functions para garantir registo no histórico
