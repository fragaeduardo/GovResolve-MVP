"""Gera os dois entregáveis da atividade com fontes, diagramas e telas locais."""
from pathlib import Path
from html import escape
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, A3, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'docs/apresentacao'
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
FONT_DIR = Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('DejaVu', str(FONT_DIR/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', str(FONT_DIR/'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold', italic='DejaVu', boldItalic='DejaVu-Bold')
TEAL = colors.HexColor('#0D3B42')
MUTED = colors.HexColor('#547277')
PALE = colors.HexColor('#E6F1EE')
BORDER = colors.HexColor('#C7D8D4')
ORANGE = colors.HexColor('#F4A261')
INK = colors.HexColor('#263C45')
TEAM = [
    ('Eduardo Fraga Pereira', '202405847'),
    ('Ralph dos Reis Torres', '202406925'),
    ('Samuel Amorim Jaime', '202205559'),
    ('Wender Viana Faria Santos', '202401832'),
]
PROMPT_UML = '''Atue como engenheiro de software. O GovResolve organiza demandas municipais por conversa: a IA distingue orientação de reclamação, monta uma ficha, sugere o órgão depois de reunir os dados e solicita aprovação. Correções retornam à conversa; a confirmação precede gravidade e registro. Use o código local atualizado sobre a main 8794ee39 e os requisitos RF001-RF016 e RNF001, RNF002, RNF006 e RNF007. RF005 e RNF005 foram removidos do escopo local. Produza classes com atributos, operações reais e multiplicidades; componentes com responsabilidades, interfaces e dependências; e uma sequência coerente do registro. Relacione os elementos aos requisitos e às telas. Preserve orientação sem protocolo, revisão humana e os limites do MVP acadêmico. Não acrescente autenticação gov.br, e-mail, prazo oficial ou comportamento não implementado. Revise manualmente as imagens, simplifique os rótulos e mantenha fundo branco opaco. Entregue fontes PlantUML, imagens e um PDF simples, legível e intuitivo.'''
PROMPT_UX = '''Atue como designer de UX/UI e documentador. O público do GovResolve inclui cidadãos, servidores e gestores. Documente o MVP navegável real, com acesso demonstrativo, conversa, coleta progressiva, ficha para revisão, confirmação, protocolo, consulta, tratamento e gestão. Relacione RF001-RF016 às telas e aos diagramas, considerando RNF002 para legibilidade, teclado e contraste e RNF007 para fidelidade do relato. Mostre o fluxo principal do diagrama de sequência e o retorno à conversa quando o cidadão pede ajustes. Use capturas reais da interface com dados fictícios identificados. Explique a escolha de órgãos pelo servidor, a fila da Ouvidoria e os estados ABERTO, EM ANDAMENTO e FECHADO. Inclua público-alvo, navegação, telas, link de execução, matriz, ferramentas e este prompt consolidado. Não apresente login simulado como gov.br real, não invente prazo ou resultado de avaliação com usuários. Monte um PDF simples, claro e intuitivo; a navegação ao vivo será feita pela equipe no MVP.'''
TRACE = [
 ('RF001 - Autenticação', 'Usuário; API com JWT e perfis; pré-condição da sequência.', 'Acesso demonstrativo por perfil; gov.br futuro.'),
 ('RF002 - Registro', 'Demanda; DemandService.create_demand(); sequência e fluxo de agentes.', 'Nova demanda: conversa, ficha e confirmação.'),
 ('RF003 - Protocolo', 'Demanda.protocol; retorno do serviço de demandas.', 'Confirmação do registro e número do protocolo.'),
 ('RF004 - Acompanhamento', 'Demanda; histórico; get_demand_by_protocol().', 'Meus protocolos: lista, filtros e detalhe.'),
 ('RF005 - Fora do escopo', 'Notificações por e-mail removidas da versão local.', 'Atualizações consultadas na plataforma.'),
 ('RF006 - Forma de atendimento', 'Atendimento inteligente; classificação contextual da intenção.', 'Chat distingue orientação e reclamação.'),
 ('RF007 - Orientação', 'Saída de autoatendimento no fluxo de agentes.', 'Instruções e link do catálogo; sem protocolo.'),
 ('RF008 - Classificação', 'Órgão; categoria da demanda; sugestão com ficha completa.', 'Categoria e órgão sugerido na revisão da ficha.'),
 ('RF009 - Organização', 'SessionStore; descrição da demanda; ciclo de revisão.', 'Ficha organizada; “Não, quero ajustar” retoma o chat.'),
 ('RF010 - Encaminhamento', 'Vínculo Demanda-Órgão; atribuição pela Ouvidoria.', 'Protocolo mostra destino; gestão revisa casos sem órgão.'),
 ('RF011 - Consulta do servidor', 'Usuário, órgãos e demandas; REST da equipe.', 'Fila operacional com escopo, filtros e prioridade.'),
 ('RF012 - Status', 'Demanda.status; histórico; update_status().', 'ABERTO > EM ANDAMENTO > FECHADO.'),
 ('RF013 - Controle de acesso', 'Papéis, vínculos, JWT e autorização da API.', 'Ambientes de cidadão, servidor e gestão.'),
 ('RF014 - Conclusão', 'Demanda.resolution_notes; histórico; update_status().', 'Parecer ao encerrar; resultado disponível na consulta.'),
 ('RF015 - Avaliação', 'Avaliação; vínculo com demanda; add_feedback().', 'Nota e comentário em demanda fechada.'),
 ('RF016 - Gravidade', 'SeverityClassificationAgent após aprovação, antes da tool.', 'Gravidade e justificativa no registro e no atendimento.'),
]


def clean(text):
    return str(text).replace('\u2014', '-').replace('\u2013', '-').replace('\u2011', '-')


class Document:
    def __init__(self, name, title):
        self.path = OUT/name
        self.c = canvas.Canvas(str(self.path), pagesize=landscape(A4), pageCompression=1)
        self.c.setTitle(title)
        self.c.setAuthor('Grupo 10 - Ctrl+Z | BCC / INF-UFG')
        self.c.setSubject('Engenharia de Software - Projeto UML e UX/UI - 2026')
        self.n = 0

    def page(self, title, category, size=None):
        if self.n:
            self.c.showPage()
        self.n += 1
        self.w, self.h = size or landscape(A4)
        self.c.setPageSize((self.w, self.h))
        self.c.setFillColor(colors.white)
        self.c.rect(0, 0, self.w, self.h, fill=1, stroke=0)
        self.c.setFillColor(TEAL)
        self.c.rect(0, self.h-7, self.w, 7, fill=1, stroke=0)
        self.text(category.upper(), 42, self.h-35, 9, MUTED, bold=True)
        self.text(title, 42, self.h-70, 24, TEAL, bold=True)

    def text(self, text, x, y, size=12, color=INK, bold=False):
        self.c.setFont('DejaVu-Bold' if bold else 'DejaVu', size)
        self.c.setFillColor(color)
        self.c.drawString(x, y, clean(text))

    def para(self, text, x, top, width, size=12, leading=None, color=INK, bold=False):
        style = ParagraphStyle('body', fontName='DejaVu-Bold' if bold else 'DejaVu', fontSize=size, leading=leading or size*1.4, textColor=color)
        paragraph = Paragraph(clean(text), style)
        _, height = paragraph.wrap(width, self.h)
        assert top-height >= 43, (self.path.name, self.n, text[:60], top-height)
        paragraph.drawOn(self.c, x, top-height)
        return height

    def card(self, x, y, width, height, title, body):
        self.c.setFillColor(PALE)
        self.c.setStrokeColor(BORDER)
        self.c.roundRect(x, y, width, height, 9, fill=1, stroke=1)
        title_height = self.para(escape(title), x+15, y+height-15, width-30, 13, color=TEAL, bold=True)
        self.para(body, x+15, y+height-27-title_height, width-30, 11.2, color=INK)

    def picture(self, path, box, crop=None):
        im = Image.open(path).convert('RGB')
        if crop:
            im = im.crop(crop)
        x, y, width, height = box
        factor = min(width/im.width, height/im.height)
        dw, dh = im.width*factor, im.height*factor
        self.c.drawImage(ImageReader(im), x+(width-dw)/2, y+(height-dh)/2, width=dw, height=dh)

    def table(self, rows, top=490):
        style = ParagraphStyle('cell',fontName='DejaVu',fontSize=10.5,leading=14,textColor=INK)
        head_style = ParagraphStyle('head',fontName='DejaVu-Bold',fontSize=10.5,leading=14,textColor=colors.white)
        cells = [[Paragraph(t, head_style) for t in ['Requisito','Elementos UML','Tela / interação']]]
        cells += [[Paragraph(escape(clean(cell)), style) for cell in row] for row in rows]
        table = Table(cells, colWidths=[165,310,self.w-84-475])
        table.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),TEAL),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F3F7F6')]),
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),
            ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
            ('LINEBELOW',(0,0),(-1,0),0.5,TEAL),
            ('LINEBELOW',(0,1),(-1,-1),0.35,BORDER),
        ]))
        _, height = table.wrap(self.w-84,self.h)
        assert top-height > 55, (self.path.name,self.n,height)
        table.drawOn(self.c,42,top-height)

    def cover(self, subtitle, ux=False):
        self.page('GovResolve', 'BCC / INF-UFG | Engenharia de Software')
        self.text(subtitle,42,self.h-113,21,TEAL,bold=True)
        self.para('Registro e acompanhamento de demandas municipais com apoio de IA e aprovação do cidadão.',42,self.h-140,self.w-84,15,leading=21)
        y=245; gap=16; width=(self.w-84-2*gap)/3
        cards = [
            ('Cidadãos','Descrever o problema com linguagem natural e acompanhar o protocolo.'),
            ('Servidores','Consultar a fila do órgão e registrar a evolução do atendimento.'),
            ('Gestores','Revisar encaminhamentos e acompanhar indicadores por órgão.'),
        ] if ux else [
            ('Classes','Dados, operações e multiplicidades do atendimento.'),
            ('Componentes','Portais, interfaces REST, agentes e persistência.'),
            ('Sequência','Conversa, revisão, aprovação e criação do protocolo.'),
        ]
        for i,(title,body) in enumerate(cards):self.card(42+i*(width+gap),y,width,102,title,body)
        self.text('Grupo 10 - Ctrl+Z',42,210,14,TEAL,bold=True)
        for i,(name,registration) in enumerate(TEAM):
            self.text(f'{name}  |  {registration}',42,183-i*23,11.5)
    def diagram(self, title, stem, tag, intro=None):
        self.page(title,'Modelagem UML')
        self.c.setFont('DejaVu',8.5)
        self.c.setFillColor(MUTED)
        self.c.drawRightString(self.w-42,self.h-70,clean(tag))
        if intro:
            self.text(intro,42,self.h-96,9.2,MUTED)
        self.picture(ASSETS/'diagramas'/f'{stem}.png',(42,50,self.w-84,self.h-155))

    def screen(self, title, stem, tag, crop=None):
        self.page(title,'UX/UI | Tela do MVP')
        self.c.setFont('DejaVu',10)
        self.c.setFillColor(MUTED)
        self.c.drawRightString(self.w-42,self.h-70,clean(tag))
        self.picture(ASSETS/'telas'/f'{stem}.png',(42,48,self.w-84,self.h-132),crop)

    def save(self):
        self.c.save()
        reader=PdfReader(str(self.path))
        assert len(reader.pages)==self.n
        assert all(page.extract_text().strip() for page in reader.pages)
        return self.path


