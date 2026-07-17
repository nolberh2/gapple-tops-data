# gapple-tops-data

Datos públicos de los tops de **Gapple Club** (una network de Minecraft).

Un archivo por servidor/modalidad en `servers/<id>.json`, generado
automáticamente por un plugin de Paper en cada backend (cada ~5 min, leyendo Topper).
Lo consume la web (repo privado `gappleweb2`) vía:

```
https://raw.githubusercontent.com/nolberh2/gapple-tops-data/main/servers/<id>.json
```

No editar a mano: el plugin sobrescribe estos archivos. El contrato del JSON está
documentado en el README de `gappleweb2`.

## Servidores actuales
- `servers/survival.json` — Survival Custom
- `servers/practice.json` — Practice
