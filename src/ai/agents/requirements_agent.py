import re
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from src.ai.agents.session_store import AgentSession


class RequirementsResult(BaseModel):
    is_greeting_only: bool = False
    topic_identified: bool = False
    is_self_service: bool = False
    service_type: str = "ATENDIMENTO_PUBLICO"
    department_name: Optional[str] = None
    category: Optional[str] = None
    problem_type: Optional[str] = None
    mandatory_slots: List[str] = []
    optional_slots: List[str] = []
    self_service_link: Optional[str] = None
    self_service_instructions: Optional[str] = None


class RequirementsAgent:
    """
    Agente Mapeador de Requisitos e Slots do GovResolve.
    
    Responsabilidades:
    1. Identificar o tipo de problema e o órgão competente responsável;
    2. Discriminar se a solicitação é de Autoatendimento ou Atendimento Público (zeladoria);
    3. Definir a lista de requisitos mandatórios e opcionais que o coletor deve rastrear
       e que o Agente Conversacional deve solicitar ao cidadão.
    """

    GREETINGS = {
        "oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", 
        "e ai", "e aí", "tudo bem", "opa", "alo", "alô", "preciso de ajuda",
        "como funciona", "tem alguem ai", "tem alguém aí"
    }

    @classmethod
    def is_pure_greeting(cls, text: str) -> bool:
        cleaned = re.sub(r"[^\w\s]", "", text.strip().lower())
        words = cleaned.split()
        if not words:
            return True
        if len(words) <= 3 and any(cleaned == g or cleaned.startswith(g) for g in cls.GREETINGS):
            complaint_triggers = [
                "buraco", "asfalto", "rua", "lixo", "poste", "luz", "lampada",
                "vazamento", "agua", "esgoto", "arvore", "posto", "remedio", "onibus",
                "semáforo", "semaforo", "iptu", "certidao", "certidão", "sinalizacao", "sinalização"
            ]
            if not any(trigger in cleaned for trigger in complaint_triggers):
                return True
        return False

    @classmethod
    def analyze(cls, user_text: str) -> RequirementsResult:
        text_lower = user_text.lower().strip()

        # 1. Saudação Pura
        if cls.is_pure_greeting(text_lower):
            return RequirementsResult(
                is_greeting_only=True,
                topic_identified=False
            )

        # 2. Autoatendimento (IPTU, Certidões, Guias)
        if any(w in text_lower for w in ["iptu", "certidao", "certidão", "2 via", "segunda via", "boleto de taxa", "quitar debito", "segunda via de iptu"]):
            if "iptu" in text_lower:
                return RequirementsResult(
                    topic_identified=True,
                    is_self_service=True,
                    service_type="AUTOATENDIMENTO",
                    department_name="SEFIN — Secretaria Municipal de Finanças",
                    category="Tributos Municipais",
                    problem_type="segunda_via_iptu",
                    self_service_link=None,
                    self_service_instructions=(
                        "1. Acesse o portal de servicos do municipio por um endereco confirmado pela prefeitura.\n"
                        "2. Informe a inscrição municipal do imóvel ou o CPF do proprietário.\n"
                        "3. Verifique as opcoes de emissao e pagamento apresentadas pelo orgao."
                    )
                )
            else:
                return RequirementsResult(
                    topic_identified=True,
                    is_self_service=True,
                    service_type="AUTOATENDIMENTO",
                    department_name="SEFIN — Secretaria Municipal de Finanças",
                    category="Certidões e Regularidade",
                    problem_type="emissao_certidao",
                    self_service_link=None,
                    self_service_instructions=(
                        "1. Localize o servico de certidoes no site oficial do municipio.\n"
                        "2. Digite o número de CPF ou CNPJ.\n"
                        "3. Siga as instrucoes de identificacao e emissao do orgao."
                    )
                )

        # 3. Zeladoria e Atendimento Público Municipal
        dept_name = None
        category = None
        prob_type = None

        if any(w in text_lower for w in [
            "patrulhamento", "guarda", "vandalismo",
            "prédio público", "predio publico", "depredação", "depredacao"
        ]):
            dept_name = "GCM — Guarda Civil Metropolitana"
            category = "Segurança Urbana"
            prob_type = "seguranca_patrulhamento"
        elif any(w in text_lower for w in ["semaforo", "semáforo", "sinal", "transito", "trânsito", "onibus", "ônibus", "faixa", "fiscalizacao", "sinalizacao", "sinalização"]):
            dept_name = "SMM — Secretaria Municipal de Mobilidade e Trânsito"
            category = "Mobilidade e Trânsito"
            prob_type = "transito_sinalizacao"
        elif any(w in text_lower for w in ["buraco", "asfalto", "cratera", "pavimentacao", "pavimentação", "bueiro", "galeria", "sarjeta"]):
            dept_name = "SEINFRA — Secretaria Municipal de Infraestrutura Urbana"
            category = "Obras e Pavimentação"
            prob_type = "buraco_asfalto"
        elif any(w in text_lower for w in ["poste", "luz", "iluminacao", "iluminação", "lampada", "lâmpada", "apagada", "escuridao", "fiação"]):
            dept_name = "Concessionária de Iluminação Pública"
            category = "Iluminação Pública"
            prob_type = "iluminacao_publica"
        elif any(w in text_lower for w in ["vazamento", "agua", "água", "esgoto", "cano estourado", "hidrometro", "falta de agua"]):
            dept_name = "SANEAGO — Companhia de Saneamento"
            category = "Saneamento Básico"
            prob_type = "saneamento_agua_esgoto"
        elif any(w in text_lower for w in ["lixo", "entulho", "arvore", "árvore", "poda", "praca", "praça", "limpeza", "varricao", "varrição", "mato"]):
            dept_name = "COMURG — Companhia de Urbanização"
            category = "Limpeza Urbana e Urbanização"
            prob_type = "limpeza_entulho_poda"
        elif any(w in text_lower for w in ["posto", "ubs", "upa", "medico", "médico", "remedio", "medicamento", "saude", "saúde", "dengue", "vacina"]):
            dept_name = "SMS — Secretaria Municipal de Saúde"
            category = "Saúde Pública"
            prob_type = "saude_atendimento"
        elif any(w in text_lower for w in ["som", "barulho", "poluicao", "poluição", "desmatamento", "ambiental", "crime ambiental"]):
            dept_name = "AMMA — Agência Municipal do Meio Ambiente"
            category = "Meio Ambiente"
            prob_type = "meio_ambiente_fiscalizacao"
        elif any(w in text_lower for w in ["escola", "creche", "cmei", "merenda", "professor", "vaga escolar"]):
            dept_name = "SME — Secretaria Municipal de Educação"
            category = "Educação Básica"
            prob_type = "educacao_escolar"
        elif any(w in text_lower for w in ["procon", "preco abusivo", "preço abusivo", "cobranca indevida", "cobrança indevida", "propaganda enganosa", "direito do consumidor"]):
            dept_name = "PROCON Municipal"
            category = "Defesa do Consumidor"
            prob_type = "consumidor_fiscalizacao"
        elif any(w in text_lower for w in ["semas", "morador de rua", "situacao de rua", "acolhimento", "social"]):
            dept_name = "SEMAS — Secretaria Municipal de Desenvolvimento Humano e Social"
            category = "Assistência Social"
            prob_type = "assistencia_social"

        if dept_name is None:
            return RequirementsResult(
                topic_identified=False,
                is_greeting_only=False,
                is_self_service=False
            )

        # Esquema obrigatório de requisitos/slots para atendimento público
        # Requisitos dependem da natureza do servico, nao sao universais.
        local_services = {
            "buraco_asfalto", "transito_sinalizacao", "iluminacao_publica",
            "saneamento_agua_esgoto", "limpeza_entulho_poda",
            "meio_ambiente_fiscalizacao", "seguranca_patrulhamento",
        }
        mandatory = ["logradouro", "bairro"] if prob_type in local_services else ["relato"]
        if prob_type in {"buraco_asfalto", "transito_sinalizacao"}:
            mandatory.append("referencia")
        optional = ["detalhes", "referencia"] if "referencia" not in mandatory else ["detalhes"]

        return RequirementsResult(
            topic_identified=True,
            is_self_service=False,
            service_type="ATENDIMENTO_PUBLICO",
            department_name=dept_name,
            category=category,
            problem_type=prob_type,
            mandatory_slots=mandatory,
            optional_slots=optional
        )


# Alias para compatibilidade
SlotMappingAgent = RequirementsAgent
SlotMappingResult = RequirementsResult
