import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parent/'fixtures'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1280,'height':900});page=context.new_page();errors=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:external.append(r.url) if not r.url.startswith('http://localhost:3000') else None)
 page.on('dialog',lambda d:d.accept())
 page.goto('http://localhost:3000/#editais');page.get_by_label('Selecionar edital PDF').wait_for();assert page.locator('.error-banner').count()==0
 page.get_by_label('Selecionar edital PDF').set_input_files(str(root/'syllabus-synthetic.pdf'))
 page.get_by_label('Disciplina 1',exact=True).wait_for(timeout=30000)
 assert page.get_by_label('Assunto 1',exact=True).input_value()=='Interpretação de texto.'
 assert page.get_by_label('Disciplina 4',exact=True).input_value()=='INFORMÁTICA'
 assert not page.get_by_role('button',name='Importar assuntos do PDF').is_enabled()
 page.get_by_label('Assunto 1',exact=True).fill('Texto revisado pelo usuário')
 page.get_by_label('Selecionar assunto 2',exact=True).uncheck()
 page.get_by_label('Conferi o cargo, o concurso e os assuntos selecionados',exact=False).check()
 page.get_by_role('button',name='Importar assuntos do PDF').click()
 assert page.get_by_text('3 assunto(s) novo(s) importado(s)',exact=False).is_visible()
 state=page.evaluate("JSON.parse(localStorage.getItem('aprovape-v1')).state")
 assert len(state['topics'])==3;assert any(t['title']=='Texto revisado pelo usuário' for t in state['topics'])
 assert all('syllabus-synthetic.pdf' in t['notes'] for t in state['topics'])
 page.get_by_role('button',name='Abrir meu roadmap').click()
 page.get_by_label('Concluir Texto revisado pelo usuário').check();page.reload();assert page.get_by_label('Concluir Texto revisado pelo usuário').is_checked()
 page.goto('http://localhost:3000/#editais');page.get_by_label('Selecionar edital PDF').set_input_files(str(root/'syllabus-synthetic.pdf'));page.get_by_label('Disciplina 1',exact=True).wait_for()
 page.get_by_label('Conferi o cargo, o concurso e os assuntos selecionados',exact=False).check();page.get_by_role('button',name='Importar assuntos do PDF').click()
 state=page.evaluate("JSON.parse(localStorage.getItem('aprovape-v1')).state")
 assert len(state['topics'])==5 # only original text and the earlier unchecked topic are new
 assert any(t['title']=='Texto revisado pelo usuário' and t['done'] for t in state['topics'])
 page.get_by_label('Selecionar edital PDF').set_input_files(str(root/'no-text.pdf'));page.get_by_text('Não foi encontrado texto selecionável.',exact=False).wait_for()
 assert page.evaluate("JSON.parse(localStorage.getItem('aprovape-v1')).state.topics.length")==5
 page.get_by_label('Selecionar edital PDF').set_input_files(str(root/'password-protected.pdf'));page.get_by_text('Este PDF está protegido por senha.',exact=False).wait_for()
 page.get_by_label('Selecionar edital PDF').set_input_files({'name':'invalid.pdf','mimeType':'application/pdf','buffer':b'not-a-pdf'});page.get_by_text('O arquivo não tem uma assinatura PDF válida.',exact=False).wait_for()
 page.get_by_label('Selecionar edital PDF').set_input_files({'name':'broken.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.7\nbroken content'});page.get_by_text('O PDF está danificado',exact=False).wait_for()
 page.set_viewport_size({'width':320,'height':844});page.get_by_label('Selecionar edital PDF').set_input_files(str(root/'syllabus-synthetic.pdf'));page.get_by_label('Disciplina 1',exact=True).wait_for()
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 page.screenshot(path='/tmp/aprovape-pdf-mobile.png',full_page=True)
 assert not external,external
 assert not errors,errors
 print('PASS: real PDF extraction, local worker/no external requests, editable preview, confirmation, selection, import, references, completion persistence, deduplication, image-only/password/invalid files, mobile layout; no browser errors.')
 browser.close()
