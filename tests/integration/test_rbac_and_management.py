import pytest
from src.db.schema import User, UserRole, Department, Demand, DemandStatus, DemandSeverity, UserRoleAssignment
from src.api.routes.auth import create_token


@pytest.mark.asyncio
async def test_auth_me_roles_and_areas(client, db_session):
    """
    Testa se /auth/me retorna corretamente as roles, áreas autorizadas e departamentos.
    """
    dept = Department(name="SME — Secretaria Municipal de Educação", email="sme@gov.br")
    db_session.add(dept)
    await db_session.commit()
    await db_session.refresh(dept)

    # 1. Cidadão
    cidadao = User(cpf="11100011100", name="Cidadão Único", email="cidadao@teste.com", role=UserRole.CIDADAO)
    db_session.add(cidadao)
    await db_session.commit()
    await db_session.refresh(cidadao)

    token_cid = create_token(cidadao)
    res_cid = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_cid}"})
    assert res_cid.status_code == 200
    data_cid = res_cid.json()
    assert "cidadao" in data_cid["roles"]
    assert data_cid["areas"]["citizen"]["authorized"] is True
    assert data_cid["areas"]["server"]["authorized"] is False
    assert data_cid["areas"]["management"]["authorized"] is False

    # 2. Servidor vinculado ao departamento SME
    servidor = User(cpf="22200022200", name="Servidor SME", email="servidor@sme.gov.br", role=UserRole.SERVIDOR)
    servidor.departments.append(dept)
    db_session.add(servidor)
    await db_session.commit()
    await db_session.refresh(servidor)

    token_srv = create_token(servidor)
    res_srv = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_srv}"})
    assert res_srv.status_code == 200
    data_srv = res_srv.json()
    assert "servidor" in data_srv["roles"]
    assert data_srv["areas"]["citizen"]["authorized"] is False
    assert data_srv["areas"]["server"]["authorized"] is True
    assert data_srv["areas"]["management"]["authorized"] is False
    assert len(data_srv["departments"]) == 1
    assert data_srv["departments"][0]["id"] == dept.id

    # 3. Gestor com múltiplas roles (GESTOR e SERVIDOR)
    gestor = User(cpf="33300033300", name="Gestora Municipal", email="gestora@gov.br", role=UserRole.GESTOR)
    db_session.add(gestor)
    await db_session.commit()
    await db_session.refresh(gestor)

    # Adiciona atribuição de role explícita
    role_assignment = UserRoleAssignment(user_id=gestor.id, role=UserRole.GESTOR)
    db_session.add(role_assignment)
    await db_session.commit()

    token_gst = create_token(gestor)
    res_gst = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_gst}"})
    assert res_gst.status_code == 200
    data_gst = res_gst.json()
    assert "gestor" in data_gst["roles"]
    assert data_gst["areas"]["citizen"]["authorized"] is False
    assert data_gst["areas"]["server"]["authorized"] is True
    assert data_gst["areas"]["management"]["authorized"] is True


@pytest.mark.asyncio
async def test_server_department_scoping_and_dossier(client, db_session):
    """
    Testa se servidor só enxerga demandas do seu próprio departamento
    e recebe 403 ao tentar acessar o dossiê de demanda de outro departamento.
    """
    dept_obras = Department(name="SEINFRA — Obras", email="obras@gov.br")
    dept_saude = Department(name="SMS — Saúde", email="saude@gov.br")
    cidadao = User(cpf="55544433322", name="Cidadão Notificante", email="notif@teste.com", role=UserRole.CIDADAO)
    servidor_obras = User(cpf="77788899911", name="Servidor Obras", email="eng@obras.gov.br", role=UserRole.SERVIDOR)
    servidor_obras.departments.append(dept_obras)

    db_session.add_all([dept_obras, dept_saude, cidadao, servidor_obras])
    await db_session.commit()
    await db_session.refresh(dept_obras)
    await db_session.refresh(dept_saude)
    await db_session.refresh(cidadao)
    await db_session.refresh(servidor_obras)

    # Demanda 1: Obras
    d_obras = Demand(
        protocol="GR-20261004-OBRAS1",
        title="Buraco na via pública",
        description="Asfalto cedendo",
        citizen_id=cidadao.id,
        department_id=dept_obras.id,
        status=DemandStatus.ABERTO,
        severity=DemandSeverity.ALTA
    )
    # Demanda 2: Saúde
    d_saude = Demand(
        protocol="GR-20261004-SAUDE1",
        title="Falta de medicamentos",
        description="Posto de saúde sem dipirona",
        citizen_id=cidadao.id,
        department_id=dept_saude.id,
        status=DemandStatus.ABERTO,
        severity=DemandSeverity.MEDIA
    )
    db_session.add_all([d_obras, d_saude])
    await db_session.commit()

    token_obras = create_token(servidor_obras)
    headers = {"Authorization": f"Bearer {token_obras}"}

    # 1. Servidor lista demandas: deve ver apenas d_obras
    res_list = await client.get("/api/v1/admin/demands", headers=headers)
    assert res_list.status_code == 200
    demands = res_list.json()
    protocols = [d["protocol"] for d in demands]
    assert "GR-20261004-OBRAS1" in protocols
    assert "GR-20261004-SAUDE1" not in protocols

    # 2. Servidor acessa dossiê da demanda de Obras -> 200 OK com histórico e detalhes
    res_dossier = await client.get("/api/v1/admin/demands/GR-20261004-OBRAS1", headers=headers)
    assert res_dossier.status_code == 200
    dossier_data = res_dossier.json()
    assert dossier_data["protocol"] == "GR-20261004-OBRAS1"
    assert dossier_data["department"]["id"] == dept_obras.id
    assert "history" in dossier_data
    assert "severity" in dossier_data

    # 3. Servidor tenta acessar dossiê da demanda de Saúde -> 403 Forbidden
    res_forbidden = await client.get("/api/v1/admin/demands/GR-20261004-SAUDE1", headers=headers)
    assert res_forbidden.status_code == 403
    assert "Acesso não autorizado" in res_forbidden.json()["detail"]


