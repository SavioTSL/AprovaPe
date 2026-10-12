# AprovaPE — Etapa 1

Central pessoal de estudos com Next.js App Router, React, TypeScript, Tailwind CSS, Zustand e Recharts. Baseada no código enviado em `AprovaPE_Etapa1.zip`.

## Executar

Use Node.js 24 e npm (Node 22.18+ também suporta o runner dos testes).

```bash
cd /workspace/AprovaPe
npm ci --cache /workspace/.npm-cache
npm run dev -- --hostname 0.0.0.0
```

A aplicação usa a porta 3000. Para produção:

```bash
npm run build
npm run start -- --hostname 0.0.0.0
```

## Verificações

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Com o servidor de produção na porta 3000, `python tests/browser-smoke.py` executa o teste funcional. Esse teste opcional requer Python com Playwright e Chromium em `/usr/bin/chromium`, já disponíveis neste ambiente; não são dependências da aplicação. Exercita criação e conclusão de tarefas, tópicos compartilhados, recarga, cronômetro, registro de sessão, exportação/importação, métricas reais, telas de 320/360/390 px e dados locais corrompidos. Usa um contexto isolado e avança apenas o relógio de teste para registrar a sessão.

## Funcionalidades

- Dashboard calculado exclusivamente a partir dos dados do usuário.
- Roadmaps para PMPE Soldado, CBMPE Soldado/Oficial e PCPE Agente, com disciplinas livres, checklist persistente e tópicos compartilhados entre concursos. Tópicos compartilhados contam uma vez no progresso geral.
- Planejamento semanal com inclusão, conclusão e exclusão de tarefas.
- Cronômetro persistente: o tempo continua entre navegação e recargas, inclusive com a aba fechada. Pause nos intervalos. Sessões registram minutos completos; mínimo de um minuto, máximo de 24 horas.
- Histórico de sessões e gráfico dos últimos sete dias, usando o dia local do navegador.
- Backup JSON versão 1 compatível com a etapa anterior. Importar substitui tarefas, tópicos e sessões e reinicia o cronômetro, após confirmação. Máximo de 10 MB, validação de campos, IDs e limites.
- Interface escura, navegação adaptada para celular, foco visível, labels, Escape e contenção de foco no menu móvel.

## Conteúdo e dados

A instalação nova começa vazia. As sugestões de disciplinas são categorias de organização, não uma declaração do conteúdo exigido nos editais. Não foram adicionadas matérias, datas ou requisitos oficiais sem fontes verificadas. Cadastre assuntos do edital escolhido e compartilhe-os entre trilhas quando forem equivalentes. A carga de conteúdos oficiais com fontes/versionamento fica pendente de conferência dos editais.

Dados existentes válidos da etapa anterior são preservados, incluindo eventuais tópicos e tarefas de exemplo já salvos. A aplicação não distingue retrospectivamente exemplos de dados pessoais: remova os exemplos manualmente se ainda existirem.

O estado é persistido em `localStorage`, na chave `aprovape-v1`. A hidratação é explícita para evitar divergências entre servidor e navegador. Dados inválidos não são sobrescritos automaticamente; a interface permite importar backup ou apagar os dados com confirmação. Se o navegador impedir gravações ou atingir sua cota, um aviso solicita exportação. Faça backups: esta etapa não sincroniza dispositivos, não tem autenticação e não oferece banco remoto.

## Arquitetura

- `src/app/page.tsx`: shell de navegação e dashboard.
- `src/components/roadmap.tsx`: organização e compartilhamento dos assuntos.
- `src/components/planner.tsx`: tarefas semanais.
- `src/components/study-timer.tsx`: sessão de foco e histórico.
- `src/components/backup-panel.tsx`: exportação, importação e limpeza.
- `src/lib/data.ts`: modelos e categorias.
- `src/lib/store.ts`: ações, persistência e recuperação.
- `src/lib/validation.ts`: validação compartilhada entre armazenamento e backup.
- `tests/`: validação e teste funcional de navegador.

Próximas etapas: conteúdos oficiais conferidos, módulos/aulas, questões/simulados, caderno de erros, revisões, metas e TAF. Supabase e tutor de IA seguem como integrações futuras. Nenhuma dessas funcionalidades futuras é simulada nesta versão.
