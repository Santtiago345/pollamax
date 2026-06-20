# 🏆 PollaMax - Polla Mundialista Familiar en Tiempo Real

PollaMax es una aplicación web interactiva diseñada para apuestas familiares ("pollas" o "quinielas") del Mundial de Fútbol. Permite a un grupo de 20 a 50 usuarios pronosticar marcadores, competir en un ranking en tiempo real, visualizar las apuestas de otros miembros en un feed de actividad interactivo y seleccionar su podio (Campeón, Subcampeón y Tercer Puesto) antes del inicio del torneo.

---

## 🚀 Características Principales

1. **Autenticación Simple:** Login seguro con Google mediante Firebase Auth.
2. **Pronósticos de Partidos:** Panel intuitivo responsivo (mobile-first) para ingresar marcadores de fútbol, con bloqueo automático de apuestas 5 minutos antes del pitazo inicial de cada encuentro.
3. **Puntuación Acumulativa Dinámica:**
   - **Marcador Exacto:** **5 puntos** (puntuación plana).
   - **Ganador Correcto (no exacto):** **3 puntos**.
   - **Empate Correcto (no exacto):** **2 puntos**.
   - **Goles de un Equipo:** **1 punto** por cada equipo del cual se acierte la cantidad exacta de goles (máximo 2).
   - **Diferencia de Goles Exacta:** **1 punto** (si no se acierta el marcador exacto).
   - **Podio Final:** Campeón (**25 pts**), Subcampeón (**17 pts**), Tercer Puesto (**13 pts**).
4. **Ranking en Vivo:** Tabla de posiciones olímpica y clasificación general sincronizada en tiempo real mediante Firestore (`onSnapshot`).
5. **Feed de Actividad (Feed):** Muro de actualizaciones en tiempo real que registra qué ha apostado cada usuario de la familia para aumentar la competitividad y la diversión.
6. **Panel de Administrador Integrado:** Interfaz para crear partidos, controlar el marcador en tiempo real (modo vivo), finalizar encuentros, autocalcular y repartir los puntos a todos los usuarios en segundos, además de asignar el podio oficial al terminar el torneo.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 15 (React), TypeScript
- **Estilos:** Tailwind CSS v4 (Rápido, minimalista y responsivo)
- **Backend/Database/Realtime:** Firebase (Auth, Firestore)
- **Despliegue y Hosting:** Vercel (Gratuito)

---

## 📋 Guía de Configuración Paso a Paso

### 1. Configuración de Firebase (Servicios Gratuitos)

