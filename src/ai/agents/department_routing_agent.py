"""Classifica a intenção e sugere opções exclusivamente do catálogo local."""

import json
import logging
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("govresolve.ai.department_routing")
CATALOG_PATH = Path(__file__).resolve().parents[3] / "data" / "departments.jsonl"

# Destinos e instruções são conteúdo curado; a IA decide quando se aplicam.
SELF_SERVICE_OPTIONS = [
    {
        "code": "IPTU_2VIA",
        "department_code": "SEFAZ",
        "name": "Consulta ou emissão de guia de IPTU/ITU",
        "description": "Portal oficial para consultar tributos do imóvel e emitir guia.",
        "link": "https://tributos.goiania.go.gov.br/PortalTributos/ConsultaTributos",
        "instructions": "1. Abra o portal oficial.\n2. Escolha IPTU/ITU e informe a inscrição municipal do imóvel.\n3. Consulte e emita a guia.",
    },
    {
        "code": "CERTIDAO_FISCAL",
        "department_code": "SEFAZ",
        "name": "Certidão negativa de débitos de IPTU/ITU/taxas",
        "description": "Página oficial para solicitar certidão fiscal municipal.",
        "link": "https://www.goiania.go.gov.br/sing_servicos/certidao-negativa-de-debitos-iptu-itu-taxas/",
        "instructions": "1. Abra a página oficial.\n2. Toque em ‘Acessar serviço’ e informe a inscrição cadastral do imóvel.\n3. Se não souber esse número, peça ajuda antes de continuar.",
    },
]
# shortcut: covers listed cross-category conflicts; extend when the department taxonomy adds one.
MULTI_ISSUE_PATTERNS = (
    r"\b(?:lixo|residuo|residuos|varricao)\b",
    r"\b(?:buraco|asfalto|pavimento|drenagem)\b",
    r"\b(?:semaforo|sinalizacao|transito|faixa de pedestres)\b",
    r"\b(?:onibus|linha|itinerario|transporte coletivo)\b",
    r"\b(?:ubs|upa|posto de saude|medico|remedio|saude)\b",
    r"\b(?:escola|creche|merenda|professor)\b",
    r"\b(?:loja|cobranca|cartao|preco abusivo|procon)\b",
    r"\b(?:acolhimento|assistencia social|semas|cras|creas)\b",
    r"\b(?:poluicao sonora|desmatamento|crime ambiental)\b",
)


def _normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.lower())
    return " ".join("".join(c for c in value if not unicodedata.combining(c)).split())


