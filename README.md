# AprovaPE — Etapa 2

Central pessoal de preparação para concursos de Pernambuco. Next.js App Router, React, TypeScript, Tailwind CSS, Zustand e Recharts. Evolução do projeto enviado em `AprovaPE_Etapa1.zip`, com compatibilidade para dados da primeira etapa.

## Executar no Windows

Use Node.js 24 e npm. No PowerShell, dentro da pasta clonada:

```powershell
git pull origin main
npm ci
npm run dev
```

Para uma instalação nova:

```powershell
git clone https://github.com/SavioTSL/AprovaPe.git
cd AprovaPe
npm ci
npm run dev
```

A aplicação usa a porta 3000. Não precisa de Apache, MySQL ou Laragon. Não há credenciais obrigatórias nesta etapa.

## Executar no ambiente de nuvem

```bash
cd /workspace/AprovaPe
npm ci --cache /workspace/.npm-cache
npm run dev -- --hostname 0.0.0.0
```

Para produção:

```bash
npm run build
npm run start -- --hostname 0.0.0.0
```

## Fluxo de preparação

1. **Editais:** escolha o concurso para consultar links públicos nos portais oficiais e conferir cargo, ano, documento de abertura e retificações.
2. **Importação em lote:** organize o conteúdo conferido em linhas `Disciplina | Assunto`. A prévia mostra o que será adicionado; assuntos existentes são preservados e duplicados são ignorados. Uma referência oficial opcional é salva nas anotações dos novos assuntos.
3. **Metas:** defina concurso principal, metas diária/semanal, dias disponíveis, tempo diário e tamanho dos blocos. As metas iniciais (60 min/dia, 300 min/semana) são sugestões configuráveis, não estatísticas de estudo.
4. **Planejamento:** gere blocos para os próximos sete dias. O plano considera somente assuntos pendentes do concurso principal, prioriza disciplinas com menos tempo registrado e distribui os assuntos em ciclos. Gerar novamente não duplica blocos. Tarefas manuais antigas são preservadas, não têm data e podem ter o checklist reiniciado separadamente.
5. **Cronômetro:** estude e registre minutos completos. Também é possível registrar estudos feitos fora da plataforma, inclusive em dias anteriores, sem interromper o cronômetro. Sessões incorretas podem ser excluídas após confirmação.
6. **Roadmap:** conclua assuntos, compartilhe entre concursos, filtre e salve anotações. Agende revisões de assuntos estudados.
7. **Revisões:** a primeira revisão é agendada para o dia seguinte. Ao lembrar, os próximos intervalos são 3, 7, 14, 30 e 60 dias. Ao esquecer, o intervalo volta a um dia. As próximas revisões podem ser consultadas, mas só as que chegaram à data podem ser concluídas.
8. **Caderno de erros:** registre a dificuldade e sua explicação, busque registros e marque os assuntos dominados.
9. **Estatísticas e backup:** acompanhe tempo por disciplina/período, constância e metas; exporte sessões CSV e faça backup JSON regularmente.

## Limites da consulta de editais

A API `/api/editais?exam=...` consulta páginas públicas de portais oficiais da SDS/PE e das bancas AOCP ou Cebraspe. As requisições têm prazo e tamanho limitados, usam destinos fixos e não seguem redirecionamentos arbitrários. A descoberta aceita apenas links HTTPS de domínios oficiais conhecidos.

Essa consulta **não é um buscador completo**, não verifica se o edital é o mais recente e pode não encontrar documentos em páginas internas ou carregadas por JavaScript. Resultados são candidatos para conferência, não conteúdo automaticamente aprovado. Falhas de rede e ausência de links são apresentadas com acesso direto aos portais. Não há extração automática de PDF, conteúdo inventado, requisito ou data pré-preenchida nesta versão.

Neste ambiente de nuvem, o acesso aos portais foi bloqueado pela política de saída. Os domínios necessários foram adicionados ao rascunho da configuração para revisão/publicação. O tratamento de indisponibilidade e o extrator com páginas de teste foram validados; a descoberta de um edital real ainda precisa de validação com acesso liberado. No computador local, a consulta depende da conectividade e das respostas dos portais.

## Persistência e compatibilidade

O estado fica no `localStorage`, chave `aprovape-v1`. A atualização preserva tarefas, assuntos e sessões existentes, inicializando as novas áreas quando ausentes. Dados válidos da primeira etapa são mantidos, inclusive eventuais exemplos já salvos; exclua os exemplos manualmente se ainda existirem.

O backup versão 2 inclui tarefas, assuntos/anotações, sessões, metas, revisões e caderno de erros. Backups versão 1 continuam aceitos; nesse caso, as áreas ausentes começam vazias e as preferências voltam às sugestões iniciais. Importar substitui o estado após confirmação e reinicia o cronômetro. Uma sessão ainda não registrada não faz parte do backup.

A validação verifica tipos, limites, datas, IDs, revisões vinculadas a assuntos existentes e consistência de tópicos compartilhados. Dados locais inválidos não são sobrescritos automaticamente. Falhas de gravação exibem aviso para exportação. Abas abertas no mesmo navegador recebem alterações pelo evento de armazenamento, mas atualizações simultâneas ainda podem seguir a regra de última gravação.

O cronômetro continua entre navegação, recargas e fechamento da aba: pause durante intervalos. Registro mínimo de um minuto e máximo de 24 horas. Metas, gráficos, datas do planejamento e revisões usam o calendário local do navegador. A sequência de constância conta dias consecutivos com sessões registradas, incluindo uma sequência encerrada ontem enquanto hoje ainda não tem estudo.

Não há sincronização entre aparelhos, autenticação ou banco remoto. Limpar os dados do navegador remove seu progresso; mantenha backups.

## Qualidade e testes

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Com o servidor de produção na porta 3000:

```bash
python tests/browser-smoke.py
python tests/browser-stage2.py
```

Os testes de navegador são opcionais para instalação local e exigem Python com Playwright e Chromium em `/usr/bin/chromium`, disponíveis na nuvem. Usam contextos isolados. Exercitam migração, persistência, metas, importação em lote, notas, revisões, geração sem duplicação, caderno de erros, sessões manuais, CSV, sincronização entre abas, backups e todas as telas em 320/360/390 px. Relógio e data de revisão são ajustados somente no contexto de teste.

A navegação preserva a tela ao recarregar e permite voltar/avançar. No celular há atalhos inferiores e menu com contenção de foco, Escape e bloqueio do fundo. Inputs têm labels, o gráfico oferece os valores em texto, a interface respeita redução de movimento e há um link para pular para o conteúdo.

## Arquitetura

- `src/app/page.tsx`: navegação, hidratação e sincronização entre abas.
- `src/app/api/editais/route.ts`: consulta limitada às fontes oficiais.
- `src/components/`: dashboard, roadmap/anotações, planejamento, metas, revisões, caderno de erros, cronômetro/registro manual, estatísticas, editais e backup.
- `src/lib/data.ts`: modelos de dados e preferências.
- `src/lib/store.ts`: ações e persistência compatível com a primeira etapa.
- `src/lib/validation.ts`: validação do armazenamento e dos backups.
- `src/lib/study.ts`: cálculo de estatísticas, calendário e geração do cronograma.
- `src/lib/editais.ts`: catálogo de fontes e descoberta de links oficiais.
- `tests/`: testes de regras e dos fluxos no navegador.

Próximas etapas: descoberta mais abrangente de editais e retificações, extração de PDF com conferência, módulos/aulas, banco de questões e simulados com conteúdo autorizado, TAF e integração Supabase/IA. Essas funcionalidades ainda não são oferecidas como concluídas.