Sigue estos pasos en la consola de Firebase ([console.firebase.google.com](https://console.firebase.google.com/)):

1. **Crear un Proyecto:** Haz clic en "Agregar proyecto", nómbralo `PollaMax` y desactiva Google Analytics si lo prefieres para agilizar la creación.
2. **Habilitar Firebase Authentication:**
   - Ve a **Build > Authentication > Get Started**.
   - En la pestaña **Sign-in method**, selecciona **Google**, actívalo, ingresa el correo de soporte y guarda.
3. **Crear Base de Datos Firestore:**
   - Ve a **Build > Firestore Database > Create Database**.
   - Elige una ubicación cercana (ej. `us-central1` o `southamerica-east1`) y selecciona **Iniciar en modo de prueba** (luego aplicaremos reglas seguras).
4. **Obtener las Credenciales del SDK:**
   - Ve a la configuración del proyecto (icono de engranaje ⚙️ en la barra lateral > **Configuración del proyecto**).
   - En la pestaña **General**, ve a la sección "Tus apps", haz clic en el icono web `</>` para registrar una aplicación. Nómbrala `pollamax-web` y haz clic en **Registrar app**.
   - Copia el objeto `firebaseConfig` que contiene las claves de API, ID del proyecto, etc.

---

### 2. Configuración de Reglas de Seguridad en Firestore

Para proteger las apuestas de los usuarios (evitar que alguien modifique o ingrese apuestas después de iniciado el partido o modifique los puntos de otros usuarios), copia y pega las siguientes reglas en la pestaña **Rules** de tu base de datos de Firestore en la consola:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Perfil del usuario
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      // Solo el usuario puede modificar sus predicciones de podio, los admins pueden modificar todo (puntos)
      allow update: if request.auth != null && 
        (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Partidos
    match /matches/{matchId} {
      allow read: if request.auth != null;
      // Solo administradores pueden escribir o borrar partidos
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Apuestas
    match /bets/{betId} {
      allow read: if request.auth != null;
      // Solo se permite crear o actualizar si el usuario está autenticado, es su propio registro,
      // el partido está programado y faltan más de 5 minutos para su fecha de inicio.
      allow create, update: if request.auth != null 
        && request.resource.data.userId == request.auth.uid
        && get(/databases/$(database)/documents/matches/$(request.resource.data.matchId)).data.status == 'scheduled'
        && time.date(get(/databases/$(database)/documents/matches/$(request.resource.data.matchId)).data.date).toMillis() - request.time.toMillis() > 300000;
      allow delete: if false; // No se permite eliminar apuestas una vez hechas
    }
    
    // Historial de actividad
    match /history/{historyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
    
    // Configuración del podio final
    match /config/{configId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

### 3. Configuración del Primer Administrador

Por defecto, los usuarios nuevos no son administradores. Para asignar el rol de administrador al creador de la polla:
1. Regístrate en la aplicación con tu cuenta de Google.
2. Ve a la consola de Firebase en **Firestore Database > Colección `users`**.
3. Busca el documento correspondiente a tu `uid` (ID de usuario de Firebase Auth).
4. Agrega un campo nuevo de tipo **boolean** llamado `isAdmin` y establécelo en `true`.
5. Recarga la aplicación. Verás un nuevo botón **Panel Admin** en el menú de navegación y en tu dashboard.

---

### 4. Variables de Entorno (`.env.local`)

Crea un archivo llamado `.env.local` en la raíz de tu proyecto local y rellénalo con las credenciales que obtuviste en el paso 1:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
```

---

### 5. Instalación y Ejecución Local

Para probar y ejecutar la aplicación en tu computadora local:

```bash
# 1. Instalar las dependencias
npm install

# 2. Iniciar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para interactuar con la plataforma.

---

### 6. Despliegue en Vercel (100% Gratuito)

Vercel aloja aplicaciones Next.js de manera gratuita con soporte nativo para Serverless Functions.

1. **Subir tu código a GitHub:** Crea un repositorio privado o público en GitHub y empuja tu código local.
2. **Importar en Vercel:**
   - Inicia sesión en [vercel.com](https://vercel.com/) usando tu cuenta de GitHub.
   - Haz clic en **Add New > Project**.
   - Selecciona el repositorio de la polla futbolera.
3. **Configurar Variables de Entorno en Vercel:**
   - Expande la sección **Environment Variables** en la configuración de la importación.
   - Agrega cada una de las variables que pusiste en tu `.env.local` con sus valores respectivos.
4. **Desplegar:** Haz clic en **Deploy**. En menos de 2 minutos, tu sitio estará en vivo con un subdominio gratuito `https://tu-proyecto.vercel.app`.

---

## 🏆 Consejos Prácticos de Gestión (Para el Admin)

- **Cargar partidos rápidamente:** Al ingresar al panel de administración por primera vez, haz clic en **"Precargar partidos de prueba"** en la esquina superior derecha. Esto creará automáticamente 5 partidos del Mundial con fechas futuras para que tú y tu familia puedan probar el sistema de inmediato.
- **Puntuación automática:** Cuando finalice un partido real, entra al panel de administración, escribe el marcador definitivo y haz clic en **"Finalizar"**. El sistema recalculará instantáneamente las apuestas de todos los jugadores activos y les sumará los puntos correspondientes a sus tablas en milisegundos.
- **Predicciones del Podio:** Invita a tu familia a seleccionar su Campeón, Subcampeón y Tercer Puesto antes del inicio del torneo en la pestaña **"Podio"**. Una vez que se juegue el primer partido del torneo, estas selecciones se bloquearán automáticamente para todos.

---

## 🆕 Novedades (2026-06-20)

- Se agregó animación visual para las `rachas` de usuarios (`StreakBadge`) usando `framer-motion`.
- La pestaña `Mundial` ahora incluye una vista conceptual de llaves (Ronda de 32 → Octavos → Cuartos → Semifinal → Final) y muestra minutos en partidos en vivo con detección de medio tiempo.

Estas mejoras están diseñadas para ser ligeras y compatibles con la lógica existente en Firestore.

---

## Contribuir y Despliegue Rápido

- Para desarrollo local: `npm install` y `npm run dev`.
- Asegúrate de definir las variables de entorno en `.env.local` antes de ejecutar localmente o desplegar en Vercel.

