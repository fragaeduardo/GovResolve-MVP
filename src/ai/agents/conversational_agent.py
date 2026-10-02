import logging
from typing import List, Dict, Optional
from src.ai.agents.session_store import AgentSession

logger = logging.getLogger("govresolve.ai.conversational")


class ConversationalAgent:
    """
    Agente Conversacional Empático.
    Conduz o diálogo com o cidadão de forma humanizada, institucional e sóbria:
    - Responde cordialmente a saudações sem antecipar protocolos;
    - Pergunta pontualmente e naturalmente pelos slots que ainda faltam;
    - Mantém o foco sem sobrecarregar o cidadão com muitos questionamentos de uma só vez.
    """

    @classmethod
    def generate_greeting_reply(cls) -> str:
        return (
            "Olá! Sou o assistente virtual do GovResolve. Como posso ajudar você hoje? "
            "Você pode me relatar um problema em sua rua (como buraco, iluminação, lixo ou vazamento) "
            "ou tirar dúvidas sobre serviços municipais."
        )

    @classmethod
    def generate_next_question(
        cls,
        session: AgentSession,
        missing_slots: List[str]
    ) -> str:
        dept = session.department_name or "órgão municipal competente"
        collected = session.collected_slots

        # Se falta o logradouro (rua/avenida)
        if "logradouro" in missing_slots:
            if "bairro" in missing_slots:
                return (
                    f"Compreendi o problema relatado. Para que a equipe técnica da {dept} possa planejar o atendimento, "
                    f"por favor, me informe o endereço e a localização onde o fato está ocorrendo (nome da rua ou avenida e o bairro/setor)."
                )
            else:
                bairro = collected.get("bairro", "")
                return (
                    f"Entendi a localização no {bairro}. Qual é o endereço exato com o nome da rua ou avenida onde o problema se encontra?"
                )

        # Se temos logradouro mas falta bairro
        if "bairro" in missing_slots:
            logradouro = collected.get("logradouro", "o logradouro informado")
            return (
                f"Perfeito, anotei o endereço na {logradouro}. Em qual bairro ou setor da cidade fica localizado esse trecho?"
            )

        # Se temos logradouro e bairro, mas falta ponto de referência
        if "referencia" in missing_slots:
            logradouro = collected.get("logradouro", "o logradouro informado")
            bairro = collected.get("bairro", "o bairro informado")
            return (
                f"Ótimo! Já localizei {logradouro} no {bairro}. "
                f"Para agilizar o deslocamento da equipe de campo, há algum número aproximado ou ponto de referência próximo "
                f"(como uma esquina, escola, praça ou comércio)?"
            )

        # Caso geral de cortesia
        return (
            f"Entendi. Há mais algum detalhe ou observação específica sobre essa demanda que você gostaria de acrescentar?"
        )
