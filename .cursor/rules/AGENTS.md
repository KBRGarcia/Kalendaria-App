# AGENTS.md — Reglas del Proyecto Kalendaria

> **Propósito:** Este archivo es la fuente de verdad para cualquier agente de IA (Cursor, Claude Code, etc.) que trabaje en Kalendaria. Léelo completo antes de generar, modificar o eliminar código.
>
> **Stack:** Expo SDK 58, React Native 0.88, React 19.3.0, Expo Router, TypeScript 6 estricto, Zustand, Supabase (Auth + PostgreSQL + RLS), AsyncStorage y SecureStore para la sesión. Node.js 22.x (mínimo 22.13).
>
> **Documentos de referencia obligatoria:** `docs/01-PRD.md`, `docs/02-TRD.md`, `docs/04-UIUX-Brief.md`, `docs/05-Backend-Schema.md`, `docs/06-Implementation-Plan.md`.

---

## 0. Reglas Generales (siempre aplican)

Estas reglas son la base de cualquier contribución. No son opcionales.

- **R0.1 — Buenas prácticas.** Aplica principios reconocidos de ingeniería de software (SOLID, DRY, KISS, YAGNI) en cada decisión. Si una solución rápida compromete la mantenibilidad, recházala y propone la alternativa correcta.
- **R0.2 — Código limpio.** Prioriza la legibilidad sobre la brevedad. Nombra variables y funciones de forma descriptiva. Evita comentarios que expliquen *qué* hace el código; usa comentarios solo para explicar *por qué* se tomó una decisión no obvia. Mantén funciones cortas (idealmente < 30 líneas, máximo 50)[reference:1].
- **R0.3 — Archivos ordenados.** Respeta estrictamente la estructura de carpetas definida en `02-TRD.md` (sección 3.1) y `06-Implementation-Plan.md` (Fase 0). No crees archivos fuera de las carpetas designadas. Si necesitas una nueva carpeta, justifícala y actualiza la documentación.
- **R0.4 — Optimización.** Escribe código eficiente por defecto: evita re-renders innecesarios (usa `React.memo`, `useMemo`, `useCallback` cuando corresponda), no hagas fetch duplicados, y usa listas virtualizadas (`FlatList`) para conjuntos grandes. No optimices prematuramente, pero no introduzcas ineficiencias obvias.
- **R0.5 — Vanguardia.** El proyecto está en Expo SDK 58, React Native 0.88, React 19.3.0 y TypeScript 6. No bajes a SDK 54 ni subas React a 19.3.1. No uses APIs deprecadas. Si una librería del stack tiene una alternativa moderna oficial, úsala.
- **R0.6 — Documentación oficial.** Antes de implementar algo que no domines, consulta la documentación oficial de Expo, React Native, Supabase o TypeScript. No inventes APIs ni importes helpers que no existan. Si no estás seguro, pregunta al usuario en lugar de asumir[reference:2].

---

## 1. TypeScript

- **R1.1 — `strict: true` siempre.** No desactives `strict` ni `noImplicitAny` en `tsconfig.json`. Todo el código debe compilar sin errores de TypeScript.
- **R1.2 — Sin `any`.** Usa `unknown` cuando el tipo no se conozca y refínalo con type guards. Si una librería externa devuelve `any`, envuélvela en un tipo propio.
- **R1.3 — `interface` para formas de objeto, `type` para uniones.** Sigue la convención del proyecto: `interface Activity { ... }`, `type ActivityCategory = 'reunion' | 'pendiente' | ...`[reference:3].
- **R1.4 — Sin `enum`.** Usa objetos `const` con `as const` o uniones literales. Ejemplo: `const CATEGORIES = { REUNION: 'reunion', ... } as const`[reference:4].
- **R1.5 — Sin `default export` en componentes.** Usa siempre `export function ComponentName()` o `export const ComponentName = ...`. La única excepción son las rutas de Expo Router, que por convención usan default export[reference:5].
- **R1.6 — Tipos explícitos en parámetros y retornos públicos.** No dejes que TypeScript infiera tipos en funciones exportadas o en APIs públicas del proyecto.

---

## 2. Expo Router y Estructura de Carpetas