def _explicit_destination(text: str, departments: list[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    # shortcut: handles explicit catalog phrases; extend when a new unambiguous phrase is added.
    normalized = _normalize(text)
    code = None
    if re.search(r"\b(?:semaforo|sinalizacao|faixa de pedestres)\b", normalized):
        code = "SET"
    elif re.search(r"\b(?:vandalismo|depredacao|dano ao patrimonio)\b", normalized):
        code = "AGCM"
    elif re.search(r"\bpoda\b", normalized) and re.search(r"\bcalcada\b", normalized) and not re.search(r"\b(?:caiu|caida|tombou)\b", normalized):
        code = "AMMA"
    elif (
        re.search(r"\bentulho\b", normalized) and re.search(r"\bpasseio\b", normalized)
        and not re.search(r"\b(?:descarte irregular|despejaram|despejo|ilegal|preservacao)\b", normalized)
    ):
        code = "COMURG"
    elif re.search(r"\bprofessor(?:a)?\b", normalized) and re.search(r"\b(?:escola|municipal)\b", normalized):
        code = "SME"
    department = next((d for d in departments if d["code"] == code), None)
    if not department:
        return None
    return {
        "intent": "PUBLIC_COMPLAINT",
        "department": department,
        "category": department.get("category", "Aguardando triagem"),
        "problem_type": department.get("problem_type"),
    }


class DepartmentRoutingAgent:
    """Classificador semântico com validação local de destinos e serviços."""

    @classmethod
    def load_departments(cls) -> list[Dict[str, Any]]:
        with CATALOG_PATH.open(encoding="utf-8") as catalog:
            return [json.loads(line) for line in catalog if line.strip()]

    @classmethod
    async def route(
        cls,
        text: str,
        registered_departments: Optional[list[Dict[str, str]]] = None,
        *,
        intent_only: bool = True,
        previous_topic: Optional[Dict[str, Any]] = None,
        conversation_context: str = "",
    ) -> Dict[str, Any]:
        departments = cls.load_departments()
        if registered_departments is not None:
            registered_names = {_normalize(dept["name"]) for dept in registered_departments}
            departments = [d for d in departments if _normalize(d["name"]) in registered_names]

        if not departments:
            return {"intent": "UNCLEAR", "clarification": "No momento não há órgãos cadastrados para encaminhar essa solicitação."}
        department_codes = {d["code"] for d in departments}
        if not intent_only:
            explicit_route = _explicit_destination(text, departments)
            if explicit_route:
                return explicit_route
        available_services = [s for s in SELF_SERVICE_OPTIONS if s["department_code"] in department_codes]
        normalized_text = _normalize(text)
        if intent_only and not previous_topic:
            if (
                re.search(r"\bsinal\b", normalized_text)
                and not re.search(r"\b(?:semaforo|sinalizacao|transito|cruzamento|faixa)\b", normalized_text)
            ):
                return {"intent": "UNCLEAR", "clarification": "Você se refere a um semáforo/sinalização de trânsito ou a outro tipo de sinal?"}
            has_priority = re.search(r"\b(?:prioridade|primeiro|principalmente|mais urgente)\b", normalized_text)
            if not has_priority and sum(bool(re.search(pattern, normalized_text)) for pattern in MULTI_ISSUE_PATTERNS) > 1:
                return {"intent": "UNCLEAR", "clarification": "Você mencionou mais de um tipo de problema. Qual deles quer registrar primeiro?"}
        if (
            not intent_only and re.search(r"\bvazamento\b", normalized_text)
            and not re.search(r"\b(?:agua|esgoto|rede|cano|adutora|tubulacao)\b", normalized_text)
        ):
            return {"intent": "UNCLEAR", "clarification": "O vazamento é de água, esgoto ou de outro tipo de rede?"}

        from src.ai.service import AIScreeningService

        options = {
            "departments": [] if intent_only else [
                {"code": d["code"], "name": d["name"], "description": d["description"],
                 "category": d.get("category"), "problem_type": d.get("problem_type"),
                 "service_type": d.get("service_type", "ATENDIMENTO_PUBLICO")}
                for d in departments
            ],
            "self_service": [
                {"code": s["code"], "department_code": s["department_code"],
                 "name": s["name"], "description": s["description"]}
                for s in (available_services if intent_only else [])
            ],
        }
        prompt = {
            "mensagem_atual": text,
            "contexto_da_conversa": conversation_context,
            "assunto_atual_da_sessao": previous_topic,
            "opcoes_validas": options,
        }
        system_prompt = (
            "Interprete a mensagem pelo contexto, nunca por uma palavra isolada. Escolha uma intenção: PUBLIC_COMPLAINT, "
            "SELF_SERVICE, CONTINUATION, REVISION, TOPIC_SWITCH, HUMAN_REVIEW ou UNCLEAR. PUBLIC_COMPLAINT significa "
            "que a pessoa descreve claramente um problema que precisa de intervenção municipal; não exija endereço completo "
            "nem escolha de órgão nesta etapa. UNCLEAR só se ainda não der para entender se é reclamação, serviço ou qual é "
            "o problema; falta de localização ou de outros campos é pendência, não ambiguidade. HUMAN_REVIEW exige que o "
            "cidadão peça explicitamente análise de uma pessoa ou da Ouvidoria. REVISION significa corrigir ou completar a "
            "ficha/proposta ativa. TOPIC_SWITCH só se já houver reclamação em andamento e a pessoa substituir esse problema "
            "por outro, especialmente quando disser que esqueça ou deixe o assunto anterior; classifique uma resposta de "
            "endereço do mesmo problema como CONTINUATION. Para SELF_SERVICE escolha um service_code listado; não invente "
            "destinos, links ou fatos. Só selecione IPTU_2VIA se a mensagem mencionar IPTU, ITU ou imposto predial/territorial; "
            "só selecione CERTIDAO_FISCAL se pedir certidão. Pedido genérico de boleto ou taxa sem serviço correspondente é UNCLEAR. "
            "Quando houver uma reclamação ativa, confira os campos já coletados e os campos pendentes antes de classificar. "
            "Uma resposta curta que preenche um campo pendente é CONTINUATION, mesmo sem formar uma frase completa. "
            "Não peça novamente informações que já aparecem nos campos coletados. "
            "Relatos inequívocos de semáforo ou sinalização de trânsito apagada, atraso de ônibus, cobrança duplicada em loja, falta de atendimento "
            "em UBS ou buraco são PUBLIC_COMPLAINT mesmo sem endereço; órgão incerto não torna a intenção incerta. "
            "Use UNCLEAR se a pessoa disser apenas 'sinal' sem contexto de trânsito, se o tipo de vazamento não estiver "
            "claro, ou se misturar problemas diferentes sem dizer qual deseja registrar primeiro. "
            "Neste momento a ficha ainda está sendo montada: para PUBLIC_COMPLAINT identifique somente que há uma reclamação "
            "municipal a formalizar. Não escolha órgão nem categoria ainda."
            if intent_only else
            "A ficha da reclamação está completa. Escolha o órgão mais adequado somente entre os códigos cadastrados e retorne "
            "intent PUBLIC_COMPLAINT com department_code. Não altere nem complete fatos da ficha. Se nenhum órgão se encaixar, "
            "use UNCLEAR e formule uma pergunta curta. Diferencie drenagem de chuva e bueiro pluvial (SEINFRA) de vazamento "
            "de água tratada, refluxo de esgoto ou rede de esgoto (SANEAGO). Queda de árvore bloqueando via ou praça é limpeza "
            "urbana (COMURG); pedido de poda de árvore em pé, poda programada ou autorização para poda, descarte irregular "
            "de entulho e crime ambiental cabem à fiscalização ambiental (AMMA). Patrulhamento e segurança em praça são da "
            "AGCM. Escola ou professor da rede municipal é SME; apoio social, acolhimento familiar e pedidos à SEMAS são da "
            "SEMASDH. A orientação de autoatendimento não se aplica nesta etapa."
        )
        answer = await AIScreeningService.call_llm_with_fallback([
            {"role": "system", "content": (
                system_prompt + " Retorne somente JSON com intent, department_code, service_code, confidence e clarification."
            )},
            {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
        ], response_json=True)

        try:
            result = json.loads(answer or "{}")
            if not isinstance(result, dict):
                raise ValueError("Resposta deve ser um objeto JSON")
            intent = result.get("intent")
            confidence = float(result.get("confidence", 0))
        except (TypeError, ValueError, json.JSONDecodeError):
            logger.info("Department router returned an invalid response.")
            result, intent, confidence = {}, None, 0

        if not 0.7 <= confidence <= 1.0:
            intent = "UNCLEAR"
        if intent_only and intent == "HUMAN_REVIEW":
            return {"intent": intent}
        if intent_only and intent == "TOPIC_SWITCH" and previous_topic:
            return {"intent": intent}
        if intent_only and intent in {"CONTINUATION", "REVISION"} and previous_topic:
            return {"intent": intent}
        if intent_only and intent == "SELF_SERVICE":
            service = next((s for s in available_services if s["code"] == result.get("service_code")), None)
            normalized_text = _normalize(text)
            service_matches_request = service and (
                (service["code"] == "IPTU_2VIA" and re.search(r"\b(?:iptu|itu|imposto predial|imposto territorial)\b", normalized_text))
                or (service["code"] == "CERTIDAO_FISCAL" and re.search(r"\bcertidao\b", normalized_text))
            )
            if not service_matches_request:
                service = None
            if service:
                department = next((d for d in departments if d["code"] == service["department_code"]), None)
                if department:
                    return {"intent": intent, "service": service, "department": department}
            intent = "UNCLEAR"
        elif intent == "PUBLIC_COMPLAINT" and not intent_only:
            department = next((d for d in departments if d["code"] == result.get("department_code")), None)
            if department:
                return {
                    "intent": intent,
                    "department": department,
                    "category": department.get("category", "Aguardando triagem"),
                    "problem_type": department.get("problem_type"),
                }
            intent = "UNCLEAR"
        elif intent_only and intent == "PUBLIC_COMPLAINT":
            return {"intent": intent}

        return {
            "intent": "UNCLEAR",
            "clarification": result.get("clarification") or
            "Quero encaminhar corretamente. Você precisa de orientação para usar um serviço ou quer registrar um problema que exige atendimento da Prefeitura?",
        }
