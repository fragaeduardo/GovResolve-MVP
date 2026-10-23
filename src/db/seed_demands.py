import random
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.schema import (
    Demand,
    DemandSeverity,
    DemandStatus,
    ServiceType,
    Department,
    User,
    UserRole,
    StatusHistory,
    Feedback
)

DEMAND_TEMPLATES = [
    # 1. SEINFRA
    {
        "dept_code": "SEINFRA",
        "protocol": "GR-20261001-A1B2",
        "title": "Buraco de grande porte na Rua 87 com risco a motoristas e motociclistas",
        "description": "Cratera aberta na pista direita da Rua 87, altura do n. 450, no Setor Sul. Asfalto cedeu apos fortes chuvas, expondo a tubulacao pluvial. Varios veiculos ja tiveram pneus rasgados e ha risco de queda de motoqueiros.",
        "category": "Obras e Pavimentacao",
        "severity": DemandSeverity.ALTA,
        "severity_justification": "Risco iminente de acidentes graves em via arterial com alto fluxo de veiculos coletivos e particulares.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.EM_ANDAMENTO,
        "days_ago": 2,
        "resolution_notes": None
    },
    {
        "dept_code": "SEINFRA",
        "protocol": "GR-20260928-C3D4",
        "title": "Bueiro entupido e grade de protecao destruida na Av. T-63",
        "description": "Bueiro sem grade protetora e entupido com entulho proximo a Praca Nova Suica. Ha perigo para pedestres a noite e agua parada empossando a pista.",
        "category": "Drenagem e Bueiros",
        "severity": DemandSeverity.MEDIA,
        "severity_justification": "Risco pontual de alagamento da via e queda de pedestres em cruzamento movimentado.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.FECHADO,
        "days_ago": 5,
        "resolution_notes": "Equipe operacional da SEINFRA realizou a desobstrucao hidraulica da galeria pluvial e instalou nova grelha de ferro articulada antivandalismo."
    },

    # 2. COMURG
    {
        "dept_code": "COMURG",
        "protocol": "GR-20261002-E5F6",
        "title": "Arvore de grande porte com risco de queda sobre a rede eletrica na Rua C-137",
        "description": "Tronco centenario com raizes expostas e inclinacao severa sobre a rede de media tensao apos temporal no Jardim America. Galhos encostam nos fios gerando faiscas intermitentes.",
        "category": "Poda e Remocao de Arvores",
        "severity": DemandSeverity.CRITICA,
        "severity_justification": "Risco iminente de curto-circuito, desabastecimento de energia e perigo a vida de pedestres e moradores vizinhos.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.EM_ANDAMENTO,
        "days_ago": 1,
        "resolution_notes": None
    },
    {
        "dept_code": "COMURG",
        "protocol": "GR-20261001-G7H8",
        "title": "Acumulo de lixo e entulho em canteiro central na Av. Perimetral Norte",
        "description": "Descarte irregular continuado de restos de reformas e lixo domestico acumulado a mais de 6 dias, espalhando mau cheiro e atraindo insetos e roedores.",
        "category": "Coleta e Limpeza Urbana",
        "severity": DemandSeverity.MEDIA,
        "severity_justification": "Impacto na saude publica local e degradacao visual de corredor comercial.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.ABERTO,
        "days_ago": 2,
        "resolution_notes": None
    },

    # 3. SMS
    {
        "dept_code": "SMS",
        "protocol": "GR-20261002-I9J0",
        "title": "Falta cronica de Insulina NPH na farmacia da UBS do Setor Pedro Ludovico",
        "description": "Pacientes idosos e dependentes de insulina relatam nao conseguir atendimento farmaceutico na unidade publica municipal ha mais de dez dias seguidos.",
        "category": "Medicamentos e Farmacia Basica",
        "severity": DemandSeverity.CRITICA,
        "severity_justification": "Risco vital imediato decorrente de interrupcao de tratamento continuo para doenca metabolica cronica.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.ABERTO,
        "days_ago": 1,
        "resolution_notes": None
    },
    {
        "dept_code": "SMS",
        "protocol": "GR-20260925-K1L2",
        "title": "Foco de larvas de Aedes aegypti em piscina abandonada no Setor Bueno",
        "description": "Residencia desocupada na Rua T-30 com acumulacao de agua verde e proliferacao visivel de mosquitos transmissores da dengue e chikungunya.",
        "category": "Vigilancia Sanitaria e Zoonoses",
        "severity": DemandSeverity.ALTA,
        "severity_justification": "Risco epidemiologico coletivo de contaminacao e transmissao de arboviroses na vizinhanca.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.FECHADO,
        "days_ago": 8,
        "resolution_notes": "Equipe de Zoonoses adentrou o imovel mediante autorizacao judicial/fiscal, aplicou larvicida biologico e lacrou as entradas de agua com notificacao ao proprietario."
    },

    # 4. SMM
    {
        "dept_code": "SET",
        "protocol": "GR-20261003-M3N4",
        "title": "Semaforo em pane intermitente no cruzamento da Av. 85 com Rua 132",
        "description": "Sinalizacao semaforica congelada no amarelo piscante nos horarios de maior movimento, gerando conflitos no cruzamento e travamento do transporte coletivo.",
        "category": "Sinalizacao Semaforica",
        "severity": DemandSeverity.ALTA,
        "severity_justification": "Perigo critico de colisoes transversais em via arterial de velocidade intermediaria.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.ABERTO,
        "days_ago": 0,
        "resolution_notes": None
    },
    {
        "dept_code": "SET",
        "protocol": "GR-20260929-O5P6",
        "title": "Pintura de faixa de pedestres apagada em frente a Escola Municipal Cora Coralina",
        "description": "Faixa de travessia escolar apagada pelo trafego intenso de veiculos na Av. Universitaria, dificultando a travessia de criancas e pais nos horarios de entrada e saida.",
        "category": "Sinalizacao Viaria Horizontal",
        "severity": DemandSeverity.MEDIA,
        "severity_justification": "Necessidade de protecao a pedestres e criancas em polo gerador de trafego escolar.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.EM_ANDAMENTO,
        "days_ago": 4,
        "resolution_notes": None
    },

    # 5. AMMA
    {
        "dept_code": "AMMA",
        "protocol": "GR-20261002-Q7R8",
        "title": "Poluicao sonora excessiva de bar no Setor Marista nas madrugadas de quinta a domingo",
        "description": "Estabelecimento comercial operando com musica amplificada em calcada publica acima dos limites decibelicos permitidos apos as 2h da manha, impedindo o descanso de moradores vizinhos.",
        "category": "Poluicao Sonora",
        "severity": DemandSeverity.MEDIA,
        "severity_justification": "Perturbacao recorrente ao sossego publico e violacao de normas de controle ambiental municipal.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.ABERTO,
        "days_ago": 1,
        "resolution_notes": None
    },
    {
        "dept_code": "AMMA",
        "protocol": "GR-20260926-S9T0",
        "title": "Descarte clandestino de residuos quimicos em nascente no Parque Areiao",
        "description": "Tambores com residuos de solventes e tintas industriais abandonados na borda da mata ciliar proximo a nascente do corrego.",
        "category": "Crimes Ambientais",
        "severity": DemandSeverity.CRITICA,
        "severity_justification": "Contaminacao toxica direta de nascente hidrica em Unidade de Conservacao e Area de Preservacao Permanente.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.FECHADO,
        "days_ago": 7,
        "resolution_notes": "Fiscalizacao da AMMA efetuou a apreensao emergencial dos tambores, isolamento do perimetro contaminado e instaurou processo de autuacao contra a empresa responsavel."
    },

    # 6. SEFIN
    {
        "dept_code": "SEFAZ",
        "protocol": "GR-20261001-U1V2",
        "title": "Cobranca duplicada de taxa de iluminacao no carne do IPTU 2026",
        "description": "Contribuinte identificou duplicidade no lancamento da contribuicao de iluminacao publica em lote residencial no Setor Central.",
        "category": "Financas e IPTU",
        "severity": DemandSeverity.BAIXA,
        "severity_justification": "Inconsistencia tributaria documental sem risco a integridade fisica ou funcionamento da cidade.",
        "service_type": ServiceType.AUTOATENDIMENTO,
        "status": DemandStatus.EM_ANDAMENTO,
        "days_ago": 2,
        "resolution_notes": None
    },
    {
        "dept_code": "SEFAZ",
        "protocol": "GR-20260922-W3X4",
        "title": "Certidao Negativa de Debitos (CND) travada no sistema online da prefeitura",
        "description": "Erro sistemico ao emitir certidao negativa com cadastro plenamente regularizado para instrucao de financiamento bancario.",
        "category": "Certidoes e Cadastros",
        "severity": DemandSeverity.BAIXA,
        "severity_justification": "Demanda administrativa cadastral sanavel por rotina de suporte ao contribuinte.",
        "service_type": ServiceType.AUTOATENDIMENTO,
        "status": DemandStatus.FECHADO,
        "days_ago": 11,
        "resolution_notes": "Banco de dados da SEFIN sincronizado com a Fazenda Estadual e CND liberada para download imediato na area do contribuinte."
    },

    # 7. SME
    {
        "dept_code": "SME",
        "protocol": "GR-20261002-Y5Z6",
        "title": "Vazamento no teto do refeitorio do CMEI Vovo Clara em dias de chuva",
        "description": "Goteiras volumosas sobre as mesas de alimentacao dos alunos da creche municipal no Setor Urias Magalhaes, impedindo o servico de refeicoes.",
        "category": "Infraestrutura Escolar",
        "severity": DemandSeverity.ALTA,
        "severity_justification": "Comprometimento de higiene na alimentacao de criancas e risco de acidentes por piso molhado e gotejamento em fiacao.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.ABERTO,
        "days_ago": 1,
        "resolution_notes": None
    },
    {
        "dept_code": "SME",
        "protocol": "GR-20260927-A7B8",
        "title": "Solicitacao de inclusao de monitor de apoio para aluno autista na Escola Vila Nova",
        "description": "Crianca matriculada no 2 ano do ensino basico com laudo clinico requerendo profissional especializado para garantia de frequencia e aprendizado inclusivo.",
        "category": "Educacao Especial e Inclusao",
        "severity": DemandSeverity.MEDIA,
        "severity_justification": "Garantia de direito educacional basico e inclusao de estudante neurodivergente.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.EM_ANDAMENTO,
        "days_ago": 6,
        "resolution_notes": None
    },

    # 8. SANEAGO
    {
        "dept_code": "SANEAGO",
        "protocol": "GR-20261003-C9D0",
        "title": "Rompimento de adutora de agua potavel jorrando na Rua 90",
        "description": "Tubulacao de distribuicao rompida sob o calcamento, provocando forte enxurrada de agua tratada e rebaixamento do asfalto com risco a casas vizinhas.",
        "category": "Vazamento de Agua",
        "severity": DemandSeverity.CRITICA,
        "severity_justification": "Desperdicio em larga escala de agua potavel tratada e perigo de colapso estrutural da base da via.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.EM_ANDAMENTO,
        "days_ago": 0,
        "resolution_notes": None
    },
    {
        "dept_code": "SANEAGO",
        "protocol": "GR-20260920-E1F2",
        "title": "Refluxo de esgoto na rede coletora da Rua 104",
        "description": "Bueiro de esgoto transbordando dejetos a ceu aberto no Setor Sul com odor nauseante e passagem de agua contaminada na porta de residencias.",
        "category": "Rede de Esgoto",
        "severity": DemandSeverity.ALTA,
        "severity_justification": "Risco de doencas infectocontagiosas por contato com efluentes cloacais.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.FECHADO,
        "days_ago": 13,
        "resolution_notes": "Equipe de operacao da concessionaria acionou caminhao vacuo, removeu obstrucao de raizes na tubulacao mestra e desinfetou a sarjeta."
    },

    # 9. Concessionária de Iluminação Pública
    {
        "dept_code": "SEINFRA",
        "protocol": "GR-20261002-G3H4",
        "title": "Sequencia de 6 postes com lampadas apagadas na ciclovia do Parque Vaca Brava",
        "description": "Trecho de quase 250 metros da pista de cooper e lazer completamente as escuras no periodo noturno ha mais de duas semanas.",
        "category": "Iluminacao Publica",
        "severity": DemandSeverity.MEDIA,
        "severity_justification": "Reducao de seguranca para praticantes de esportes e transeuntes em espaco de lazer no periodo noturno.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.ABERTO,
        "days_ago": 1,
        "resolution_notes": None
    },
    {
        "dept_code": "SEINFRA",
        "protocol": "GR-20260924-I5J6",
        "title": "Poste com fiacao eletrica rompida e pendurada no ponto de onibus da Av. Anhanguera",
        "description": "Cabo condutor partido balancando na altura da cabeca dos passageiros que aguardam embarque no ponto de onibus.",
        "category": "Emergencia Eletrica",
        "severity": DemandSeverity.CRITICA,
        "severity_justification": "Risco letal iminente de choque eletrico e eletrocussao em area de grande aglomeracao popular.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.FECHADO,
        "days_ago": 9,
        "resolution_notes": "Equipe de emergencia desativou o ramal, recolheu o cabeamento rompido e substituiu o conjunto de conexao primario."
    },

    # 10. GCM
    {
        "dept_code": "AGCM",
        "protocol": "GR-20261001-K7L8",
        "title": "Depredacao e pichacao no monumento historico da Praca Civica",
        "description": "Vandalismo no patrimonio publico com danos a bancos de marmore e pichacoes no complexo historico do centro.",
        "category": "Patrimonio Publico",
        "severity": DemandSeverity.MEDIA,
        "severity_justification": "Dano continuado ao patrimonio tombado municipal e necessidade de presenca ostensiva.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.EM_ANDAMENTO,
        "days_ago": 2,
        "resolution_notes": None
    },
    {
        "dept_code": "AGCM",
        "protocol": "GR-20260918-M9N0",
        "title": "Solicitacao de ronda preventiva no horario de saida da Escola Dom Fernando",
        "description": "Pais e professores solicitam apoio de viatura municipal para coibir desordens e garantir a saida protegida dos estudantes no periodo vespertino.",
        "category": "Seguranca Preventiva Escolar",
        "severity": DemandSeverity.BAIXA,
        "severity_justification": "Prevencao de incidentes e fortalecimento da integracao comunitaria em horario de pico escolar.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.FECHADO,
        "days_ago": 15,
        "resolution_notes": "Comando da Guarda Municipal incluiu a instituicao no cronograma fixo da Ronda Escolar com presenca diaria das 17h as 18h30."
    },

    # 11. PROCON
    {
        "dept_code": "PROCON",
        "protocol": "GR-20261003-O1P2",
        "title": "Supermercado comercializando carnes com data de validade vencida no Setor Campinas",
        "description": "Consumidores flagraram pacotes de frios e cortes bovinos com etiquetas de vencimento coladas sobre datas originais vencidas ha 3 dias.",
        "category": "Direito do Consumidor e Alimentos",
        "severity": DemandSeverity.ALTA,
        "severity_justification": "Infracao a saude publica e violacao expressa ao Codigo de Defesa do Consumidor com risco de intoxicacao alimentar.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.ABERTO,
        "days_ago": 0,
        "resolution_notes": None
    },
    {
        "dept_code": "PROCON",
        "protocol": "GR-20260915-Q3R4",
        "title": "Posto de combustivel exigindo taxa de conveniencia de 5% no pagamento por debito",
        "description": "Estabelecimento comercial recusando o preco a vista anunciado e aplicando sobretaxa indevida sem aviso previo nos abastecimentos.",
        "category": "Praticas Comerciais Abusivas",
        "severity": DemandSeverity.BAIXA,
        "severity_justification": "Pratica abusiva contratual de mercado sujeita a notificacao e conciliacao.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.FECHADO,
        "days_ago": 18,
        "resolution_notes": "Fiscais do PROCON notificaram o posto de combustiveis, lavraram auto de infracao e determinaram a suspensao imediata da cobranca irregular."
    },

    # 12. SEMAS
    {
        "dept_code": "SEMASDH",
        "protocol": "GR-20261002-S5T6",
        "title": "Familia com criancas desabrigada necessitando de acolhimento sob viaduto da Av. T-63",
        "description": "Casal com tres filhos menores de idade acampados em condicao de extrema intemperie e vulnerabilidade com falta de alimentacao e agasalho.",
        "category": "Acolhimento e Vulnerabilidade",
        "severity": DemandSeverity.CRITICA,
        "severity_justification": "Grave vulnerabilidade social de menores de idade expostos a frio, fome e riscos do transito.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.EM_ANDAMENTO,
        "days_ago": 1,
        "resolution_notes": None
    },
    {
        "dept_code": "SEMASDH",
        "protocol": "GR-20260910-U7V8",
        "title": "Dificuldade de atendimento para inclusao no CadUnico no CRAS Novo Mundo",
        "description": "Moradores em situacao de vulnerabilidade enfrentando filas noturnas para conseguir senhas de atendimento do Cadastro Unico.",
        "category": "CadUnico e Beneficios",
        "severity": DemandSeverity.MEDIA,
        "severity_justification": "Garantia de acesso oportuno a beneficios sociais e politicas publicas de assistencia familiar.",
        "service_type": ServiceType.ATENDIMENTO_PUBLICO,
        "status": DemandStatus.FECHADO,
        "days_ago": 23,
        "resolution_notes": "SEMAS designou mais dois assistentes sociais para atendimento de demanda espontanea e expandiu o sistema de agendamento por WhatsApp institucional."
    }
]


