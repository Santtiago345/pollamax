# 🏆 PollaMax — Polla Mundialista Familiar en Tiempo Real

PollaMax es una plataforma web interactiva para que grupos familiares o de amigos ("pollas" o "quinielas") pronostiquen los resultados del Mundial de Fútbol 2026. Los usuarios predicen marcadores, acumulan puntos según sus aciertos, compiten en un ranking en vivo y siguen la actividad de todos los participantes a través de un feed en tiempo real.

**Tecnologías:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Firebase (Auth + Firestore), Framer Motion, Lucide Icons, Vercel Analytics.

---

## ✨ Funcionalidades Completas

### 🔐 Autenticación
- Inicio de sesión con Google mediante Firebase Auth.
- Perfil de usuario con nombre, foto, puntos, país seleccionado.
- Administradores con acceso a panel de control exclusivo.

### 🎯 Pronósticos de Partidos (`/matches`)
- Carga de partidos en tiempo real desde **OpenFootball API** (cada 30 segundos).
- Interfaz para ingresar marcadores con teclado numérico.
- **Bloqueo automático** 5 minutos antes del inicio de cada partido.
- Coloración de pronósticos: verde (acierto exacto), naranja (ganador/empate correcto), rojo (fallo).
- Agrupación de partidos en Hoy, Mañana, Próximos.
- Animaciones con framer-motion (entrada escalonada, popLayout en transiciones).

### 🌍 Mundial en Vivo (`/mundial`)
- **Partidos:** Vista unificada con todos los partidos agrupados por día, colores según acierto del usuario, horas en formato AM/PM, banner del partido en vivo con marcador actualizado, banner del próximo partido con cuenta regresiva.
- **Grupos:** Tablas de posiciones de los 12 grupos (formato 2026: 48 equipos, top 3 clasifican a R32) con estadísticas completas (PJ, PG, PE, PP, GF, GC, DG, Pts).
- **Llaves:** Árbol de eliminación directa desde Ronda de 32 hasta la Final, con proyección dinámica basada en posiciones actuales de grupos y mejores terceros según conjuntos FIFA definidos.
- Eventos de cambio de partido detectados (en vivo, gol, entretiempo, finalizado) mostrados en barra de notificaciones.

### 🏆 Sistema de Puntuación
| Condición | Puntos |
|-----------|--------|
| Marcador exacto | **+5** |
| Ganador correcto (no exacto) | **+3** |
| Empate correcto (no exacto) | **+2** |
| Gol de un equipo acertado | **+1 c/u** |
| Diferencia de goles exacta | **+1** |
| Campeón del Mundial | **+25** |
| Subcampeón | **+17** |
| Tercer puesto | **+13** |

### 🔥 Sistema de Rachas
- **Racha de Marcadores Exactos:** 3 seguidos → +1 pt extra, 4+ → +2 pts extra.
- **Racha de Ganadores:** 3 seguidos → +3 pts extra, 4+ → +1 pt extra.
- Las rachas se consolidan al finalizar cada partido. Si un usuario no apuesta un partido, su racha se reinicia.
- Badge de racha visible siempre en el navbar con colores dinámicos (verde para exactos, rojo para ganadores).

### 📊 Ranking (`/ranking`)
- Tabla de posiciones en tiempo real con datos de Firestore.
- **Podio animado** con entradas spring desde `y:100`.
- **Detección de cambios de posición** entre sesiones usando `sessionStorage`.
- Animación de escala en puntos al actualizar.
- `AnimatePresence mode="popLayout"` para transiciones suaves en filas.

### 📋 Feed de Actividad (`/feed`)
- Muro en tiempo real con todas las apuestas, resultados, rachas y nuevos jugadores.
- Suscripción a `collection(db, 'history')` con `onSnapshot`.
- Entradas destacadas para rachas (color naranja).
- Cabecera con avatares de todos los participantes, sus puntos y badge de racha.

### 🔔 Sistema de Notificaciones
- Notificaciones nativas del navegador (API Notification).
- **Detección de iOS**: usa alertas en pantalla como fallback (iOS no soporta Notification API).
- 4 categorías configurables desde `UserSettings`: recordatorios de partidos, apuestas de otros, rachas, nuevos jugadores.
- Programación automática de recordatorios 1h, 30min y 10min antes de cada partido.

### 🔊 Efectos de Sonido
- Web Audio API (sin archivos externos).
- Sonidos para: navegación entre tabs, entrada al podio, cambios de posición en ranking, guardar apuesta, errores.
- Inicialización lazy del `AudioContext` con auto-resume.

