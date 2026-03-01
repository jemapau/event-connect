# Wireframes ASCII — Herramienta de Networking para Eventos Figma

## Propuesta: "Hub con Pestañas" (networking + quiz integrado)

---

### Pantalla HOST — Dashboard con tabs

┌──────────────────────────────────────────────────────────┐
│  ◉ FigmaConnect                   Sesión: FIGMA-MTY-026 │
│──────────────────────────────────────────────────────────│
│  [ Quiz ]  [ Networking ]  [ Resultados ]  [ Config ]    │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│  ┌──────────────────────┐   ┌─────────────────────────┐  │
│  │  ████████████████    │   │ ESTADÍSTICAS EN VIVO    │  │
│  │  ██            ██    │   │                         │  │
│  │  ██  QR CODE   ██    │   │  Conectados:  34        │  │
│  │  ██            ██    │   │  En espera:   12        │  │
│  │  ████████████████    │   │  Respondiendo: 22       │  │
│  │                      │   │                         │  │
│  │  PIN: 491 207        │   │  Avg tiempo: 4.2s       │  │
│  └──────────────────────┘   │  Puntaje top: 2,450     │  │
│                             └─────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  COLA DE PREGUNTAS                          +Add   │  │
│  │  ─────────────────────────────────────────────     │  │
│  │  1. ✅ ¿Qué es Auto Layout?         15s  4 opc    │  │
│  │  2. ⬜ ¿Para qué sirve Variants?    20s  4 opc    │  │
│  │  3. ⬜ Networking: Encuentra a...    60s  libre    │  │
│  │  4. ⬜ ¿Qué plugin usas más?        30s  encuesta │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [ ▶ LANZAR SIGUIENTE ]              [ ⏸ PAUSAR ]       │
└──────────────────────────────────────────────────────────┘


### Pantalla HOST — Tab Networking (matchmaking)


┌──────────────────────────────────────────────────────────┐
│  ◉ FigmaConnect                   Sesión: FIGMA-MTY-026 │
│──────────────────────────────────────────────────────────│
│  [ Quiz ]  [■Networking■]  [ Resultados ]  [ Config ]    │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│   Modo: ( ) Aleatorio  (●) Por intereses  ( ) Rondas    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PAREJAS ACTIVAS              Ronda 2 de 4         │  │
│  │  ──────────────────────────────────────────────    │  │
│  │  👤 Ana M. ←──→ 👤 Carlos R.    ⏱ 2:34           │  │
│  │  👤 Diana P. ←──→ 👤 Luis G.    ⏱ 2:34           │  │
│  │  👤 Marta S. ←──→ 👤 Pedro H.   ⏱ 2:34           │  │
│  │  👤 Sofia T. ←──→ 👤 Juan V.    ⏱ 2:34           │  │
│  │  👤 Elena F. ←──→ 👤 Raul D.    ⏱ 2:34           │  │
│  │  👤 Laura K.  ── en espera ──                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Icebreaker actual: "¿Cuál fue tu último proyecto       │
│  de diseño favorito?"                                    │
│                                                          │
│  [ ⏭ SIGUIENTE RONDA ]         [ 🔀 RE-MEZCLAR ]       │
└──────────────────────────────────────────────────────────┘


### Pantalla PLAYER — Matchmaking (móvil)


┌───────────────────────┐
│  ◉       Ronda 2 / 4  │
│───────────────────────│
│                       │
│   Tu pareja es:       │
│                       │
│   ┌─────────────────┐ │
│   │                 │ │
│   │    👤 Carlos R. │ │
│   │    UX Designer  │ │
│   │    @carlos_rx   │ │
│   │                 │ │
│   └─────────────────┘ │
│                       │
│   💬 Icebreaker:      │
│   "¿Cuál fue tu      │
│    último proyecto    │
│    de diseño          │
│    favorito?"         │
│                       │
│   ⏱ 2:34 restantes    │
│   ████████████░░░░░░  │
│                       │
│   [ 📇 INTERCAMBIAR  │
│       CONTACTO ]      │
│                       │
└───────────────────────┘


### Pantalla PLAYER — Quiz activo (móvil)


┌───────────────────────┐
│  ◉ FigmaConnect       │
│───────────────────────│
│                       │
│  PREGUNTA 5 / 10      │
│                       │
│  ¿Qué es Variants     │
│   en Figma?           │
│                       │
│  ┌───────────────────┐│
│  │  🔴 Un plugin     ││
│  └───────────────────┘│
│  ┌───────────────────┐│
│  │  🔵 Estados de    ││
│  │     componentes   ││
│  └───────────────────┘│
│  ┌───────────────────┐│
│  │  🟡 Un tipo de    ││
│  │     fuente        ││
│  └───────────────────┘│
│  ┌───────────────────┐│
│  │  🟢 Un atajo      ││
│  └───────────────────┘│
│                       │
│  ⏱ 00:08   Pts: 1200  │
└───────────────────────┘