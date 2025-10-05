# Spectra Player
Visor de sesiones interactivo para reproducir y analizar sesiones de usuario (rrweb) en un player con timeline y herramientas de administración.

**Badges:** TODO: agregar badges de CI/CD, coverage y versiones si aplica.

## Tabla de Contenido
- [Resumen](#resumen)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Configuración & Variables de Entorno](#configuración--variables-de-entorno)
- [Scripts & Comandos](#scripts--comandos)
- [Guía de Uso](#guía-de-uso)
- [Partes Complejas Explicadas](#partes-complejas-explicadas)
- [Frontend (si aplica)](#frontend-si-aplica)
- [Backend (si aplica)](#backend-si-aplica)
- [Testing & Calidad](#testing--calidad)
- [Observabilidad & Seguridad](#observabilidad--seguridad)
- [CI/CD & Deploy](#cicd--deploy)
- [Rendimiento](#rendimiento)
- [Roadmap & TODOs](#roadmap--todos)
- [Glosario](#glosario)
- [Licencia](#licencia)

## Resumen
- ¿De qué trata el proyecto?
  - Repositorio de una aplicación web llamada "Spectra Player" que permite cargar y reproducir sesiones grabadas con rrweb. Proporciona un reproductor embebido (rrweb-player), una línea de tiempo basada en metadata (customEvents y errors), controles de reproducción y páginas de administración (Apps y Users) que usan localStorage.
- Tipo de proyecto: Frontend (Next.js App Router). No se detecta un backend monolítico dentro de este repositorio.
- Estado actual: TODO: determinar estado (alpha/beta/production). No hay indicadores explícitos de release o deploy en el repo.

## Stack Tecnológico
Basado en los archivos del repositorio (package.json, tsconfig, etc.).

| Capa | Herramientas / Versiones detectadas |
|---|---|
| Lenguaje | TypeScript (configurado en tsconfig.json, devDependency: typescript ^5) |
| Framework frontend | Next.js 15.5.4 (package.json) — App Router (estructura `src/app`) |
| UI / Estilos | Tailwind CSS (devDependency: tailwindcss ^4) y estilos globales en `src/app/globals.css` |
| React | react 19.1.0, react-dom 19.1.0 |
| Replayer | rrweb ^2.0.0-alpha.4, rrweb-player ^1.0.0-alpha.4 |
| Compression | pako ^2.1.0 (para inflar eventos comprimidos) |
| Linter | eslint ^9 con `eslint.config.mjs` que extiende `next/core-web-vitals` y `next/typescript` |
| Herramientas dev | @types/node, @types/react, @types/react-dom, PostCSS (`postcss.config.mjs`) |

Observación: No se detectan dependencias de backend (Express/Nest/etc.) ni archivos Docker o infra.

## Estructura de Carpetas
Árbol (profundidad 3, excluyendo node_modules y .next):

```
.
├─ package.json
├─ next.config.ts
├─ tsconfig.json
├─ postcss.config.mjs
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ globals.css
  │  ├─ favicon.ico
  │  ├─ login/page.tsx (ruta: /)
  │  ├─ sessions/page.tsx
  │  ├─ apps/page.tsx
  │  ├─ users/page.tsx
  │  └─ player/[id]/page.tsx
│  ├─ components/
│  │  ├─ SpectraViewer.tsx
│  │  ├─ PlayerControls.tsx
│  │  ├─ EventTimeline.tsx
│  │  ├─ EventCard.tsx
│  │  ├─ AnnotationsPanel.tsx
│  │  └─ AppShell.tsx
│  ├─ icons/
│  │  └─ (Play, Pause, SkipBack, SkipForward, Maximize)
│  ├─ sessions/
│  │  └─ sess-1.json
│  └─ types/
│     ├─ spectra.ts
│     ├─ pako.d.ts
│     └─ rrweb-player.d.ts
└─ README.md (este archivo)
```

Explicación de carpetas clave:
- `src/app`: rutas de Next.js (App Router). Páginas principales: login (root), sessions, player (dinámico), apps y users.
- `src/components`: componentes de UI y lógica para el reproductor (SpectraViewer), controles (PlayerControls), y timeline (EventTimeline).
- `src/sessions`: sesiones JSON de ejemplo (ej. `sess-1.json`).
- `src/types`: definiciones TypeScript para eventos, metadata y adaptadores del replayer.

## Configuración & Variables de Entorno
No se encontraron archivos `.env` ni referencias claras a variables de entorno en los archivos principales.

| Variable | Descripción | Ejemplo | Requerida |
|---:|---|---|---:|
| TODO: | No se detectaron variables de entorno en el repositorio | | NO |

Instrucción rápida: crear `.env.local` en la raíz si tu despliegue/infra lo requiere y documentar variables allí. **TODO:** listar variables necesarias si se integra un backend o proveedor de hosting.

## Scripts & Comandos
Extraídos de `package.json`.

- Instalar dependencias (npm):
```bash
npm install
```
- Desarrollo (Next + Turbopack):
```bash
npm run dev
```
- Build (producción):
```bash
npm run build
```
- Iniciar producción (Next Start):
```bash
npm run start
```
- Lint:
```bash
npm run lint
```

Notas:
- `dev` y `build` usan la opción `--turbopack` en Next (según package.json).
- No se encuentran scripts para tests, storybook, o migraciones.

## Guía de Uso

### Prerrequisitos
- Node.js (recomendado: compatible con TypeScript 5 y Next 15). No se detectó un `.nvmrc` ni `engines` en package.json — **TODO:** especificar versión de Node.
- npm

### Pasos rápidos (modo desarrollo)
1. Clona el repositorio:
```bash
git clone <repo-url>
cd mediaPlayer
```
2. Instala dependencias:
```bash
npm install
```
3. Levanta el servidor de desarrollo:
```bash
npm run dev
```
4. Abre en el navegador: http://localhost:3000

### Páginas notables
- `/` - Página de login (client component que redirige a /sessions en el ejemplo).
- `/sessions` - Listado de sesiones (pagina presente en `src/app/sessions/page.tsx`).
- `/player/[id]` - Reproductor de sesión; carga JSON desde `src/sessions/<id>.json` o intenta fetch a `/api/sessions/<id>/replay` si no está embebida.
- `/apps` - CRUD simple de aplicaciones (almacenamiento en localStorage).
- `/users` - CRUD simple de usuarios (almacenamiento en localStorage). La página muestra/oculta y copia contraseñas.

### Cargar una sesión de ejemplo
- Hay una sesión de ejemplo en `src/sessions/sess-1.json`. En la UI esta sesión debe poder abrirse desde `/player/sess-1` (según rutas y componentes).

## Partes Complejas Explicadas
Aquí se documentan las piezas menos obvias que aparecen en el repo.

1) Adaptador runtime para `rrweb-player` (en `src/components/SpectraViewer.tsx`)
- Problema que resuelve: `rrweb-player` se distribuye como un componente Svelte wrapper que en distintas versiones puede exponer la API del replayer de formas diferentes (prop `replayer`, `player`, instancias internas, etc.).
- Estrategia implementada:
  - Se instancia el componente Svelte con `new Player({ target, props })` y se guarda la instancia.
  - Se inspecciona dinámicamente la instancia buscando un objeto interno que exponga `getCurrentTime`, `play`, `pause`, `setSpeed` y `getMetaData`.
  - Se rellena un objeto adaptador (mediante checks en `replayerRef.current` y caminos como `__innerReplayer`, `replayer`, `player`, o `$set`) para invocar métodos de forma robusta.

Diagrama ASCII breve:

```
SpectraViewer (Svelte rrweb-player instance)
  └─ replayerRef.current (Svelte instance)
       ├─ .__innerReplayer? -> Replayer API
       ├─ .replayer?        -> Replayer API
       ├─ .player?          -> Replayer API
       └─ .$set             -> fallback para set currentTime
```

Puntos de extensión / errores comunes:
- Si rrweb-player cambia internals, es probable que sea necesario adaptar las rutas de detección.
- Durante el control del tiempo el player puede no reportar `getCurrentTime`; PlayerControls implementa polling y un `lastReportedRef` para mantener la UI coherente.

2) Timeline derivada exclusivamente de `metadata` (en `src/components/EventTimeline.tsx`)
- Diseño: la timeline ya no recorre todos los eventos rrweb; usa únicamente `metadata.customEvents` y `metadata.errors` si existen.
- Normalización: `metadata.errors` es normalizada a eventos custom con `eventType: 'error'` y se le asigna `timestamp` si está disponible.

3) PlayerControls (en `src/components/PlayerControls.tsx`)
- Funcionalidades destacadas:
  - Slider que opera en MILISEGUNDOS (step=100) y seek en ms.
  - Botones +/-5s; Shift/Alt+click tienen acciones alternativas (ej. ir al inicio o reanudar).
  - Menú de velocidad renderizado en un portal (`createPortal`) para evitar clipping por overflow del layout.
  - Fallbacks para setSpeed/getCurrentTime en diferentes shapes de la API.

Errores comunes:
- Algunas implementaciones de rrweb-player exponen `setSpeed` como propiedad de solo lectura o lo gestionan internamente; en esos casos la llamada puede fallar silenciosamente (por eso hay try/catch y fallbacks).

## Frontend (si aplica)
- Framework: Next.js (App Router). Rutas bajo `src/app`.
- Componentes claves:
  - `SpectraViewer.tsx`: carga y parsea la sesión (soporta strings comprimidos/base64, usa `pako`), calcula `totalTime` y monta `rrweb-player`.
  - `PlayerControls.tsx`: UI de reproducción y adaptador de control.
  - `EventTimeline.tsx`: timeline que muestra `metadata.customEvents` y `metadata.errors`.
- Estado: manejo local en componentes y localStorage para CRUDs de Apps/Users.
- Estilos: TailwindCSS + `src/app/globals.css` que define tokens de color y utilidades (`.app-input`, `.card-surface`, `.pill-button`).
- Formulario/Validación: validaciones simples en cliente (regex para email, longitud mínima de contraseña), no se usa una librería de formularios explícita.

Build & optimizaciones:
- `next build --turbopack` es el comando de build configurado.
- No hay config explícita para imágenes remotas, SWR/RTK Query o caching avanzado detectado.

## Backend (si aplica)
- No se detecta backend en este repositorio (no hay `api` server folder ni dependencias de servidor en package.json más allá de Next runtime). No obstante, `SpectraViewer` intenta `fetch('/api/sessions/<id>/replay')` como fallback para obtener sesiones cuando no están embebidas.

| Item | Estado |
|---|---|
| Endpoints internos | **TODO:** documentar si existe un servicio externo que atienda `/api/sessions/:id/replay` |

## Testing & Calidad
- No se detectaron tests (no hay `tests` o dependencias como jest/vitest/playwright).
- Lint: `eslint` configurado y `npm run lint` disponible. Configuración principal en `eslint.config.mjs`.
- Tipos: TypeScript habilitado (strict true en `tsconfig.json`) con tipos personalizados en `src/types`.

## Observabilidad & Seguridad
- No hay configuración de logging centralizada, métricas, tracing o SAST en este repo.
- Seguridad básica: validaciones cliente para email y tamaño de contraseña. No existe manejo de autenticación real (login redirige a /sessions sin verificar credenciales).

Riesgos / TODOs:
- **TODO:** añadir manejo seguro de contraseñas (hashing, backend seguro) si se persisten usuarios.
- **TODO:** revisar CORS, CSP y headers de seguridad para producción.

## CI/CD & Deploy
- No se encontró configuración de CI (no hay `.github/workflows` ni archivos de pipeline detectados).
- `next.config.ts` existe pero está vacío de opciones específicas.

| Item | Estado |
|---|---|
| GitHub Actions workflows | **TODO: agregar** |
| Dockerfile | **TODO: agregar** |
| Host recomendado | Vercel (Next.js) — **TODO:** configurar despliegue |

## Rendimiento
- Comportamiento detectado:
  - Se usa Turbopack en los scripts `dev` y `build` (según package.json).
  - `SpectraViewer` calcula `totalTime` localmente y evita procesar eventos en la timeline (usa metadata) para rendimiento.

Optimización adicionales sugeridas (TODO):
- **TODO:** agregar lazy-loading de sesiones grandes, chunked parsing y Web Worker para decodificar eventos comprimidos.

## Roadmap & TODOs
- Prioritarios:
  - Corregir/validar adaptador de rrweb-player en runtime si cambia la API.
  - Añadir CI (lint, build y tests) — **TODO**.
  - Especificar versión de Node y guía de despliegue — **TODO**.
- Funcionalidades útiles:
  - Integrar backend para persistencia real de Apps/Users y sesiones — **TODO**.
  - Añadir E2E tests para flujos de reproducción y timeline — **TODO**.

## Glosario
- rrweb: biblioteca de reproducción/registro de sesiones de usuario.
- rrweb-player: componente visual para reproducir sesiones rrweb (aquí integrado como un componente Svelte instanciado dinámicamente).
- metadata: objeto incluido en la sesión que contiene `customEvents`, `errors`, `startTime`, `totalTime`, etc.

## Licencia
- **TODO: agregar licencia**

---

Si necesitas que incluya diagramas más detallados, ejemplos de payloads (ej. estructura de `metadata.customEvents`) o un guía de despliegue en Vercel/Docker, dime cuál prefieres y lo añado en la siguiente iteración.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