### 🛠️ Panel de Administración (`/admin`)
- **Partidos:** Crear, poner en vivo, actualizar marcador (+A/+B), finalizar (distribuye puntos automáticamente), eliminar.
- **Sincronización Mundial:** Importa todos los partidos del Mundial 2026 desde OpenFootball API.
- **Podio Oficial:** Seleccionar campeón/subcampeón/tercero y distribuir puntos a todos los usuarios que acertaron.
- **Feed:** Cargar últimas 100 entradas, eliminar individualmente, vaciar todo el feed.
- **Apuestas:** Examinar partidos con apuestas, ver apuestas por usuario/marcador, eliminar individualmente, vaciar todas las apuestas de un partido.
- **Usuarios:** Lista completa con toggle de admin, cambio manual de puntos, eliminación de usuario (borra también sus apuestas).
- **Firebase Config:** Stats por colección, visor JSON de `config/tournamentResults`, limpiar `worldCupCache`.
- **Notificaciones:** Botones de prueba para cada categoría (con fallback iOS).
- **Simulación Ranking:** Botones para sumar puntos, ascender al último lugar, resetear animaciones.
- **PlayerManager:** Ajuste de puntos (+5/+1/−1/−5) por jugador con `batch.update` + `increment`.

### 🏠 Página de Inicio (`/`)
- Dashboard con puntos, racha actual, enlaces rápidos a todas las secciones.
- Iconos animados con loop infinito (rotación, rebote, latido).
- Sección de reglas de puntuación y explicación del sistema de rachas.
- ScrollReveal con IntersectionObserver para animaciones de entrada.

### 📄 Páginas Legales
- `/terminos` — Términos y Condiciones de uso.
- `/cookies` — Política de Cookies (Firebase Auth, Vercel Analytics, sessionStorage).
- `/dmca` — DMCA, atribución de terceros (OpenFootball, Firebase, Vercel, Lucide, Framer Motion).

