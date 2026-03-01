# EventConnect — Plataforma de Networking en Tiempo Real para Eventos

## Meta

| Campo | Valor |
|---|---|
| **Proyecto** | EventConnect |
| **Tipo** | Plataforma web de networking interactivo para eventos presenciales |
| **Inspiración** | Kahoot-style, pero enfocado en networking y conexiones entre asistentes |
| **Stack** | Next.js 14 (App Router) + Supabase + Tailwind CSS |
| **Filosofía** | Ligero, desplegable rápido, amigable para vibe coding con Claude Code |
| **UI visual** | El estilo visual debe ser inspirado en Neobrutalism |
| **Propuesta de UI** | Hub con Pestañas — networking + quiz integrado en un solo dashboard |

---

## 1. Visión del Producto

Una plataforma web donde el organizador de un evento crea una sesión interactiva y los asistentes se unen escaneando un QR o ingresando un PIN. La herramienta facilita el networking mediante dinámicas en tiempo real: icebreakers, matchmaking por intereses, votaciones en vivo y rondas de preguntas.

El dashboard del Host se organiza en un **sistema de pestañas** (Quiz, Networking, Resultados, Config) que permite al organizador controlar todas las dinámicas desde una única interfaz, alternando entre quiz en vivo y rondas de networking/matchmaking de forma fluida.

### 1.1 Usuarios

- **Host (Organizador):** Crea y controla la sesión desde un dashboard con pestañas. Proyecta la pantalla principal en el evento. Gestiona tanto las preguntas de quiz como las rondas de matchmaking.
- **Player (Asistente):** Se une desde su smartphone. Interactúa con las dinámicas sin necesidad de registro ni descarga. Ve su pareja de networking asignada, responde preguntas de quiz y puede intercambiar contactos.

### 1.2 Flujo Principal

```
Host crea sesión → Se genera PIN + QR
                         ↓
         Asistentes escanean QR / ingresan PIN / y selecciona su profesión (diseño ux, diseño ui, product design y en la opción otro pueden escribirlo)
                         ↓
         Lobby (sala de espera con contador)
                         ↓
         Host inicia dinámica desde el tab correspondiente (quiz, networking, matching)
                         ↓
         Interacción en tiempo real (respuestas, votos, matchmaking por rondas)
                         ↓
         Resultados en vivo (leaderboard, matches, estadísticas)
                         ↓
         Cierre + resumen exportable
```

---

## 2. Arquitectura Técnica

### 2.1 Stack Elegido y Justificación

```
┌─────────────────────────────────────────────┐
│                  FRONTEND                    │
│         Next.js 14 (App Router)             │
│         React + Tailwind CSS                │
│         Supabase Realtime (WebSockets)      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│                 BACKEND                      │
│         Next.js API Routes / Server Actions  │
│         Supabase Auth (magic link o anónimo) │
│         Supabase Edge Functions (si needed)  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│               BASE DE DATOS                  │
│         Supabase (PostgreSQL)                │
│         Realtime subscriptions               │
│         Row Level Security (RLS)             │
└─────────────────────────────────────────────┘
```

**¿Por qué este stack y no el del doc original (Express + Socket.io + Firebase)?**

- **Next.js** = frontend + backend en un solo proyecto. Menos repos, menos config, deploy trivial en Vercel.
- **Supabase Realtime** reemplaza Socket.io + servidor WebSocket manual. Escucha cambios en la DB vía canales, sin mantener infraestructura de sockets.
- **Supabase Auth** = autenticación anónima para players y magic link para hosts. Cero fricción.
- **Una sola fuente de verdad** (PostgreSQL) vs. sincronizar Redis + Firebase + Express.
- **Vibe coding friendly:** un solo proyecto, un solo lenguaje (TypeScript), un solo deploy.

### 2.2 Comunicación en Tiempo Real

Se usa **Supabase Realtime** con dos mecanismos:

1. **Postgres Changes:** Para escuchar INSERT/UPDATE en tablas (nuevo participante, nueva respuesta, cambio de estado de sesión).
2. **Broadcast:** Para mensajes efímeros host→players que no necesitan persistencia (countdown timers, señales de UI, cambios de ronda de networking).

