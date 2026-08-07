# MotoGest Multi-Tenant — Plataforma Nacional Ubuntu Service

Refactor do MotoCheck MZ para SaaS multi-tenant: uma base de dados nacional, isolamento lógico por Município, painel Ubuntu Service (super admin) e perfis Municipais e de Polícia.

Como é uma mudança estrutural grande, proponho entregar em 4 fases. Cada fase deixa a aplicação funcional.

---

## Fase 1 — Fundação: autenticação, municípios e isolamento

Hoje o painel de gestão está aberto, sem login. O multi-tenant só é possível com autenticação real, por isso esta fase é obrigatória e vem primeiro.

**Base de dados**
- `municipios` — nome, província, distrito, endereço, contactos, email, website, logótipo, brasão, cor principal/secundária, favicon, nome da plataforma, estado (activo/suspenso), licença (plano, validade).
- `perfis` — liga cada utilizador autenticado a um município.
- `utilizador_papeis` — tabela separada de papéis (nunca no perfil): `super_admin`, `admin_municipal`, `tecnico_municipal`, `policia`.
- `esquadras` — nome, endereço, contacto, responsável, município.
- `tenant_id` (município) adicionado a `motos`, `historico_motos`, `transferencias`, `pre_registos`, `avistamentos`, `reportes_roubo`, `notificacoes`.
- Funções de segurança `tem_papel()` e `municipio_actual()` usadas nas políticas de acesso, de forma a que cada utilizador só veja dados do seu município e o Super Administrador veja tudo.

**Aplicação**
- Página `/entrar` (email + palavra-passe) e área protegida.
- Todas as leituras/escritas passam a filtrar pelo município do utilizador; o Super Admin pode escolher o município activo.
- Os dados existentes ficam atribuídos a um município inicial ("Município de Lichinga", ajustável).

---

## Fase 2 — Painel Ubuntu Service (Super Administrador)

Rota `/ubuntu` reservada ao super admin:
- CRUD de Municípios (criar, editar, activar, suspender, eliminar apenas sem dados).
- Ao criar um Município: criação automática do Administrador Municipal e do Técnico Municipal, com credenciais mostradas uma única vez.
- Gestão de licenças, módulos activos por município e parâmetros globais.
- Dashboard nacional: total de municípios (activos/suspensos), motorizadas por estado, utilizadores por tipo, esquadras, transferências pendentes, últimos registos/transferências/reportes, com gráficos.
- Vista nacional de motorizadas e histórico.
- Exportação de backup (JSON/CSV por município ou nacional) e importação de restauro.

---

## Fase 3 — Perfis, permissões e esquadras

- Matriz de permissões aplicada em servidor (não só na UI):
  - **Admin Municipal**: registar/editar motas, alterar proprietário, aprovar transferências, emitir comprovativos, relatórios, gerir técnicos e esquadras, configurar o município.
  - **Técnico Municipal**: registar, actualizar, consultar, iniciar/receber/solicitar transferências. Sem criar utilizadores, eliminar motas ou configurar.
  - **Polícia**: consultar motas do município (proprietário, contactos, fotografias, histórico, transferências), confirmar recuperação, registar ocorrências. Sem alterar proprietário, eliminar ou criar utilizadores.
- Gestão de esquadras dentro do município, cada uma com utilizador próprio de perfil Polícia.
- Identidade visual por município aplicada ao painel (cores, logótipo, favicon, nome da plataforma) e aos PDFs/livrete.

---

## Fase 4 — Pesquisa nacional e modularidade

- Pesquisa nacional por matrícula, chassi ou número de motor, disponível a qualquer utilizador autenticado: devolve sempre o **Município de Registo** e o **Estado**; os detalhes adicionais dependem do perfil (fora do município, dados de proprietário ficam ocultos salvo mota roubada ou perfil Polícia/Super Admin).
- Aviso de duplicação ao registar um chassi já existente noutro município.
- Registo de módulos (`modulos` + `municipio_modulos`) com navegação gerada dinamicamente, para acrescentar futuros módulos (bicicletas, táxis, transporte escolar, viaturas e máquinas municipais, estacionamentos, reboques, integrações) sem mexer na estrutura principal.

---

## Notas técnicas

- Isolamento por Row Level Security no Postgres, com funções `SECURITY DEFINER` para evitar recursão; nenhuma política dá acesso anónimo a dados pessoais.
- Papéis em tabela dedicada, verificados no servidor em cada operação.
- Rotas protegidas sob `_authenticated`; páginas públicas actuais (`/verificar`, `/comprar`, `/reportar-roubo`) mantêm-se abertas e sem exposição de dados sensíveis.
- Server functions existentes (`motos`, `pre-registos`, `seguranca`) passam a resolver o tenant a partir da sessão em vez de operarem globalmente.
- Estrutura de pastas por módulo (`src/modules/<modulo>/`) para suportar o crescimento.

Se aprovar, começo pela Fase 1.