@pytest.mark.asyncio
async def test_management_routes_authorization(client, db_session):
    """
    Testa se as rotas /management/overview e /management/departments são restritas
    estritamente a GESTOR, retornando 403 para CIDADAO e SERVIDOR.
    """
    dept = Department(name="AMMA — Meio Ambiente", email="amma@gov.br")
    cidadao = User(cpf="99988877701", name="Cidadão Sem Acesso", email="user@teste.com", role=UserRole.CIDADAO)
    servidor = User(cpf="99988877702", name="Servidor Comum", email="servidor@amma.gov.br", role=UserRole.SERVIDOR)
    gestor = User(cpf="99988877703", name="Gestor Geral da Cidade", email="gestor@prefeitura.gov.br", role=UserRole.GESTOR)

    db_session.add_all([dept, cidadao, servidor, gestor])
    await db_session.commit()
    await db_session.refresh(cidadao)
    await db_session.refresh(servidor)
    await db_session.refresh(gestor)

    token_cid = create_token(cidadao)
    token_srv = create_token(servidor)
    token_gst = create_token(gestor)

    # 1. Cidadão tenta acessar /management/overview -> 403
    res_cid = await client.get("/api/v1/management/overview", headers={"Authorization": f"Bearer {token_cid}"})
    assert res_cid.status_code == 403

    # 2. Servidor tenta acessar /management/overview -> 403
    res_srv = await client.get("/api/v1/management/overview", headers={"Authorization": f"Bearer {token_srv}"})
    assert res_srv.status_code == 403

    # 3. Gestor acessa /management/overview -> 200 OK com métricas completas
    res_gst = await client.get("/api/v1/management/overview", headers={"Authorization": f"Bearer {token_gst}"})
    assert res_gst.status_code == 200
    overview = res_gst.json()
    assert "total" in overview
    assert "status" in overview
    assert "severity" in overview
    assert "resolution_rate" in overview

    # 4. Gestor acessa /management/departments -> 200 OK com comparação departamental
    res_depts = await client.get("/api/v1/management/departments", headers={"Authorization": f"Bearer {token_gst}"})
    assert res_depts.status_code == 200
    depts_comp = res_depts.json()
    assert isinstance(depts_comp, list)


@pytest.mark.asyncio
async def test_paginated_demands_endpoints(client, db_session):
    """
    Testa paginação em /demands/my e /admin/demands quando page é informado.
    """
    dept = Department(name="SANEAGO — Água e Esgoto", email="saneago@gov.br")
    cidadao = User(cpf="10101010101", name="Cidadão Paginação", email="pag@teste.com", role=UserRole.CIDADAO)
    gestor = User(cpf="20202020202", name="Gestor Paginação", email="gestorpag@teste.com", role=UserRole.GESTOR)

    db_session.add_all([dept, cidadao, gestor])
    await db_session.commit()
    await db_session.refresh(dept)
    await db_session.refresh(cidadao)
    await db_session.refresh(gestor)

    # Cria 3 demandas para o cidadão
    for i in range(3):
        d = Demand(
            protocol=f"GR-PAG-{i+1}",
            title=f"Vazamento {i+1}",
            description=f"Vazamento número {i+1} na via",
            citizen_id=cidadao.id,
            department_id=dept.id,
            status=DemandStatus.ABERTO,
            severity=DemandSeverity.MEDIA
        )
        db_session.add(d)
    await db_session.commit()

    token_cid = create_token(cidadao)
    token_gst = create_token(gestor)

    # 1. Cidadão consulta com paginação (page=1, page_size=2)
    res_pag = await client.get("/api/v1/demands/my?page=1&page_size=2", headers={"Authorization": f"Bearer {token_cid}"})
    assert res_pag.status_code == 200
    pag_data = res_pag.json()
    assert "items" in pag_data
    assert pag_data["total"] == 3
    assert pag_data["page"] == 1
    assert pag_data["page_size"] == 2
    assert pag_data["pages"] == 2
    assert len(pag_data["items"]) == 2

    # 2. Cidadão consulta sem parâmetro page (deve retornar lista simples para retrocompatibilidade)
    res_legacy = await client.get("/api/v1/demands/my", headers={"Authorization": f"Bearer {token_cid}"})
    assert res_legacy.status_code == 200
    legacy_data = res_legacy.json()
    assert isinstance(legacy_data, list)
    assert len(legacy_data) == 3

    # 3. Admin/Gestor consulta com paginação
    res_admin_pag = await client.get("/api/v1/admin/demands?page=1&page_size=2", headers={"Authorization": f"Bearer {token_gst}"})
    assert res_admin_pag.status_code == 200
    admin_pag_data = res_admin_pag.json()
    assert "items" in admin_pag_data
    assert admin_pag_data["total"] >= 3
    assert admin_pag_data["pages"] >= 2
    assert len(admin_pag_data["items"]) == 2
