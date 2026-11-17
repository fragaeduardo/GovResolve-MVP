# 2. Primeira versão: seis casos gerados com IA

**Ferramenta:** ChatGPT (OpenAI, GPT-6). **Status desta seção:** versão inicial para revisão crítica; **não equivale à versão aprovada dos casos**.

## 2.1 Briefing de geração

O pedido de geração considerou o GovResolve-MVP, a funcionalidade de registro de reclamação pelo chatbot, RF002/RF003/RF008/RF009/RF010/RF016, HU002/HU007/HU008/HU014, catálogo de órgãos, diagrama de sequência, diagramas de classes/componentes e telas de conversa/revisão/protocolo. Solicitou seis casos funcionais com cenários positivos, negativos e alternativos, informando ID, fonte, pré-condições, dados, passos, resultado esperado e possíveis lacunas, **sem executar o sistema**. Este texto é uma síntese fiel do briefing usado para orientar a geração, não uma transcrição de mensagens históricas.

A versão inicial abaixo é preservada para permitir revisar a utilidade e as limitações da IA. Alguns trechos serão **corrigidos** porque extrapolam o que está especificado.

### CT-01 — Registrar reclamação completa e receber protocolo (inicial)

- **Origem:** IA. **RF/HU:** RF002, RF003, HU002.
- **Objetivo:** verificar o registro de reclamação aprovada.
- **Pré-condições:** cidadão no portal demonstrativo; não há demanda previamente registrada para a sessão.
- **Entradas:** “Existe um bueiro danificado na Rua 10, Setor Central, Goiânia; solicito vistoria e reparo”.
- **Passos:** 1) abrir nova demanda; 2) enviar relato e responder eventuais solicitações; 3) revisar a ficha; 4) confirmar.
- **Esperado proposto:** uma demanda registrada, um protocolo único exibido após confirmar e vinculado ao relato.

### CT-02 — Impedir registro sem endereço (inicial)

- **Origem:** IA. **RF/HU:** RF002, HU002.
- **Objetivo:** testar informação supostamente obrigatória.
- **Pré-condições:** cidadão no início de uma reclamação.
- **Entradas:** “Quero reclamar de um problema” sem endereço.
- **Passos:** 1) enviar relato; 2) tentar concluir.
- **Esperado proposto:** rejeição e mensagem literal “Endereço obrigatório” em qualquer reclamação, sem gerar protocolo.
- **Ponto a revisar:** a obrigatoriedade universal do endereço e a mensagem exata **não estão especificadas**.

### CT-03 — Revisar uma proposta antes de confirmar (inicial)

- **Origem:** IA. **RF/HU:** RF002, RF009, HU002.
- **Objetivo:** confirmar que a correção é considerada antes do registro.
- **Pré-condições:** proposta de reclamação apresentada, ainda sem confirmação.
- **Entradas:** endereço inicialmente “Rua 10”; correção para “Rua 12”, no mesmo setor.
- **Passos:** 1) acessar a proposta; 2) selecionar “Não, quero ajustar”; 3) informar a correção; 4) voltar à proposta.
- **Esperado proposto:** proposta atualizada para Rua 12; registro ainda não formalizado e sem protocolo.

### CT-04 — Classificar bueiro danificado para o órgão cadastrado (inicial)

- **Origem:** IA. **RF/HU:** RF008, RF010, HU008.
- **Objetivo:** avaliar sugestão de destino do catálogo.
- **Pré-condições:** cidadão fornece relato suficientemente detalhado para gerar a proposta.
- **Entradas:** “Bueiro quebrado na Rua 10, Setor Central, Goiânia; solicito reparo”.
- **Passos:** 1) informar demanda; 2) completar os fatos requeridos; 3) verificar órgão sugerido; 4) confirmar.
- **Esperado proposto:** sugestão de SEINFRA para bueiro danificado; demanda encaminhada ao destino correspondente no catálogo acadêmico.

### CT-05 — Exigir resumo idêntico ao texto original (inicial)

- **Origem:** IA. **RF/HU:** RF009, HU007.
- **Objetivo:** testar fidelidade das informações organizadas.
- **Pré-condições:** cidadão apresenta relato e o chatbot compõe proposta.
- **Entradas:** “Há um bueiro quebrado; ninguém ficou ferido; preciso de reparo”.
- **Passos:** 1) relatar; 2) obter proposta; 3) comparar descrição e relato.
- **Esperado proposto:** o resumo deve ter **exatamente as mesmas palavras** do relato.
- **Ponto a revisar:** RF009 exige fidelidade de fatos e sentido, não identidade literal de redação.

### CT-06 — Classificar todo bueiro danificado como gravidade crítica (inicial)

- **Origem:** IA. **RF/HU:** RF016, HU014.
- **Objetivo:** verificar a classificação de gravidade.
- **Pré-condições:** reclamação preparada para aprovação.
- **Entradas:** “Bueiro danificado na Rua 10, Setor Central”.
- **Passos:** 1) concluir ficha; 2) confirmar; 3) consultar gravidade.
- **Esperado proposto:** gravidade obrigatória CRITICA e prazo máximo de 24 horas.
- **Ponto a revisar:** não há regra que imponha CRITICA para esse exemplo, nem prazo oficial de 24 horas.

---

**Observação metodológica:** o fato de uma proposta inicial estar escrita de modo verificável não a torna correta; o esperado precisa estar sustentado por um artefato de origem. Os trechos não sustentados são mantidos **somente como evidência da avaliação crítica**, não como requisitos do sistema.