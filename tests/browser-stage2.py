import json
from datetime import datetime,timedelta
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},timezone_id='America/Recife')
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:3000');page.get_by_role('heading',name='Visão geral',exact=True).wait_for()
 page.on('dialog',lambda d:d.accept())
 def nav(name):
  if page.get_by_role('button',name='Abrir menu').is_visible():page.get_by_role('button',name='Abrir menu').click()
  page.get_by_role('navigation',name='Navegação principal').get_by_role('button',name=name,exact=True).click()
 # Legacy storage migrates without losing previous tasks or sessions.
 legacy={'tasks':[{'id':'legacy-task','title':'Tarefa antiga','day':1,'done':True}],'topics':[{'id':'legacy-topic','subject':'Português','title':'Assunto antigo','exam':'PMPE — Soldado','done':False}],'sessions':[{'id':'legacy-session','subject':'Português','minutes':25,'date':'2026-10-10T15:00:00.000Z'}]}
 page.evaluate('(s)=>localStorage.setItem("aprovape-v1",JSON.stringify({state:s,version:0}))',legacy);page.reload()
 nav('Cronômetro');assert page.get_by_text('25 min',exact=True).is_visible()
 nav('Metas');page.get_by_label('Meta diária (min)',exact=True).fill('45');page.get_by_label('Meta semanal (min)',exact=True).fill('225');page.get_by_role('button',name='Salvar preferências').click()
 page.reload();nav('Metas');assert page.get_by_label('Meta diária (min)',exact=True).input_value()=='45'
 # Structured, reviewed import is append-only and ignores duplicates.
 nav('Editais');page.get_by_label('Referência oficial (opcional)').fill('https://www.sds.pe.gov.br/')
 page.get_by_label('Conteúdo do edital',exact=True).fill('Direito | Assunto novo\nDireito | Assunto novo')
 page.get_by_role('button',name='Importar para o roadmap').click();assert page.get_by_text('1 assunto(s) novo(s)',exact=False).is_visible()
 nav('Roadmap');assert page.get_by_label('Concluir Assunto antigo').is_visible();assert page.get_by_label('Concluir Assunto novo').is_visible()
 page.get_by_text('Anotações e revisão',exact=True).nth(1).click()
 page.get_by_label('Anotações de Assunto novo').fill('Resumo conferido')
 page.get_by_role('button',name='Salvar anotações',exact=True).click()
 page.get_by_role('button',name='Agendar revisão',exact=True).click()
 nav('Revisões');page.get_by_label('Mostrar próximas revisões').check();assert page.get_by_role('heading',name='Assunto novo',exact=True).is_visible()
 # Simulate due day in an isolated context to exercise the review transition.
 page.evaluate("""()=>{const d=JSON.parse(localStorage.getItem('aprovape-v1'));d.state.reviews[0].dueDate='2020-01-01';localStorage.setItem('aprovape-v1',JSON.stringify(d))}""")
 page.reload();page.get_by_role('button',name='Lembrei',exact=True).click()
 data=page.evaluate("JSON.parse(localStorage.getItem('aprovape-v1')).state");assert data['reviews'][0]['step']==1;assert data['reviews'][0]['lastReviewed']
 nav('Planejamento');page.get_by_role('button',name='Gerar cronograma',exact=True).click();initial=page.evaluate("JSON.parse(localStorage.getItem('aprovape-v1')).state.tasks.length")
 assert initial>1
 page.get_by_role('button',name='Gerar cronograma',exact=True).click();assert page.evaluate("JSON.parse(localStorage.getItem('aprovape-v1')).state.tasks.length")==initial
 nav('Caderno de erros');page.get_by_label('Disciplina',exact=True).fill('Direito');page.get_by_label('Questão ou dificuldade').fill('Dúvida registrada');page.get_by_label('Correção e explicação').fill('Minha explicação');page.get_by_role('button',name='Salvar no caderno').click();page.get_by_label('Já domino este assunto').check()
 page.reload();assert page.get_by_label('Já domino este assunto').is_checked()
 nav('Cronômetro');page.get_by_label('Disciplina do registro').fill('Direito');page.get_by_label('Minutos estudados').fill('45');page.get_by_role('button',name='Adicionar registro manual').click();assert page.get_by_text('45 min',exact=True).is_visible()
 nav('Estatísticas');page.get_by_label('Período das estatísticas').select_option('7');assert page.get_by_text('Direito',exact=True).is_visible()
 with page.expect_download() as csv:page.get_by_role('button',name='Exportar sessões CSV').click()
 assert 'Direito' in open(csv.value.path(),encoding='utf-8-sig').read()
 # Cross-tab changes rehydrate without generating a storage write loop.
 other=context.new_page();other.goto('http://localhost:3000/#roadmap');other.get_by_label('Nome do assunto').fill('Outra aba');other.get_by_role('button',name='Adicionar tópico').click();page.wait_for_timeout(500)
 nav('Roadmap');assert page.get_by_label('Concluir Outra aba').is_visible();other.close()
 nav('Backup')
 with page.expect_download() as download:page.get_by_role('button',name='Baixar backup JSON').click()
 backup=json.load(open(download.value.path()));assert backup['version']==2;assert backup['data']['preferences']['dailyGoal']==45;assert len(backup['data']['reviews'])==1;assert backup['data']['mistakes'][0]['resolved']
 page.locator('input[type=file]').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
 page.reload();nav('Caderno de erros');assert page.get_by_label('Já domino este assunto').is_checked()
 # Exercise the actual search request and displayed result/fallback.
 nav('Editais')
 with page.expect_response(lambda r:'/api/editais?' in r.url,timeout=30000) as search_response:
  page.get_by_role('button',name='Buscar publicações').click()
 payload=search_response.value.json();assert search_response.value.status==200
 assert page.get_by_text(payload['message'],exact=True).is_visible()
 if all(not x['available'] for x in payload['sources']):assert payload['notices']==[]
 # Query validation rejects unrecognized competitions.

 response=page.request.get('http://localhost:3000/api/editais?exam=invalid');assert response.status==400
 nav('Visão geral');page.wait_for_timeout(1200);page.screenshot(path='/tmp/aprovape-stage2-desktop.png',full_page=True)
 for width in [390,360,320]:
  page.set_viewport_size({'width':width,'height':844})
  for name in ['Visão geral','Roadmap','Planejamento','Cronômetro','Metas','Revisões','Caderno de erros','Estatísticas','Editais','Backup']:
   nav(name);assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),(width,name)
 nav('Visão geral');page.screenshot(path='/tmp/aprovape-stage2-mobile.png',full_page=True)
 assert not errors,errors
 print('PASS: legacy migration, goal persistence, batch import, notes, review scheduling, plan generation/idempotence, mistakes, manual study, CSV, cross-tab sync, v2 backup, API validation, every view at 320/360/390px; no browser errors.')
 browser.close()