```typescript
// Ejemplo: Player escucha cambios de estado de la sesión
const channel = supabase
  .channel(`session:${sessionId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'sessions',
    filter: `id=eq.${sessionId}`
  }, (payload) => {
    handleStateChange(payload.new.state);
  })
  .subscribe();
```

```typescript
// Ejemplo: Host envía broadcast de countdown
const channel = supabase.channel(`session:${sessionId}`);
channel.send({
  type: 'broadcast',
  event: 'countdown',
  payload: { seconds: 10 }
});
```

```typescript
// Ejemplo: Host envía broadcast de nueva ronda de matchmaking
channel.send({
  type: 'broadcast',
  event: 'matchmaking_round',
  payload: { round: 2, totalRounds: 4, icebreaker: "¿Cuál fue tu último proyecto de diseño favorito?" }
});
```

### 2.3 Alternativa Aún Más Ligera (PartyKit)

Si se quiere una experiencia de sockets pura sin base de datos relacional:

- **PartyKit** (partykit.io) = WebSockets serverless. Cada "party" es una sala con estado en memoria.
- Ideal si el producto es puramente efímero (no se necesita persistir datos entre sesiones).
- Se puede combinar con Supabase solo para el dashboard del host.

> **Decisión para Claude Code:** Usar Supabase Realtime como default. Si durante el desarrollo la latencia no es suficiente para alguna dinámica específica, evaluar PartyKit para esa feature puntual.

---

## 3. Modelo de Datos

### 3.1 Esquema de Base de Datos

```sql
-- Sesiones de evento
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin VARCHAR(6) NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'lobby',
  -- estados: 'lobby' | 'active' | 'question' | 'voting' | 'results' | 'matching' | 'closed'
  current_activity_id UUID,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 4,
  matching_mode TEXT DEFAULT 'interests',
  -- modos de matching: 'random' | 'interests' | 'rounds'
  current_icebreaker TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '4 hours')
);

-- Participantes (auth anónima)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '😊',
  profession TEXT DEFAULT 'otro',
  -- profesiones predefinidas: 'diseno_ux' | 'diseno_ui' | 'product_design' | 'otro'
  profession_custom TEXT,
  interests TEXT[] DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  -- contact_info: { linkedin?: string, email?: string, twitter?: string }
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(session_id, display_name)
);

-- Actividades (icebreakers, quizzes, votaciones, matching)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  -- tipos: 'icebreaker' | 'quiz' | 'poll' | 'wordcloud' | 'matching' | 'open_question'
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  -- config varía por tipo:
  --   quiz:      { question, options[], correct_index, time_limit_seconds }
  --   poll:      { question, options[] }
  --   wordcloud: { prompt, max_words }
  --   matching:  { criteria, rounds, icebreaker_prompt }
  --   icebreaker:{ prompt }
  --   networking:{ duration_seconds, icebreaker_prompt }
  sort_order INTEGER NOT NULL DEFAULT 0,
  state TEXT DEFAULT 'pending',
  -- estados de actividad: 'pending' | 'active' | 'completed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Respuestas de participantes
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  -- value varía: { selected_index: 2 } | { text: "..." } | { words: ["a","b"] }
  score_earned INTEGER DEFAULT 0,
  responded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(activity_id, participant_id)
);

