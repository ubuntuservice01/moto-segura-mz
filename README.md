# MotoSure MZ

Vou criar um sistema completo de consulta e mercado de motas para Moçambique. Deixa-me planear bem antes de construir.

**Plano de design:**

- **Contexto:** Plataforma pública moçambicana para verificação de propriedade de motas + mercado de venda

- **Paleta:** Azul escuro `#0A1628` (autoridade/confiança), Verde Moçambique `#009A44`, Amarelo âmbar `#F5A623` (destaque/CTA), Cinza claro `#F7F8FA`, Branco `#FFFFFF`

- **Tipografia:** Inter (moderna, legível, profissional)

- **Assinatura:** Cartão de resultado de pesquisa com "impressão digital de chassi" animada — faz sentido para um sistema de identificação de veículos

Aqui está o sistema completo **MotoVerify MZ** — Ubuntu Link. Está tudo pensado ao detalhe:

---

**3 secções principais no topo:**

**🔍 Verificar Chassi** (página pública partilhável)

- Pesquisa por qualquer parte do chassi

- Resultado mostra: marca, modelo, ano, cor, km, estado, proprietário (nome + localidade, contacto protegido por privacidade)

- Alerta vermelho visível quando a mota está reportada como **roubada**

- Botão de contacto para motas à venda (mediado pela Ubuntu Link)

- **Timeline completa** de todo o histórico da mota — visível ao público

**🏍️ Comprar Moto** (marketplace público)

- Apenas motas com estado "À Venda" aparecem

- Filtros por marca, preço e província

- Chassi parcialmente ocultado (privacidade)

- Botão de contacto via Ubuntu Link

- Badge "VERIFICADA" em todas as motas

**⚙️ Gestão** (painel Ubuntu Link)

- Lista de todas as motas com filtro rápido

- **Registar nova mota** — formulário completo: chassi, matrícula, marca, modelo, ano, cc, cor, km, proprietário, BI, contacto, localidade, estado, preço de venda, notas internas

- **Editar** qualquer mota — detecta automaticamente o que mudou e regista no histórico

- **Transferência de proprietário** — modal dedicado com valor da transacção, nova ficha completa do novo dono

- **Histórico global** — tabela com filtro por tipo (Registo / Transferência / Actualização / Estado), com diffs antes→depois

- **Estatísticas** com contadores e gráfico de barras por marca

**Histórico guardado automaticamente:**

- Cada registo, edição, transferência e mudança de estado gera um evento no log

- Diff antes/depois quando o campo muda (ex: "Proprietário: João → Carlos")

- Timestamp, operador e motivo da alteração guardados sempre

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://moto-segura-mz.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/13721f4e-bd7b-4928-9b39-0de077589e12).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
