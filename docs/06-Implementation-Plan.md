
## FASE 0 — Setup del Proyecto

### Objetivo

Tener un proyecto de Expo Router + TypeScript funcionando en blanco, con la estructura de carpetas y todas las dependencias instaladas.

### Entregable

- Proyecto Expo ejecutándose en Expo Go.
- `tsconfig.json` con alias de paths.
- Dependencias del TRD instaladas.
- Estructura de carpetas creada (aunque vacía).

### Tareas

1. **Crear el proyecto:**
   ```bash
   npx create-expo-app@latest calendaria --template blank-typescript
   cd calendaria
   

2. Instalar Expo Router y dependencias de navegación:
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

3. Instalar el resto de dependencias:
npx expo install @supabase/supabase-js react-native-url-polyfill expo-secure-store
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/netinfo
npx expo install expo-haptics expo-splash-screen
npx expo install react-native-gesture-handler react-native-reanimated
npx expo install @expo-google-fonts/inter
npm install zustand date-fns

4. Configurar app.json:
- name: "Calendaria"
- slug: "calendaria"
- scheme: "calendaria"
- Añadir plugins: expo-router, expo-secure-store, expo-splash-screen.
- Establecer userInterfaceStyle: "automatic".

5. Configurar package.json:
- "main": "expo-router/entry".

6. Configurar tsconfig.json:
- "strict": true.
- Alias:

"paths": {
  "@/*": ["./src/*"],
  "@components/*": ["./src/components/*"],
  "@hooks/*": ["./src/hooks/*"],
  "@store/*": ["./src/store/*"],
  "@services/*": ["./src/services/*"],
  "@theme/*": ["./src/theme/*"],
  "@lib/*": ["./src/lib/*"],
  "@types/*": ["./src/types/*"]
}

7. Crear estructura de carpetas:
app/(auth)/, app/(app)/, src/components/ui/, src/components/calendar/,
src/components/activity/, src/constants/, src/hooks/, src/lib/,
src/services/, src/store/, src/theme/, src/types/

8. Crear archivos placeholder:
- app/_layout.tsx (root layout).
- app/index.tsx (redirect a /login).
- src/lib/supabase.ts (cliente Supabase).

9. Crear .env.local:
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
(Se llenan en la Fase 1.)

10. Añadir .env.local a .gitignore.

11. Commit:
chore(setup): initial project scaffolding with Expo Router + TS

### Criterio de "Done"

- npx expo start abre el proyecto sin errores.
- Se ve una pantalla en blanco en Expo Go.
- No hay warnings de TypeScript.
- La estructura de carpetas está creada.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 1 — Configuración de Supabase

## Objetivo
Tener el backend funcional: proyecto en Supabase, tablas creadas, RLS activo, y cliente conectado desde la app.

## Entregable
- Proyecto Supabase con tablas profiles y activities.
- RLS activo con todas las políticas.
- Funciones RPC update_last_login y trigger handle_new_user.
- Cliente Supabase configurado en src/lib/supabase.ts.

## Tareas
1. Crear proyecto en supabase.com.
- Región cercana al usuario.
- Guardar URL y anon key.

2. Ejecutar migraciones (según 05-Backend-Schema.md, sección 9):
- 001_create_profiles.sql
- 002_create_activities.sql
- 003_set_updated_at_function.sql
- 004_enable_rls.sql
- 005_update_last_login_function.sql

3. Configurar Auth:
- Email provider activo.
- Confirm email activado.
- OTP expiry: 600 segundos.
- OTP length: 6.
- Personalizar template del email con branding "Calendaria".

4. Generar tipos TypeScript:
npx supabase gen types typescript --project-id <id> > src/types/database.ts

5. Configurar cliente Supabase (src/lib/supabase.ts):
- Adaptador de SecureStore.
- autoRefreshToken: true, persistSession: true.

6. Rellenar .env.local con URL y anon key.

7. Probar la conexión con un script temporal:
const { data, error } = await supabase.from('activities').select('*');
console.log({ data, error }); // Esperado: data: [], error: null

8. Commit:
feat(backend): configure Supabase client and schema

## Criterio de "Done"
- Las tablas existen en Supabase.
- El test de conexión devuelve [] sin error.
- Los tipos TS están generados.
- Desde un cliente REST (Postman/Insomnia) no se puede acceder sin token (RLS bloquea).

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 2 — Sistema de Temas y Design Tokens

## Objetivo
Tener todo el sistema visual (colores, tipografía, espaciado, sombras) implementado como módulos TypeScript reutilizables, con soporte de tema claro/oscuro.

## Entregable
- src/theme/colors.ts con lightTheme y darkTheme.
- src/theme/typography.ts con la escala tipográfica.
- src/theme/spacing.ts, src/theme/shadows.ts.
- src/theme/ThemeProvider.tsx y hook useTheme().
- src/store/themeStore.ts con persistencia en AsyncStorage.
- Fuente Inter cargada en el root layout.

## Tareas
1. Implementar colors.ts según 04-UIUX-Brief.md sección 2.
2. Implementar typography.ts según sección 3.4.
3. Implementar spacing.ts con la escala base 4px.
4. Implementar shadows.ts con sombras para light y nulas para dark.
5. Implementar themeStore.ts:
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  preference: 'light' | 'dark' | 'system';
  setPreference: (p: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: '@calendaria:theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

6. Implementar ThemeProvider.tsx:
- Hook useColorScheme() de RN.
- Resolver tema activo según preference del store.
- Contexto con el objeto de tema.

7. Implementar useTheme() que consume el contexto.
8. Cargar fuente Inter en app/_layout.tsx con useFonts.
9. Probar: cambiar el store manualmente y verificar que el tema reacciona (aunque no haya UI todavía, loguear el tema activo).
10. Commit:
feat(theme): add design system with light/dark themes

## Criterio de "Done"
- useTheme() devuelve el objeto correcto en ambas variantes.
- La preferencia persiste entre recargas.
- La fuente Inter se carga sin errores.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 3 — Autenticación (Registro, Login, OTP)

## Objetivo
Flujo completo de autenticación funcional: registro con OTP, login con regla de 30 días, cierre de sesión, guard de rutas protegidas.

## Entregable
- Pantallas: login.tsx, register.tsx, verify.tsx.
- authStore con Zustand.
- authService con todas las operaciones.
- Guard en app/(app)/_layout.tsx que redirige a login si no hay sesión.
- Redirect automático en app/index.tsx según estado de sesión.

## Tareas
1. Implementar authService.ts:
- signUp(email, password)
- signIn(email, password) → devuelve { requiresOtp: boolean }
- verifyOtp(email, token, mode)
- signOut()
- getLastLogin()
- updateLastLogin()
- getSession()
- onAuthStateChange() (suscripción)

2. Implementar authStore.ts:
- Estado: user, session, isLoading, isInitialized.
- Acciones que llaman al servicio y actualizan el estado.
- Inicialización al montar el root layout.

3. Crear componentes UI base (reutilizables):
- Button (variantes: primary, secondary, text, destructive).
- Input (con label, icono, estado error).
- OtpInput (6 cajas auto-avance).
- Loading (spinner centrado).

4. Implementar app/(auth)/_layout.tsx:
- Stack con header oculto.

5. Implementar app/(auth)/login.tsx según 04-UIUX-Brief.md sección 7.2.
6. Implementar app/(auth)/register.tsx según sección 7.3.
7. Implementar app/(auth)/verify.tsx según sección 7.4.
- Acepta params email y mode (signup | login).

8. Implementar app/(app)/_layout.tsx:
- Guard: si no hay sesión → <Redirect href="/(auth)/login" />.

9. Implementar app/index.tsx:
- Si hay sesión → redirect a /(app)/calendar.
- Si no → redirect a /(auth)/login.

10. Implementar la lógica de los 30 días en login.tsx:
- Consultar last_login_at antes de decidir el flujo.

11. Probar los flujos completos:
- Registro nuevo → recibe email → verifica → entra.
- Login con last_login < 30 días → entra directo.
- Login con last_login >= 30 días → pide OTP.
- Logout → vuelve a login.
- Cerrar y abrir la app → mantiene sesión.

12. Commit:
feat(auth): implement signup, login, OTP verification, and session management

## Criterio de "Done"
- Todos los flujos funcionan end-to-end.
- Los errores se muestran correctamente (email duplicado, código inválido, credenciales incorrectas).
- La sesión persiste tras cerrar la app.
- El guard de rutas funciona.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 4 — Vista de Calendario Mensual

## Objetivo
Pantalla principal con un grid de calendario mensual que muestre indicadores de categorías en los días con actividades.

## Entregable
- app/(app)/calendar.tsx funcional.
- Componentes: MonthNavigator, WeekdayHeader, MonthGrid, DayCell, CategoryDots.
- activitiesStore.fetchMonth() implementado.
- activitiesService.fetchByMonth() implementado.

## Tareas
1. Implementar activitiesService.fetchByMonth() (según 05-Backend-Schema.md sección 7.1).
2. Implementar activitiesStore.ts:
- Estado: activitiesByDate: Record<string, Activity[]>, isLoading, error.
- fetchMonth(year, month) → llama al servicio, agrupa por fecha.
- Selector getActivitiesForDate(date).

3. Crear MonthNavigator:
- Fila con chevron-back, título "Octubre 2026", chevron-forward.
- Callbacks onPrev, onNext.

4. Crear WeekdayHeader:
- Fila con 7 columnas: L M X J V S D.

5. Crear MonthGrid:
- 6 filas x 7 columnas (42 celdas).
- Genera fechas con date-fns (eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth).
- Pasa a cada celda: fecha, actividades, esDelMes, esHoy, estáSeleccionado.

6. Crear DayCell (memoizado):
- Número del día.
- Hasta 3 CategoryDots debajo.
- Estilos según estado (hoy, fuera de mes, seleccionado).

7. Crear CategoryDots:
- Hasta 3 puntos de 6px con colores de categoría.
- Si hay más de 3, mostrar +N.

8. Implementar calendar.tsx:
- Estado local: currentMonth (Date).
- Header con título + botón de ajustes.
- MonthNavigator + WeekdayHeader + MonthGrid.
- Al montar: fetchMonth(currentMonth.year, currentMonth.month).
- Al cambiar de mes: refetch.
- Al tocar un día: router.push('/day/YYYY-MM-DD').

9. Añadir gestos de swipe (opcional, con react-native-gesture-handler).
10. Commit:
feat(calendar): implement monthly calendar view with category indicators

## Criterio de "Done"
- Se ve el mes actual al abrir la app.
- Los días con actividades muestran dots de color.
- Se puede navegar entre meses.
- Tocar un día navega al detalle (aunque la pantalla esté vacía aún).

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 5 — Vista de Detalle del Día

## Objetivo
Pantalla que muestra todas las actividades de un día concreto, con estado vacío y FAB para crear.

## Entregable
- app/(app)/day/[date].tsx funcional.
- Componente ActivityCard.
- Componente EmptyState.

## Tareas
1. Crear ActivityCard:
- Barra vertical de color a la izquierda.
- Título, nota (máx 2 líneas), badge de categoría.
- onPress → navegar a editar.
- Según 04-UIUX-Brief.md sección 5.3.

2. Crear EmptyState:
- Icono, título, descripción.
- Props configurables.

3. Implementar day/[date].tsx:
- Leer date del param de ruta.
- Formatear: "Martes, 14 de octubre" (con date-fns, locale es).
- Obtener actividades del store (getActivitiesForDate(date)).
- Renderizar FlatList de ActivityCard.
- Si vacío → EmptyState.
- FAB en bottom-right → router.push('/activity/new?date=YYYY-MM-DD').

4. Commit:
feat(day): add day detail view with activity list

## Criterio de "Done"
- La pantalla muestra las actividades del día (si las hay en el store).
- El estado vacío se muestra cuando no hay actividades.
- El FAB navega al formulario de creación (aunque esté vacío aún).

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 6 — CRUD de Actividades

## Objetivo
Flujo completo de crear, editar y eliminar actividades.

## Entregable
- app/(app)/activity/new.tsx y app/(app)/activity/[id].tsx.
- Componentes ActivityForm, CategoryPicker, ConfirmDialog.
- Acciones del store: createActivity, updateActivity, deleteActivity.

## Tareas
1. Implementar activitiesService.create, .update, .remove (según 05-Backend-Schema.md secciones 7.2-7.4).

2. Extender activitiesStore con:
- createActivity(input) → tras éxito, actualiza activitiesByDate del día afectado.
- updateActivity(id, input) → tras éxito, actualiza el array.
- deleteActivity(id) → tras éxito, remueve del array.

3. Crear CategoryPicker:
- Fila horizontal scrollable de pills.
- Estado seleccionado visual (fondo color + texto blanco).

4. Crear ActivityForm:
- Input título (obligatorio, máx 100).
- CategoryPicker.
- Input nota (multiline, máx 500).
- Botón "Guardar".
- Botón "Eliminar" (solo en modo edición).
- Validación local antes de submit.

5. Crear ConfirmDialog:
- Modal con "Cancelar" y "Eliminar".

6. Implementar activity/new.tsx:
- Recibe date como query param.
- Muestra ActivityForm como bottom sheet.
- Al guardar → createActivity → router.back().

7. Implementar activity/[id].tsx:
- Recibe id de la actividad.
- Carga la actividad del store.
- ActivityForm precargado.
- Al guardar → updateActivity → router.back().
- Al eliminar → ConfirmDialog → deleteActivity → router.back().

8. Añadir feedback háptico con expo-haptics al guardar/eliminar.
9. Probar el ciclo completo:
- Crear actividad → aparece en el día.
- Editar → cambio reflejado en la lista y el calendario.
- Eliminar → desaparece.
- Confirmar que los dots del calendario se actualizan.

10. Commit:
feat(activity): implement full CRUD with category picker and delete confirmation

## Criterio de "Done"
- Se puede crear, editar y eliminar desde la UI.
- Los cambios se reflejan en el calendario y en el detalle del día.
- Los datos persisten tras cerrar y abrir la app.
- Validación funciona (no se guarda sin título).

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 7 — Ajustes y Cierre de Sesión

## Objetivo
Pantalla de ajustes con toggle de tema, info de cuenta y logout.

## Entregable
- app/(app)/settings.tsx funcional.
- Componente SegmentedControl.

## Tareas
1. Crear SegmentedControl:
- 3 opciones (Claro / Oscuro / Sistema).
- Estado activo visual.

2. Implementar settings.tsx:
- Sección "Apariencia": SegmentedControl conectado a themeStore.
- Al cambiar → también actualizar profiles.theme_preference en Supabase (authService.updateThemePreference).
- Sección "Cuenta": email + botón "Cerrar sesión".
- Sección "Acerca de": versión.
- Confirmación de logout con ConfirmDialog (opcional).

3. Conectar el botón de ajustes del calendar.tsx para navegar a /settings.
4. Commit:
feat(settings): add theme toggle and logout

## Criterio de "Done"
- El toggle de tema cambia la app inmediatamente.
- La preferencia persiste.
- El logout limpia la sesión y redirige a login.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 8 — Caché Local y Modo Offline

## Objetivo
Permitir consultar actividades sin conexión y manejar errores de red correctamente.

## Entregable
- src/lib/cache.ts implementado.
- activitiesStore con fallback a caché.
- Detección de conexión con NetInfo.
- Deshabilitar escritura sin conexión.

## Tareas
1. Implementar cache.ts:
- saveMonthToCache(year, month, activities).
- loadMonthFromCache(year, month): Activity[] | null.
- clearAllCache().
- Clave: @calendaria:cache:activities:YYYY-MM.

2. Modificar activitiesStore.fetchMonth:
- Intentar fetch desde Supabase.
- Si falla y hay caché → usar caché + setear error: 'offline'.
- Si éxito → guardar en caché.

3. Añadir hook useNetworkStatus() basado en NetInfo.
4. Modificar ActivityForm:
- Si !isOnline, deshabilitar botón Guardar con mensaje "Sin conexión".
- Mostrar toast/banner.

5. Al hacer logout → clearAllCache().
6. Al hacer login nuevo → clearAllCache().
7. Probar:
- Activar modo avión → abrir app → ver actividades en caché.
- Intentar crear → se bloquea con mensaje.
- Desactivar modo avión → recargar → datos frescos.

8. Commit:
feat(offline): add local cache for read-only offline mode

## Criterio de "Done"
- Sin conexión, se ven las actividades previamente cargadas.
- Sin conexión, no se puede escribir (mensaje claro).
- Al volver la conexión, los datos se refrescan.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 9 — Pulido, Accesibilidad y QA

## Objetivo
Revisar toda la app contra el checklist de diseño y accesibilidad, corregir detalles y dejar la app lista para build.

## Entregable
- App pulida visual y funcionalmente.
- Sin warnings de TypeScript.
- Sin errores en consola.

## Tareas
1. Revisar checklist de 04-UIUX-Brief.md sección 13 en cada pantalla.
2. Añadir accessibilityLabel a todos los botones de icono.
3. Verificar contrastes en ambos temas (usar herramienta de contraste).
4. Verificar safe areas en dispositivos con notch (iPhone 14+, Pixel 7+).
5. Probar en Android y iOS.
6. Probar estados de error:
- Email ya registrado.
- Contraseña débil.
- Código OTP incorrecto o expirado.
- Sin conexión.
- Sesión expirada.

7. Añadir animaciones sutiles (opcional):
- Fade-in del grid al cargar.
- Spring en el FAB.
- Feedback táctil en botones.

8. Optimizar rendimiento:
- Verificar React.memo en DayCell.
- Verificar useMemo para agrupar actividades.
- Verificar que FlatList no re-renderiza innecesariamente.

9. Añadir Error Boundary global en app/_layout.tsx.
10. Revisar todos los textos en español (sin typos).
11. Commit:
chore(polish): accessibility, animations, and QA pass

## Criterio de "Done"
- No hay warnings de TS.
- No hay errores en consola.
- Todos los flujos funcionan en ambas plataformas.
- Checklist de diseño al 100%.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# FASE 10 — Build de Producción (EAS)

## Objetivo
Generar binarios de producción (APK/AAB para Android, IPA para iOS).

## Entregable
- APK/AAB funcional.
- Cuenta de Expo configurada con EAS.

## Tareas
1. Instalar EAS CLI global:
npm install -g eas-cli

2. Login:
eas login

3. Configurar proyecto:
eas build:configure

4. Crear eas.json:
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "android": { "buildType": "apk" } },
    "production": { "android": { "buildType": "app-bundle" } }
  }
}

5. Configurar variables de entorno en EAS (URL y anon key de Supabase).
6. Configurar app icon y splash definitivos.
7. Ejecutar build de preview:
eas build --platform android --profile preview

8. Probar el APK en un dispositivo real.
9. Ejecutar build de producción (cuando todo esté validado).
10. Commit:
chore(build): configure EAS and generate preview build

## Criterio de "Done"
- El APK se instala y funciona.
- La app se conecta correctamente a Supabase en producción.
- El splash screen y el icono se ven bien.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# Dependencias Entre Fases

Fase 0 ────► Fase 1 ────► Fase 3 ────► Fase 4 ────► Fase 5 ────► Fase 6 ────► Fase 8 ────► Fase 9 ────► Fase 10
                │                          │                          │
                └───► Fase 2 ──────────────┘                          │
                                                                       │
                Fase 7 (después de Fase 3) ────────────────────────────┘

- Fase 2 (temas) puede ejecutarse en paralelo con Fase 1.
- Fase 7 (ajustes) requiere que la Fase 3 esté completa.
- Fase 8 (caché) requiere Fases 4 y 6.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# Estándares de Código
Aplicar en todas las fases:
- TypeScript estricto. Sin any salvo justificación.
- Componentes funcionales con hooks.
- Nombrado: PascalCase para componentes, camelCase para funciones/variables.
- Archivos: PascalCase.tsx para componentes, camelCase.ts para utilidades.
- Estilos: StyleSheet.create en el mismo archivo del componente.
- Imports: usar alias (@/*), nunca rutas relativas largas.
- Commits: Conventional Commits.
- Sin console.log en código final (usar un logger condicional en dev).

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# Definition of Done Global

Antes de considerar el MVP terminado:

□ Todos los RF de 01-PRD.md implementados y funcionando.
□ Todos los RNF cumplidos (rendimiento, seguridad, usabilidad, compatibilidad).
□ Todas las pantallas del brief UI/UX implementadas.
□ El esquema del backend está en producción con RLS activo.
□ La app funciona en Android y iOS.
□ La app funciona con y sin conexión (según lo definido).
□ No hay warnings de TypeScript ni errores en consola.
□ El APK/AAB de producción se genera correctamente.
□ La documentación está actualizada.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# Riesgos y Mitigaciones por Fase

Fase   |   Riesgo   |   Mitigación
3   |   Emails de verificación caen en spam   |   Personalizar template + dominio verificado en Supabase
4   |   Rendimiento del grid con muchos renders   |   React.memo en DayCell, useMemo para agrupar
6   |   Race conditions al crear/editar rápido   |   Deshabilitar botón durante la request; optimistic update con rollback
8   |   Caché desactualizada   |   Invalidar caché en cada escritura y logout
10   |   Build de iOS requiere cuenta Apple Developer   |   Iniciar trámite de cuenta si se planea iOS

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# Checklist Final de Entrega

Antes de entregar al cliente:

□ App instalable en Android (APK).
□ App instalable en iOS (si aplica).
□ Documentación de uso básica (opcional).
□ Cuenta de prueba creada para demo.
□ Contacto de soporte para el cliente.