-- Matches de networking
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_a UUID NOT NULL REFERENCES participants(id),
  participant_b UUID NOT NULL REFERENCES participants(id),
  match_score FLOAT,
  round INTEGER DEFAULT 1,
  contact_exchanged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_sessions_pin ON sessions(pin) WHERE state != 'closed';
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_responses_activity ON responses(activity_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_matches_session_round ON matches(session_id, round);
```

### 3.2 Row Level Security (RLS)

```sql
-- Hosts pueden CRUD su sesión
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hosts_manage_sessions" ON sessions
  FOR ALL USING (auth.uid() = host_id);

-- Cualquiera puede leer sesión activa por PIN (para unirse)
CREATE POLICY "anyone_reads_active_sessions" ON sessions
  FOR SELECT USING (state != 'closed');

-- Participantes se insertan a sí mismos
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "join_session" ON participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Participantes leen a otros en su sesión
CREATE POLICY "read_session_participants" ON participants
  FOR SELECT USING (
    session_id IN (SELECT session_id FROM participants WHERE user_id = auth.uid())
  );
```

### 3.3 Limpieza Automática

```sql
-- Función para limpiar sesiones expiradas (ejecutar con pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE sessions SET state = 'closed' WHERE expires_at < now() AND state != 'closed';
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Estructura del Proyecto

```
eventconnect/
├── app/
│   ├── layout.tsx                 # Layout raíz con providers
│   ├── page.tsx                   # Landing page
│   ├── (host)/
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Lista de sesiones del host
│   │   ├── create/
│   │   │   └── page.tsx           # Crear nueva sesión con actividades
│   │   └── session/[id]/
│   │       ├── page.tsx           # Panel de control del host (proyectar) — Hub con Tabs
│   │       └── manage/
│   │           └── page.tsx       # Gestión de actividades
│   ├── (player)/
│   │   ├── join/
│   │   │   └── page.tsx           # Pantalla de unirse (PIN input)
│   │   └── play/[sessionId]/
│   │       └── page.tsx           # Interfaz del jugador (quiz + matchmaking)
│   └── api/
│       ├── sessions/
│       │   └── route.ts           # CRUD sesiones
│       ├── join/
│       │   └── route.ts           # Unirse a sesión (validar PIN)
│       └── matches/
│           └── route.ts           # Generar y gestionar matches por ronda
├── components/
│   ├── ui/                        # Componentes base (botones, inputs, cards, tabs)
│   ├── host/
│   │   ├── QRDisplay.tsx          # QR + PIN grande para proyectar
│   │   ├── ActivityController.tsx # Controles del host para cada actividad
│   │   ├── Leaderboard.tsx        # Tabla de posiciones en vivo
│   │   ├── ParticipantList.tsx    # Lista de asistentes conectados
│   │   ├── QuizTab.tsx            # Tab de Quiz — cola de preguntas + lanzar
│   │   ├── NetworkingTab.tsx      # Tab de Networking — matchmaking por rondas
│   │   ├── ResultsTab.tsx         # Tab de Resultados — leaderboard + estadísticas
│   │   ├── ConfigTab.tsx          # Tab de Configuración
│   │   ├── SessionTabs.tsx        # Componente contenedor de pestañas
│   │   └── LiveStats.tsx          # Estadísticas en vivo (conectados, respondiendo, etc.)
│   ├── player/
│   │   ├── JoinForm.tsx           # Formulario PIN + nombre + profesión
│   │   ├── QuizOptions.tsx        # Botones de respuesta estilo Kahoot
│   │   ├── PollVote.tsx           # Interfaz de votación
│   │   ├── WordCloudInput.tsx     # Input de palabras
│   │   ├── MatchCard.tsx          # Tarjeta de match con info de pareja
│   │   └── ContactExchange.tsx    # Botón/modal para intercambiar contacto
│   └── shared/
│       ├── Countdown.tsx          # Timer animado
│       ├── ProgressBar.tsx        # Barra de progreso para rondas/timer
│       ├── ResultsChart.tsx       # Gráficas de resultados
│       └── EmojiPicker.tsx        # Selector de avatar emoji
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Cliente browser
│   │   ├── server.ts              # Cliente server-side
│   │   └── middleware.ts          # Auth middleware
│   ├── realtime/
│   │   └── hooks.ts               # useSessionChannel, useActivityUpdates, useMatchUpdates, etc.
│   ├── utils/
│   │   ├── pin.ts                 # Generación de PIN (6 dígitos, evitar ambiguos)
│   │   ├── qr.ts                  # Generación de QR (qrcode lib)
│   │   ├── scoring.ts             # Lógica de puntuación (velocidad + acierto)
│   │   └── matching.ts            # Algoritmo de matching por intereses/aleatorio/rondas
│   └── types.ts                   # Tipos TypeScript compartidos
├── supabase/
│   ├── migrations/                # SQL migrations
│   └── config.toml                # Config de Supabase local
├── public/
│   └── sounds/                    # SFX opcionales (join, correct, wrong, match)
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── .env.local.example
```

---

## 5. Features por Prioridad

### 5.1 MVP (Fase 1) — Lanzar rápido

| Feature | Descripción |
|---|---|
| **Crear sesión** | Host crea sesión, recibe PIN + QR |
| **Unirse por PIN/QR** | Player ingresa PIN o escanea QR, pone su nombre, emoji y profesión |
| **Lobby en vivo** | Pantalla de espera que muestra quién se va uniendo |
| **Dashboard con Tabs** | Host controla todo desde un hub con pestañas: Quiz, Networking, Resultados, Config |
| **Quiz en vivo** | Cola de preguntas con opciones, timer, puntos por velocidad + acierto. Host lanza desde tab Quiz |
| **Leaderboard** | Tabla de posiciones actualizada en tiempo real |
| **Pantalla del host** | Vista optimizada para proyectar (QR grande, estadísticas en vivo) |
| **Estadísticas en vivo** | Panel con conectados, en espera, respondiendo, avg tiempo, puntaje top |

### 5.2 Fase 2 — Networking

| Feature | Descripción |
|---|---|
| **Matchmaking por rondas** | Host lanza rondas de networking desde tab Networking. Parejas se asignan automáticamente |
| **Modos de matching** | Aleatorio, por intereses, por rondas rotativas |
| **Icebreakers** | Pregunta/prompt mostrado a cada pareja para facilitar la conversación |
| **Timer de ronda** | Countdown visible en móvil del player con barra de progreso |
| **Intercambio de contacto** | Botón para compartir LinkedIn/email/twitter con la pareja actual (opt-in) |
| **Votaciones/Polls** | Encuestas en vivo con resultados en barra horizontal |
| **Word Cloud** | Los players envían palabras, se muestra nube en tiempo real |
| **Perfil de intereses** | Al unirse, el player selecciona 3-5 intereses de una lista |

### 5.3 Fase 3 — Matching avanzado

| Feature | Descripción |
|---|---|
| **Matching inteligente** | Algoritmo empareja personas por intereses complementarios (Jaccard similarity) |
| **Re-mezclar parejas** | Host puede forzar re-shuffle en cualquier momento |
| **Jugador en espera** | Si hay número impar, un player queda en espera y rota en la siguiente ronda |
| **Resumen post-evento** | CSV/PDF con matches, respuestas, contactos intercambiados, estadísticas |

---

## 6. Especificaciones de Pantallas (Wireframes)

### 6.1 Pantalla HOST — Dashboard con Tabs (para proyectar)

El dashboard del Host se organiza en un **hub con pestañas** que permite controlar Quiz y Networking desde una sola interfaz. Incluye QR + PIN, estadísticas en vivo y cola de preguntas.

```
┌──────────────────────────────────────────────────────────┐
│  ◉ EventConnect                   Sesión: EVT-MTY-026   │
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
```

**Elementos clave:**
- **Pestañas superiores:** Quiz (default), Networking, Resultados, Config
- **QR + PIN:** Siempre visible para que nuevos asistentes puedan unirse
- **Estadísticas en vivo:** Conectados, en espera, respondiendo, avg tiempo, puntaje top
- **Cola de preguntas:** Lista ordenada con estado (completado ✅ / pendiente ⬜), timer y tipo
- **Controles:** Lanzar siguiente pregunta, pausar sesión

### 6.2 Pantalla HOST — Tab Networking (Matchmaking)

Desde esta pestaña, el Host gestiona las rondas de matchmaking, elige el modo de emparejamiento y ve las parejas activas en tiempo real.

```
┌──────────────────────────────────────────────────────────┐
│  ◉ EventConnect                   Sesión: EVT-MTY-026   │
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
```

**Elementos clave:**
- **Selector de modo:** Aleatorio, por intereses (Jaccard), rondas rotativas
- **Parejas activas:** Lista de parejas con nombres y timer compartido
- **Jugador en espera:** Si hay número impar, se muestra claramente quién espera
- **Icebreaker actual:** Prompt visible para el Host (y enviado a los players)
- **Controles:** Siguiente ronda, re-mezclar parejas manualmente

### 6.3 Pantalla PLAYER — Matchmaking (móvil)

El player ve su pareja asignada, el icebreaker de la ronda y un timer con barra de progreso. Puede intercambiar contacto con un tap.

```
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
```

**Elementos clave:**
- **Indicador de ronda:** Ronda actual / total de rondas
- **Tarjeta de pareja:** Nombre, profesión/rol, handle o info de contacto
- **Icebreaker:** Prompt de conversación enviado por el Host
- **Timer + barra de progreso:** Tiempo restante de la ronda con visual de progreso
- **Botón de intercambio de contacto:** Opt-in para compartir LinkedIn/email/twitter

### 6.4 Pantalla PLAYER — Quiz activo (móvil)

El player responde preguntas de quiz con botones de color estilo Kahoot. Ve el timer, sus puntos acumulados y la pregunta actual.

```
┌───────────────────────┐
│  ◉ EventConnect       │
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
```

**Elementos clave:**
- **Indicador de progreso:** Pregunta actual / total de preguntas
- **Texto de pregunta:** Claro y legible en pantalla móvil
- **Opciones con color:** 4 botones tipo Kahoot con colores diferenciados (rojo, azul, amarillo, verde)
- **Timer + puntos:** Cuenta regresiva y puntuación acumulada del player
- **Touch targets grandes:** Mínimo 48px para accesibilidad móvil

---

## 7. Especificaciones Técnicas Detalladas

### 7.1 Generación de PIN

```typescript
// lib/utils/pin.ts
// PIN de 6 dígitos, evitando secuencias fáciles de adivinar
export function generatePin(): string {
  const BANNED = ['000000', '111111', '123456', '654321', '999999'];
  let pin: string;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (BANNED.includes(pin));
  return pin;
}

// Formato visual: "782 134" (con espacio en medio para legibilidad)
export function formatPin(pin: string): string {
  return `${pin.slice(0, 3)} ${pin.slice(3)}`;
}
```

### 7.2 Generación de QR

```typescript
// lib/utils/qr.ts
// Usar la librería "qrcode" (npm install qrcode)
import QRCode from 'qrcode';

export async function generateQRDataURL(sessionPin: string): Promise<string> {
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join?pin=${sessionPin}`;
  return QRCode.toDataURL(joinUrl, {
    width: 512,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
    errorCorrectionLevel: 'H' // Alto: funciona mejor con proyectores
  });
}
```

### 7.3 Scoring de Quiz

```typescript
// lib/utils/scoring.ts
// Puntos = base por acierto + bonus por velocidad
export function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitMs: number
): number {
  if (!isCorrect) return 0;
  const BASE_POINTS = 1000;
  const timeRatio = Math.max(0, 1 - (responseTimeMs / timeLimitMs));
  const speedBonus = Math.round(timeRatio * 500);
  return BASE_POINTS + speedBonus;
}
```

### 7.4 Algoritmo de Matching

```typescript
// lib/utils/matching.ts
// Matching por intersección de intereses con distribución equitativa
interface Participant { id: string; interests: string[]; profession: string }

