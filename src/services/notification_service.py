import logging
from typing import Optional
import aiosmtplib
from email.message import EmailMessage
from src.config import settings

logger = logging.getLogger("govresolve.notifications")


class NotificationService:
    @staticmethod
    async def send_status_update_notification(
        to_email: str,
        protocol: str,
        demand_title: str,
        old_status: Optional[str],
        new_status: str,
        resolution_notes: Optional[str] = None
    ) -> bool:
        """
        Envia notificação por e-mail informando a alteração de status da demanda (RF005, RNF005).
        Utiliza aiosmtplib com fallback para log caso as credenciais não estejam configuradas.
        """
        subject = f"[GovResolve] Atualização da Demanda {protocol}: {new_status}"
        
        body_lines = [
            f"Olá,",
            f"",
            f"Houve uma atualização no andamento da sua solicitação registrada no GovResolve.",
            f"",
            f"Protocolo: {protocol}",
            f"Assunto: {demand_title}",
            f"Status Anterior: {old_status or 'N/A'}",
            f"Novo Status: {new_status}",
        ]

        if new_status == "FECHADO" and resolution_notes:
            body_lines.extend([
                f"",
                f"Parecer Conclusivo do Órgão Responsável:",
                f"{resolution_notes}",
                f"",
                f"Você já pode avaliar o atendimento recebido diretamente na plataforma GovResolve."
            ])

        body_lines.extend([
            f"",
            f"Acesse https://govresolve.gov.br para acompanhar o histórico completo.",
            f"",
            f"Atenciosamente,",
            f"Equipe GovResolve"
        ])

        content = "\n".join(body_lines)

        logger.info(
            f"[NOTIFICAÇÃO] Preparando e-mail para {to_email} | Protocolo: {protocol} | Status: {new_status}"
        )

        # Se as credenciais de SMTP não estiverem preenchidas, opera em modo simulação segura
        if not settings.SMTP_USER or not settings.SMTP_HOST or settings.SMTP_HOST == "localhost":
            logger.info(
                f"[SIMULAÇÃO SMTP] E-mail simulado com sucesso para {to_email}:\n{content}"
            )
            return True

        message = EmailMessage()
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(content)

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_USE_TLS,
                timeout=10
            )
            logger.info(f"[NOTIFICAÇÃO] E-mail enviado com sucesso para {to_email}")
            return True
        except Exception as e:
            logger.warning(
                f"[NOTIFICAÇÃO] Falha ao enviar via SMTP ({e}). Operação continuará com log registrado."
            )
            return False
