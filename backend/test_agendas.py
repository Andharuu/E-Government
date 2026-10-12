from app.api.v1.routers.public_services import _build_agendas

agendas = _build_agendas()
print(f"OK: {len(agendas)} agendas")
missing = [a["id"] for a in agendas if "logo_url" not in a]
print(f"Missing logo: {missing}")
for a in agendas:
    print(f'  {a["id"]:2d} | {a.get("logo_url","MISSING"):28s} | {a["agency"]}')