- **R2.1 — `src/app` es solo para rutas.** Cada archivo dentro de `src/app` (excepto `_layout.tsx`) es una ruta. No coloques lógica de negocio, componentes reutilizables ni utilidades dentro de `src/app`[reference:6].
- **R2.2 — Rutas delgadas.** Los archivos de ruta deben ser *pass-throughs* mínimos: importan un componente de feature y lo renderizan. La lógica compleja vive en `src/components/` o en hooks[reference:7].
- **R2.3 — `_layout.tsx` raíz obligatorio.** Debe existir `src/app/_layout.tsx`. Ahí van providers globales (tema, auth), carga de fuentes y lógica de splash screen[reference:8].
- **R2.4 — Usa `src/` como raíz de código.** Separa el código de la app (`src/`) de los archivos de configuración (`app.json`, `eas.json`, etc.)[reference:9].
- **R2.5 — Nombres de ruta en kebab-case o snake_case, consistentes.** Para archivos de ruta usa `[param].tsx` o nombres descriptivos. Para componentes reutilizables, usa `PascalCase.tsx` (convención del proyecto, según `02-TRD.md`).

---

## 3. React Native y UI

- **R3.1 — Componentes funcionales con hooks.** Nunca uses clases. Usa hooks para estado y efectos secundarios.
- **R3.2 — Sin `useEffect` para fetching de datos.** La obtención de datos se hace a través de los stores de Zustand o de la capa de servicios (`src/services/`). `useEffect` se reserva para suscripciones, cleanup o efectos verdaderamente secundarios[reference:10].
- **R3.3 — Usa el sistema de temas del proyecto.** Nunca hardcodees colores. Usa `useTheme()` y los tokens de `src/theme/`. Ejemplo: `theme.colors.primary`, no `#00A4CC` directo en el componente[reference:11].
- **R3.4 — `StyleSheet.create`.** Define estilos con `StyleSheet.create` en el mismo archivo del componente. No uses estilos inline salvo para valores dinámicos.
- **R3.5 — Memoización selectiva.** Aplica `React.memo` a componentes de lista (`DayCell`, `ActivityCard`) y `useMemo`/`useCallback` cuando un cálculo o callback se pase como prop a un componente memoizado.
- **R3.6 — `FlatList` para listas.** Nunca uses `ScrollView` con `.map()` para listas de datos. Usa `FlatList` o `FlashList` (si se añade después) para virtualización.
- **R3.7 — Safe areas.** Usa `react-native-safe-area-context` (`SafeAreaView` o `useSafeAreaInsets`) en todas las pantallas. No asumas que el notch o el home indicator no existen.
- **R3.8 — Iconos.** El set previsto es Ionicons. No instales `@expo/vector-icons`: la guía oficial de Expo lo marca como deprecado. Antes de la primera pantalla con iconos, confirma el paquete con el usuario. No añadas otra librería de iconos por tu cuenta.

---

## 4. Supabase y Backend

- **R4.1 — Usa el SDK oficial.** Toda interacción con la base de datos pasa por `@supabase/supabase-js`. No construyas URLs manualmente ni uses `fetch` directo a la API de Supabase[reference:12].
- **R4.2 — Tipos generados, no escritos a mano.** Los tipos de las tablas se generan con `npx supabase gen types` en `src/types/database.ts`. Nunca edites ese archivo manualmente ni escribas interfaces duplicadas. Usa `Tables<'activities'>` y `Tables<'profiles'>` donde sea necesario[reference:13][reference:14].
- **R4.3 — RLS siempre activo.** No crees políticas que permitan acceso a datos de otros usuarios. Cualquier nueva tabla debe tener RLS habilitado y políticas explícitas (SELECT, INSERT, UPDATE, DELETE).
- **R4.4 — Sin `service_role` en el cliente.** La `anon key` es la única que se usa en la app. La `service_role` key solo existe en el servidor (nunca en `EXPO_PUBLIC_*`).
- **R4.5 — Consultas específicas.** Selecciona solo las columnas necesarias (`.select('id, title, category, date')`) en lugar de `*` cuando no necesites todos los campos. Usa `.single()` cuando esperes un solo resultado.
- **R4.6 — Manejo de errores explícito.** Cada llamada a Supabase debe comprobar `error` y lanzar una excepción o manejarlo. No ignores errores silenciosamente.

---

## 5. Estado (Zustand) y Persistencia

- **R5.1 — Un store por dominio.** Usa `authStore`, `activitiesStore`, `themeStore`. No crees un store monolítico.
- **R5.2 — Acciones atómicas.** Cada acción del store debe hacer una cosa (fetch, crear, actualizar, eliminar) y actualizar el estado de forma inmutable.
- **R5.3 — Persistencia explícita.** Usa `zustand/middleware` con `AsyncStorage` solo para estado que deba sobrevivir al cierre de la app (`themeStore`). Los datos de actividades se cachean por separado en `cache.ts`.
- **R5.4 — Sin lógica de negocio en los componentes.** Los componentes llaman a hooks que llaman a stores; la lógica de validación y transformación vive en la capa de servicios o en los stores.