def make_uml():
    doc=Document('GovResolve_Modelagem_UML.pdf','GovResolve - Modelagem UML e rastreabilidade')
    doc.cover('Modelagem UML e rastreabilidade')
    doc.diagram('Classes: dados e responsabilidades','01_classes','RF002-RF004 | RF008 | RF011-RF016','Entidades mantêm os dados; DemandService realiza as operações.')
    doc.diagram('Componentes','02_componentes','RF001-RF004 | RF006-RF016')
    doc.diagram('Sequência do registro','03_sequencia','RF002 | RF003 | RF008 | RF009 | RF010 | RF016','A aprovação precede a gravidade e o protocolo; correções retornam à conversa.')
    for i in range(2):
        doc.page(f'Rastreabilidade {i+1}/2','Apêndice | Requisitos, UML e interface')
        doc.table(TRACE[i*8:(i+1)*8],top=490)
    doc.page('Fluxo multiagente completo','Apêndice | Referência para consulta',size=A3)
    doc.picture(ASSETS/'diagramas/04_multiagentes_tools.png',(40,50,doc.w-80,doc.h-150))
    return doc.save()


def make_ux():
    doc=Document('GovResolve_UX_UI.pdf','GovResolve - UX/UI e protótipo navegável')
    doc.cover('UX/UI e protótipo navegável',ux=True)
    doc.page('Fluxo principal de navegação','UX/UI | Do relato ao acompanhamento')
    labels=[('Entrar','Escolher perfil de demonstração.','RF001 / RF013'),('Conversar','Descrever e complementar o relato.','RF006 / RF009'),('Revisar ficha','Conferir dados e órgão sugerido.','RF008 / RF009'),('Confirmar','Registrar e receber o protocolo.','RF002 / RF003 / RF016'),('Acompanhar','Consultar status, parecer e avaliação.','RF004 / RF015')]
    width=(doc.w-84-4*14)/5
    for i,(title,body,rf) in enumerate(labels):
        x=42+i*(width+14)
        doc.card(x,345,width,145,f'{i+1}. {title}',body)
        doc.text(rf,x+12,359,7.8,MUTED)
        if i<4:
            doc.c.setStrokeColor(TEAL);doc.c.line(x+width+2,415,x+width+11,415)
            p=doc.c.beginPath();p.moveTo(x+width+7,418);p.lineTo(x+width+12,415);p.lineTo(x+width+7,412);doc.c.drawPath(p,stroke=1,fill=0)
    doc.para('<b>Precisa ajustar?</b> Volte à conversa. A ficha recebe uma nova versão e é apresentada outra vez para aprovação.',42,320,doc.w-84,13)
    doc.card(42,166,(doc.w-100)/2,94,'Orientação de serviço','Instruções e link do catálogo quando não é necessário abrir uma reclamação. Sem protocolo.')
    doc.card((doc.w+16)/2,166,(doc.w-100)/2,94,'Atendimento público','Servidor trata a demanda. O gestor pode revisar destinos indefinidos e acompanhar indicadores.')
    doc.para('<b>Decisões de UX:</b> linguagem direta, coleta progressiva, confirmação explícita, feedback de estado, navegação por perfil e recursos de tema e contraste.',42,133,doc.w-84,11.7)
    doc.text('A demonstração ao vivo será conduzida pela equipe no MVP.',42,65,10,MUTED)
    doc.text('As capturas nas páginas seguintes usam dados fictícios.',42,45,9,MUTED)
    main_crop=(28,110,2132,1365)
    doc.screen('Acesso: cada perfil tem seu ambiente','01_acesso','RF001 | RF013',crop=(170,390,1990,1190))
    doc.screen('Conversa: pedir só o que ainda falta','02_conversa','RF006 | RF009',crop=main_crop)
    doc.screen('Revisão: o cidadão decide antes de registrar','03_revisao','RF002 | RF008 | RF009 | RF010',crop=main_crop)
    doc.screen('Protocolo: confirmação e próximo passo','04_protocolo','RF003 | RF004 | RF016',crop=main_crop)
    doc.screen('Acompanhamento: informações reunidas','05_acompanhamento','RF004 | RF014 | RF015',crop=main_crop)
    doc.screen('Servidor: fila do órgão e tratamento','06_servidor','RF011 | RF012 | RF013 | RF014 | RF016',crop=(120,110,2050,1330))
    doc.screen('Gestão: indicadores e revisão humana','07_gestao','RF010 | RF013',crop=(120,110,2050,1245))
    for i in range(2):
        doc.page(f'Rastreabilidade {i+1}/2','Apêndice | Requisitos, UML e telas do MVP')
        doc.table(TRACE[i*8:(i+1)*8],top=490)
    return doc.save()


if __name__=='__main__':
    paths=[make_uml(),make_ux()]
    (ASSETS/'prompts.md').write_text('# Prompts de consolidação\n\nSíntese estruturada dos pedidos da conversa, aplicada à revisão e montagem desta entrega. Não representa uma transcrição literal de um único prompt histórico.\n\n## Modelagem UML\n\n'+PROMPT_UML+'\n\n## UX/UI\n\n'+PROMPT_UX+'\n\nPedidos diretos da conversa que orientaram a revisão: “Confira com base no github se todas as informações estão corretas”; “mantenha a apresentação PDF simples e intuitiva”.\n')
    for path in paths:print(path.name, len(PdfReader(str(path)).pages),'páginas')