### 🧭 Navegación y Layout
- Navbar responsivo con puntos, racha, enlaces a todas las secciones.
- `UserSettings` animado con `AnimatePresence` (escala + fade).
- Footer con enlaces legales.
- Transiciones de página con `AnimatePresence mode="popLayout"` 0.12s.
- Sonido de navegación al cambiar de tab.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js 16** (React 19, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | **Firebase Firestore** (tiempo real) |
| Autenticación | **Firebase Auth** (Google) |
| Despliegue | **Vercel** (Edge + Serverless) |
| Animaciones | **Framer Motion** |
| Iconos | **Lucide React** |
| Sonido | **Web Audio API** |
| Analytics | **Vercel Analytics** |
| API externa | **OpenFootball** (partidos y resultados) |

---

## 🗄️ Estructura de Firestore

### `users/{uid}`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `uid` | string | Firebase Auth UID |
| `name` | string | Nombre del usuario |
| `email` | string | Correo electrónico |
| `points` | number | Puntos totales |
| `isAdmin` | boolean | Admin flag |
| `photoURL` | string\|null | Foto de perfil |
| `country` | string\|null | País seleccionado |
| `predictions` | object | `{ champion, runnerUp, thirdPlace, submittedAt }` |
| `streak` | object | `{ type: 'exact'\|'winner'\|null, count, lastMatchId }` |
| `notificationPreferences` | object | `{ matchReminders, otherBets, streaks, newPlayers }` |

### `matches/{docId}`
Campos: `id`, `teamA`, `teamB`, `teamAFlag`, `teamBFlag`, `date`, `scoreA`, `scoreB`, `scoreAHt`, `scoreBHt`, `status` (scheduled\|live\|finished), `minutes`, `group`, `round`, `ground`, `goals1`, `goals2`.

### `bets/{userId_matchId}`
Campos: `id`, `userId`, `userName`, `userPhoto`, `matchId`, `predA`, `predB`, `processed`, `pointsEarned`, `createdAt`.

### `history/{docId}`
Campos: `userId`, `userName`, `userPhoto`, `message`, `timestamp`.

### `config/tournamentResults`
Campos: `champion`, `runnerUp`, `thirdPlace`, `processed`, `processedAt`.

### `worldCupCache/groups`
Campos: `groups`, `lastUpdated`. / `lastSync`: `timestamp`, `matchesTotal`.

---

## 📦 Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/tuusuario/pollamax.git
cd pollamax

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (.env.local)
# Crea un archivo .env.local con las credenciales de Firebase:
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## ☁️ Despliegue en Vercel

1. Sube el código a GitHub.
2. Conecta el repositorio en [vercel.com](https://vercel.com/).
3. Agrega las variables de entorno en Vercel (mismas que en `.env.local`).
4. Despliega. La URL será `https://tu-proyecto.vercel.app`.

Para dominio personalizado (`pollamax.vercel.app`), renombra el proyecto en Vercel → Settings → General.

---

## 🔥 Reglas de Seguridad Firestore

Debes copiar estas reglas en la consola de Firebase → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    match /bets/{betId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null 
        && request.resource.data.userId == request.auth.uid
        && get(/databases/$(database)/documents/matches/$(request.resource.data.matchId)).data.status == 'scheduled'
        && (time.date(get(/databases/$(database)/documents/matches/$(request.resource.data.matchId)).data.date).toMillis() - request.time.toMillis()) > 300000;
      allow delete: if false;
    }
    match /history/{historyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
    match /config/{configId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## 👑 Configurar Primer Admin

1. Regístrate con Google en la app.
2. En Firebase Console → Firestore → `users`, busca tu documento.
3. Agrega campo `isAdmin: true` (tipo boolean).
4. Recarga la app — verás el botón "Panel Admin".

---

## 📁 Arquitectura del Proyecto

```
src/
├── app/
│   ├── page.tsx              # Inicio / Dashboard
│   ├── layout.tsx            # Layout raíz (Navbar, Footer, AuthProvider)
│   ├── matches/page.tsx      # Pronósticos de partidos
│   ├── mundial/page.tsx      # Mundial (partidos, grupos, llaves)
│   ├── ranking/page.tsx      # Tabla de posiciones con podio
│   ├── feed/page.tsx         # Feed de actividad
│   ├── admin/page.tsx        # Panel de administración
│   ├── podium/page.tsx       # Predicciones de podio
│   ├── terminos/page.tsx     # Términos y Condiciones
│   ├── cookies/page.tsx      # Política de Cookies
│   ├── dmca/page.tsx         # DMCA y terceros
│   └── api/
│       ├── world-cup-sync/route.ts  # Sincronización OpenFootball
│       └── sync/route.ts            # Sync manual
├── components/
│   ├── AuthProvider.tsx       # Contexto de autenticación
│   ├── Navbar.tsx             # Navegación principal
│   ├── AnimatedLayout.tsx     # Transiciones de página
│   ├── MatchCard.tsx          # Componente de apuesta
│   ├── ScrollReveal.tsx       # Animación al hacer scroll
│   ├── StreakBadge.tsx        # Badge de racha
│   ├── UserSettings.tsx       # Configuración de usuario
│   ├── NotificationBanner.tsx # Banner de permiso notificaciones
│   └── NotificationService.tsx # Servicio de notificaciones
├── lib/
│   ├── firebase.ts            # Inicialización Firebase
│   ├── worldCupData.ts        # API OpenFootball + procesamiento
│   ├── rules.ts               # Cálculo de puntuación
│   ├── countries.ts           # Lista de países + banderas
│   ├── notifications.ts       # Sistema de notificaciones
│   └── sounds.ts              # Web Audio API (sonidos)
└── hooks/
    └── useMatchNotifications.ts # Programación de recordatorios

Archivos de configuración:
├── .env.local                 # Variables de entorno (local)
├── next.config.ts             # Configuración Next.js
├── tailwind.config.ts         # Configuración Tailwind
├── tsconfig.json              # Configuración TypeScript
├── AGENTS.md                  # Reglas para asistentes IA
└── README.md                  # Este archivo
```

---

## 📌 Notas Técnicas

- **Actualización de partidos:** OpenFootball JSON se consulta cada 30s; se detectan cambios (goles, entretiempo, finalización) y se muestran en una barra de eventos.
- **Minutos en vivo:** Se calculan desde la hora de inicio del partido restando 15 min de entretiempo (tiempo real de juego).
- **iOS Safari:** No soporta Notification API; usa `showInAppAlert()` como fallback.
- **Sonidos:** Web Audio API con inicialización lazy en primera interacción del usuario.
- **Animaciones:** `sessionStorage` para reproducir animaciones de podio y cambios de ranking solo una vez por sesión.
- **Streak:** Se evalúa al finalizar cada partido; si un usuario no apostó, su racha se reinicia (type: null, count: 0).

---

*Hecho con ❤️ para la familia Cocunubo-Neuta mundialista. Junio 2026.*