export type MatchingMode = 'random' | 'interests' | 'rounds';

export function generateMatches(
  participants: Participant[],
  previousMatches: Set<string>, // "id1-id2" para evitar repetir
  mode: MatchingMode = 'interests'
): { pairs: Array<[string, string]>; waiting: string | null } {
  if (mode === 'random') {
    return generateRandomMatches(participants, previousMatches);
  }
  return generateInterestMatches(participants, previousMatches);
}

function generateInterestMatches(
  participants: Participant[],
  previousMatches: Set<string>
): { pairs: Array<[string, string]>; waiting: string | null } {
  const scores: Array<{ a: string; b: string; score: number }> = [];

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const a = participants[i];
      const b = participants[j];
      const pairKey = [a.id, b.id].sort().join('-');
      if (previousMatches.has(pairKey)) continue;

      const shared = a.interests.filter(i => b.interests.includes(i)).length;
      const total = new Set([...a.interests, ...b.interests]).size;
      const score = total > 0 ? shared / total : 0; // Jaccard similarity
      scores.push({ a: a.id, b: b.id, score });
    }
  }

  // Greedy matching: tomar el mejor par disponible, remover, repetir
  scores.sort((x, y) => y.score - x.score);
  const matched = new Set<string>();
  const pairs: Array<[string, string]> = [];

  for (const { a, b } of scores) {
    if (!matched.has(a) && !matched.has(b)) {
      pairs.push([a, b]);
      matched.add(a);
      matched.add(b);
    }
  }

  // Detectar jugador en espera (número impar)
  const waiting = participants.find(p => !matched.has(p.id))?.id || null;

  return { pairs, waiting };
}