async def seed_artificial_demands(session: AsyncSession) -> int:
    """
    Povoa o banco com demandas artificiais de alta fidelidade para todos os 12 orgaos municipais,
    garantindo que o usuario unificado (Carlos Eduardo da Silva) seja o autor de suas demandas e possa
    visualiza-las no painel do servidor e na aba cidadao.
    """
    # 1. Recupera o usuario Carlos Eduardo
    user_res = await session.execute(select(User).where(User.cpf == "52998224725"))
    carlos_user = user_res.scalar_one_or_none()
    if not carlos_user:
        carlos_user = User(
            cpf="52998224725",
            name="Carlos Eduardo da Silva",
            email="carlos.silva@prefeitura.gov.br",
            role=UserRole.SERVIDOR
        )
        session.add(carlos_user)
        await session.commit()
        await session.refresh(carlos_user)

    # Vincula exemplos por codigo institucional estavel, nunca por primeiro orgao.
    all_depts = (await session.execute(select(Department))).scalars().all()
    dept_map = {d.code: d.id for d in all_depts if d.code}

    # 3. Insercao de cada demanda caso seu protocolo ainda nao exista
    inserted_count = 0
    now = datetime.utcnow()

    for item in DEMAND_TEMPLATES:
        existing = await session.execute(select(Demand).where(Demand.protocol == item["protocol"]))
        if existing.scalar_one_or_none():
            continue

        target_dept_id = dept_map.get(item["dept_code"])
        created_at = now - timedelta(days=item["days_ago"], hours=random.randint(1, 10))
        updated_at = created_at + timedelta(hours=random.randint(2, 24)) if item["status"] != DemandStatus.ABERTO else created_at

        organized_summary = (
            f"Relato do Cidadao: {item['description']}\n"
            f"Setor Competente: {item['dept_code']}\n"
            f"Classificacao Factual: {item['category']} | Gravidade: {item['severity'].value}\n"
            f"Justificativa Tecnica: {item['severity_justification']}"
        )

        demand = Demand(
            protocol=item["protocol"],
            title=item["title"],
            description=item["description"],
            citizen_id=carlos_user.id,
            department_id=target_dept_id,
            status=item["status"],
            severity=item["severity"],
            severity_justification=item["severity_justification"],
            service_type=item["service_type"],
            category=item["category"],
            organized_summary=organized_summary,
            resolution_notes=item["resolution_notes"],
            created_at=created_at,
            updated_at=updated_at
        )
        session.add(demand)
        await session.flush()

        # Adiciona Historico de Status
        history_init = StatusHistory(
            demand_id=demand.id,
            old_status=None,
            new_status=DemandStatus.ABERTO,
            changed_by_id=carlos_user.id,
            notes="Demanda registrada e triada pelo sistema GovResolve.",
            created_at=created_at
        )
        session.add(history_init)

        if item["status"] in [DemandStatus.EM_ANDAMENTO, DemandStatus.FECHADO]:
            history_prog = StatusHistory(
                demand_id=demand.id,
                old_status=DemandStatus.ABERTO,
                new_status=DemandStatus.EM_ANDAMENTO,
                changed_by_id=carlos_user.id,
                notes="Encaminhado para a equipe tecnica do orgao para analise de campo.",
                created_at=created_at + timedelta(hours=2)
            )
            session.add(history_prog)

        if item["status"] == DemandStatus.FECHADO:
            history_done = StatusHistory(
                demand_id=demand.id,
                old_status=DemandStatus.EM_ANDAMENTO,
                new_status=DemandStatus.FECHADO,
                changed_by_id=carlos_user.id,
                notes=item["resolution_notes"] or "Demanda concluida.",
                created_at=updated_at
            )
            session.add(history_done)

            # Adiciona feedback do cidadao para demandas fechadas
            feedback = Feedback(
                demand_id=demand.id,
                citizen_id=carlos_user.id,
                rating=5 if item["severity"] in [DemandSeverity.CRITICA, DemandSeverity.ALTA] else 4,
                comment="Atendimento rapido e resolucao satisfatoria pelo orgao municipal.",
                created_at=updated_at + timedelta(hours=1)
            )
            session.add(feedback)

        inserted_count += 1

    await session.commit()
    return inserted_count