---

## 6. Manejo de Errores y Validación

- **R6.1 — Valida en cliente y en servidor.** El formulario valida localmente (título no vacío, longitud, categoría permitida) y el backend valida con `CHECK` constraints. Nunca confíes solo en una capa.
- **R6.2 — Mensajes de error claros para el usuario.** Los errores de auth son genéricos (“Correo o contraseña incorrectos”). Los errores de red dicen “Sin conexión. Revisa tu internet”. Los errores internos se loguean en consola (solo en dev) y muestran un mensaje neutro.
- **R6.3 — Error Boundary global.** `src/app/_layout.tsx` debe envolver la app en un Error Boundary que capture errores de render y muestre una pantalla de fallback amigable.
- **R6.4 — Sin `console.log` en producción.** Usa un logger condicional (`if (__DEV__) console.log(...)`) o elimina los logs antes del build.

---

## 7. Rendimiento

- **R7.1 — Evita renders innecesarios.** Usa `React.memo`, `useMemo`, `useCallback` solo donde aporten valor medible. No memorices todo por defecto.
- **R7.2 — Caché de consultas.** No vuelvas a hacer fetch de un mes si ya está en el store y no ha pasado el tiempo de invalidación (ver `05-Backend-Schema.md`, sección 8).
- **R7.3 — Listas virtualizadas.** Usa `FlatList` con `keyExtractor` estable y `getItemLayout` cuando los ítems tengan altura fija.
- **R7.4 — Imágenes optimizadas.** Usa formatos modernos (WebP) y dimensiones adecuadas. Evita imágenes de más de 200 KB en el bundle.

---

## 8. Seguridad

- **R8.1 — Secretos fuera del código.** Ninguna clave, token o contraseña se hardcodea. Las variables de entorno se leen de `.env.local` y se acceden con `process.env.EXPO_PUBLIC_*` solo para valores públicos.
- **R8.2 — Tokens en SecureStore.** La sesión de Supabase se guarda con `expo-secure-store`, nunca en AsyncStorage plano.
- **R8.3 — No expongas datos de otros usuarios.** RLS es la última línea de defensa, pero el cliente tampoco debe intentar consultar datos ajenos.

---

## 9. Accesibilidad

- **R9.1 — `accessibilityLabel` en botones de icono.** Todo botón que no tenga texto visible debe tener una etiqueta descriptiva (“Crear nueva actividad”, “Volver al calendario”).
- **R9.2 — Tamaños de toque mínimos.** Todos los elementos interactivos deben tener al menos 44x44 pt.
- **R9.3 — Contraste.** Los colores de texto deben cumplir ratio ≥ 4.5:1 sobre su fondo en ambos temas. Usa las combinaciones definidas en `04-UIUX-Brief.md`.

---

## 10. Convenciones de Commits y Documentación

- **R10.1 — Conventional Commits.** Usa `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:` con un mensaje en inglés o español, pero consistente. Ejemplo: `feat(calendar): add month navigation`.
- **R10.2 — Commits atómicos.** Un commit = un cambio lógico. No mezcles refactors masivos con features en el mismo commit.
- **R10.3 — Documenta decisiones no obvias.** Si tomas una decisión técnica que no está en los docs, actualiza el documento correspondiente (`02-TRD.md` o `05-Backend-Schema.md`) en el mismo PR/commit.

---

## 11. Flujo de Trabajo con el Agente

- **R11.1 — Lee los docs antes de codificar.** Antes de implementar una funcionalidad, consulta el documento relevante (`01-PRD.md`, `04-UIUX-Brief.md`, etc.) y cita la sección que estás siguiendo.
- **R11.2 — Pregunta antes de asumir.** Si una decisión no está cubierta por los documentos, pregunta al usuario en lugar de inventar. Especialmente en diseño visual, nombres de campos y flujos de navegación.
- **R11.3 — No avances de fase sin validar.** Sigue el `06-Implementation-Plan.md` en orden. No empieces la Fase 4 si la Fase 3 no está completa y probada.
- **R11.4 — Verifica antes de entregar.** Antes de decir que una tarea está lista, comprueba que compila (`npx tsc --noEmit`), que no hay warnings en consola y que los criterios de “Done” de la fase se cumplen.

---

## 12. Reglas de Formato para Archivos `.mdc` (opcional)

Si decides dividir estas reglas en archivos `.mdc` dentro de `.cursor/rules/`, usa este frontmatter como plantilla:

```yaml
---
description: "Reglas generales de TypeScript para Kalendaria"
alwaysApply: true
---