function generateRandomMatches(
  participants: Participant[],
  previousMatches: Set<string>
): { pairs: Array<[string, string]>; waiting: string | null } {
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const pairs: Array<[string, string]> = [];

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairs.push([shuffled[i].id, shuffled[i + 1].id]);
  }

  const waiting = shuffled.length % 2 !== 0 ? shuffled[shuffled.length - 1].id : null;

  return { pairs, waiting };
}
```

### 7.5 Estado de la Sesión (Máquina de Estados)

```
lobby → active → question → results → (loop a question o matching)
                    ↓
                 voting → results
                    ↓
                matching → results
                    ↓
                  closed
```

```typescript
// lib/types.ts
export type SessionState =
  | 'lobby'      // Esperando participantes
  | 'active'     // En curso, entre actividades
  | 'question'   // Mostrando pregunta de quiz
  | 'voting'     // Votación o poll activa
  | 'matching'   // Ronda de matching en curso
  | 'results'    // Mostrando resultados
  | 'closed';    // Sesión terminada

export type ActivityType =
  | 'quiz'
  | 'poll'
  | 'wordcloud'
  | 'icebreaker'
  | 'matching'
  | 'networking'
  | 'open_question';

export type MatchingMode = 'random' | 'interests' | 'rounds';

export type Profession = 'diseno_ux' | 'diseno_ui' | 'product_design' | 'otro';

export interface PlayerMatch {
  partnerId: string;
  partnerName: string;
  partnerProfession: string;
  partnerContact?: string;
  icebreaker: string;
  round: number;
  totalRounds: number;
  timeRemainingSeconds: number;
}
```

---

## 8. Seguridad

### 8.1 Controles a Implementar

| Control | Implementación |
|---|---|
| **PIN no adivinable** | 6 dígitos aleatorios, rotación si no se usa en 30 min |
| **Rate limiting** | Máx 5 intentos de PIN por IP por minuto (middleware) |
| **Sesiones efímeras** | TTL de 4 horas, auto-cleanup con pg_cron |
| **Validación server-side** | Toda respuesta se valida contra el estado actual de la sesión |
| **Auth anónima** | Supabase anonymous auth para players (no necesitan email) |
| **RLS** | Row Level Security en todas las tablas |
| **Input sanitization** | Nombres, profesiones y respuestas sanitizados antes de render |
| **Contacto opt-in** | Intercambio de contacto solo si ambas partes lo aceptan |

### 8.2 Protección Anti-Bot

```typescript
// middleware.ts — Rate limiting simple con Supabase Edge
import { NextResponse } from 'next/server';

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxAttempts;
}
```

---

## 9. UX y Diseño

### 9.1 Principios

- **Zero friction join:** Escanear → poner nombre → seleccionar profesión → listo. Máximo 3 pasos.
- **Mobile-first player UI:** Botones grandes (mín 48px touch target), colores de alto contraste.
- **Host UI optimizada para proyector:** Texto grande, fondo oscuro, QR visible desde lejos. Dashboard con tabs para navegar entre dinámicas.
- **Feedback instantáneo:** Vibración haptic en móvil al responder, animaciones de confetti/check.
- **Accesible:** Colores que pasen WCAG AA, no depender solo de color para información.
- **Networking claro:** Tarjeta de pareja con info relevante (nombre, profesión, icebreaker) visible de un vistazo.

### 9.2 Paleta de Colores

```css
:root {
  --bg-primary: #0f0f0f;
  --bg-card: #1a1a2e;
  --accent-1: #e94560;   /* Rojo/rosa — respuesta A */
  --accent-2: #0f3460;   /* Azul — respuesta B */
  --accent-3: #16c79a;   /* Verde — respuesta C */
  --accent-4: #f5a623;   /* Naranja — respuesta D */
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --success: #16c79a;
  --error: #e94560;
}
```

### 9.3 Tipografía

- **Host display:** Inter o Space Grotesk, bold, 48-72px para títulos proyectados.
- **Player UI:** System font stack para carga instantánea.
- **Código QR:** Mínimo 256x256px en pantalla del host.

---

## 10. Deploy y DevOps

### 10.1 Setup Local

```bash
# 1. Clonar e instalar
git clone <repo>
cd eventconnect
npm install

# 2. Supabase local
npx supabase start
npx supabase db push

# 3. Configurar env
cp .env.local.example .env.local
# Editar con las keys de Supabase local

# 4. Dev server
npm run dev
```

### 10.2 Deploy a Producción

```bash
# Frontend: Vercel (zero config con Next.js)
vercel deploy

# Backend: Supabase Cloud (proyecto conectado)
npx supabase link --project-ref <project-id>
npx supabase db push
```

### 10.3 Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://eventconnect.app
```

---

## 11. Dependencias (package.json)

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18.3",
    "react-dom": "^18.3",
    "@supabase/supabase-js": "^2.45",
    "@supabase/ssr": "^0.5",
    "qrcode": "^1.5",
    "tailwindcss": "^3.4",
    "framer-motion": "^11",
    "lucide-react": "^0.400",
    "clsx": "^2.1",
    "zod": "^3.23"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "@types/react": "^18.3",
    "@types/node": "^20",
    "supabase": "^1.190"
  }
}
```

---

## 12. Instrucciones para Claude Code

### Cómo usar esta spec

Esta spec está diseñada para ser consumida por Claude Code. Usa estos comandos:

```bash
# Para empezar el proyecto desde cero:
"Lee Spec_EventConnect.md y crea el proyecto base con el stack definido. Empieza con el setup de Next.js + Supabase + las migraciones de base de datos."

# Para implementar el dashboard con tabs:
"Implementa el dashboard del Host con pestañas (Quiz, Networking, Resultados, Config) según la sección 6.1 y 6.2 de la spec."

# Para implementar matchmaking:
"Implementa la feature de matchmaking por rondas según las secciones 6.2, 6.3 y 7.4 de la spec."

# Para implementar features:
"Implementa la feature de [crear sesión con PIN y QR] según la sección 5.1 y 7.1-7.2 de la spec."

# Para iterar:
"Revisa la spec sección 6.1 y mejora la pantalla del host para que sea más visible en proyectores."
```

### Convenciones de Código

- **TypeScript estricto** en todo el proyecto.
- **Server Components** por defecto, `'use client'` solo donde haya interactividad.
- **Server Actions** para mutaciones (crear sesión, enviar respuesta, intercambiar contacto).
- **Zod** para validación de inputs en server actions y API routes.
- **Nombres de archivos** en kebab-case excepto componentes React (PascalCase).
- **No over-engineer:** Si una feature se puede resolver con estado local de React, no crear un store global.

### Orden de Implementación Sugerido

1. Setup del proyecto (Next.js + Supabase + Tailwind + tipos)
2. Migraciones de DB + RLS
3. Auth (anónima para players, magic link para hosts)
4. Crear sesión + generar PIN/QR
5. Unirse a sesión (formulario PIN + nombre + profesión → lobby)
6. Lobby en tiempo real (Supabase Realtime)
7. Dashboard del Host con sistema de pestañas (Quiz, Networking, Resultados, Config)
8. Quiz engine (cola de preguntas, responder, scoring)
9. Matchmaking engine (generar parejas, rondas, icebreakers)
10. Pantalla del Player — Quiz (respuestas con colores)
11. Pantalla del Player — Matchmaking (tarjeta de pareja + timer + intercambio de contacto)
12. Leaderboard en tiempo real
13. Polish: animaciones, sonidos, responsive, Neobrutalism styling

---

## Apéndice A: Decisiones Descartadas

| Opción | Por qué no |
|---|---|
| Express + Socket.io | Requiere mantener servidor de WebSockets separado. Más infra, más complejidad. |
| Firebase Realtime DB | Vendor lock-in fuerte, pricing impredecible a escala. |
| Redis como message broker | Overkill para MVP. Supabase Realtime cubre el caso de uso. |
| Plugin de Figma | Limita la audiencia a usuarios de Figma. La web es universal. |
| React Native / app nativa | Fricción de descarga. PWA sobre web mobile es suficiente. |
| Dashboard sin tabs | Pantalla única limitaba la gestión de múltiples dinámicas. El hub con tabs permite alternar quiz ↔ networking fluidamente. |

## Apéndice B: Escalabilidad Futura

Si la plataforma crece más allá de ~500 concurrent users por sesión:

- Migrar la parte de broadcast a **PartyKit** o **Cloudflare Durable Objects** para latencia sub-50ms.
- Agregar **Cloudflare Workers** como edge layer para rate limiting geográfico.
- Considerar **Supabase Realtime multiplexing** para reducir conexiones WebSocket.
- Implementar **connection pooling** con PgBouncer (ya incluido en Supabase Pro).
