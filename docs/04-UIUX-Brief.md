# UI/UX Design Brief
## Kalendaria — App de Agenda y Calendario Personal

**Versión:** 1.0
**Fecha:** Octubre 2026
**Estado:** Aprobado
**Documentos base:** `01-PRD.md`, `02-TRD.md`

---

## 1. Concepto de Marca

### 1.1. Personalidad

Kalendaria es una app **cálida, tranquila y ordenada**. No es fría ni corporativa; evoca la sensación de sentarse frente al mar con una libreta a mano. Es minimalista pero acogedora. Transmite calma y control sin ser aburrida.

**Atributos de marca:**
- Serena
- Cálida
- Clara
- Cercana
- Profesional sin ser rígida

**Lo que NO es:**
- No es fría (no usa azules corporativos ni grises industriales).
- No es infantil (nada de colores saturados ni formas juguetonas).
- No es ruidosa (nada de animaciones llamativas ni gradientes agresivos).

### 1.2. Principios de diseño

1. **Simplicidad primero.** Cada elemento debe justificar su existencia.
2. **Calma visual.** Espacios en blanco generosos, sin ruido.
3. **Jerarquía clara.** El usuario siempre sabe dónde está y qué puede hacer.
4. **Color con propósito.** El color se usa para categorizar, no para decorar.
5. **Consistencia.** Los patrones se repiten; el usuario aprende una vez.

---

## 2. Paleta de Colores

### 2.1. Colores base (paleta del cliente)

| Nombre | Hex | RGB | Rol principal |
|---|---|---|---|
| **Coral** | `#E8723E` | (232, 114, 62) | Acento fuerte, alertas, categoría "Pendiente" |
| **Durazno** | `#F7A769` | (247, 167, 105) | Acento suave, categoría "Trabajo" |
| **Arena** | `#F2ECEA` | (242, 236, 234) | Fondo principal en tema claro |
| **Celeste pastel** | `#A8D1E2` | (168, 209, 226) | Superficies secundarias, bordes, categoría "Personal" |
| **Turquesa** | `#00A4CC` | (0, 164, 204) | **Color primario de marca**, botones, links, categoría "Reunión" |

### 2.2. Colores derivados (necesarios para el sistema)

Se generan a partir de la paleta base para cubrir necesidades de UI (texto, bordes, estados).

| Nombre | Hex | Uso |
|---|---|---|
| **Turquesa oscuro** | `#007A99` | Estado `pressed` del primario |
| **Coral oscuro** | `#C25A2C` | Estado `pressed` del acento |
| **Tinta (texto principal)** | `#1F2A2E` | Texto principal en tema claro |
| **Tinta secundaria** | `#5A6A70` | Texto secundario, placeholders |
| **Gris borde** | `#D9D2CF` | Bordes suaves, divisores |
| **Blanco puro** | `#FFFFFF` | Superficies elevadas (cards) en tema claro |
| **Noche profunda** | `#0E1C22` | Fondo principal en tema oscuro |
| **Noche media** | `#162A32` | Superficies (cards) en tema oscuro |
| **Noche borde** | `#223A44` | Bordes y divisores en tema oscuro |
| **Arena suave (texto en dark)** | `#E6DFDB` | Texto principal en tema oscuro |
| **Arena atenuada** | `#9B938F` | Texto secundario en tema oscuro |
| **Verde salvia** | `#6EAF8C` | Categoría "Personal" |
| **Gris cálido** | `#8C8279` | Categoría "Otro" |

### 2.3. Mapeo semántico — Tema claro

export const lightTheme = {
  // Fondos
  background:        '#F2ECEA',  // Arena
  surface:           '#FFFFFF',  // Blanco puro (cards)
  surfaceSecondary:  '#F8F4F2',  // Superficie sutil

  // Texto
  text:              '#1F2A2E',  // Tinta
  textSecondary:     '#5A6A70',  // Tinta secundaria
  textInverse:       '#FFFFFF',

  // Marca
  primary:           '#00A4CC',  // Turquesa
  primaryPressed:    '#007A99',
  accent:            '#E8723E',  // Coral
  accentPressed:     '#C25A2C',

  // Bordes y divisores
  border:            '#D9D2CF',
  divider:           '#E8E2DF',

  // Estados
  success:           '#6EAF8C',
  error:             '#E8723E',  // Reutiliza coral para errores
  warning:           '#F7A769',
  info:              '#A8D1E2',

  // Sombras
  shadow:            'rgba(31, 42, 46, 0.08)',
};

### 2.4. Mapeo semántico — Tema oscuro

export const darkTheme = {
  // Fondos
  background:        '#0E1C22',  // Noche profunda
  surface:           '#162A32',  // Noche media
  surfaceSecondary:  '#1B333C',

  // Texto
  text:              '#E6DFDB',  // Arena suave
  textSecondary:     '#9B938F',  // Arena atenuada
  textInverse:       '#0E1C22',

  // Marca (se mantiene la identidad)
  primary:           '#00A4CC',
  primaryPressed:    '#33B8DB',
  accent:            '#E8723E',
  accentPressed:     '#F08A5B',

  // Bordes y divisores
  border:            '#223A44',
  divider:           '#1B333C',

  // Estados
  success:           '#6EAF8C',
  error:             '#E8723E',
  warning:           '#F7A769',
  info:              '#A8D1E2',

  // Sombras
  shadow:            'rgba(0, 0, 0, 0.4)',
};

### 2.5. Colores de categorías

Cada categoría tiene un color único que se usa en el indicador del calendario y en la etiqueta de la actividad.

Categoría   |   Color   |   Hex   |   Rationale
Reunión   |   Turquesa   |   #00A4CC   |   Color primario, eventos importantes
Pendiente    |   Coral   |   #E8723E   |   Genera urgencia visual
Trabajo   |   Durazno   |   #F7A769   |   Cálido pero menos urgente que coral
Personal   |   Verde salvia   |   #6EAF8C   |   Fresco y diferenciable del turquesa
Otro   |   Gris cálido   |   #8C8279   |   Neutro, sin protagonismo

Nota: Los colores se mantienen idénticos en ambos temas para que el usuario siempre reconozca la categoría, aunque se ajusta ligeramente la opacidad de las etiquetas en dark mode.

---

## 3. Tipografía
### 3.1. Familia tipográfica
Fuente principal: Inter (vía @expo-google-fonts/inter)
- Moderna, neutra, excelente legibilidad en pantalla.
- Soporta todos los pesos que necesitamos.
- Disponible como paquete de Expo, sin configuración nativa.

Alternativa (fallback): San Francisco (iOS) / Roboto (Android) si la fuente no carga.

### 3.2. Escala tipográfica

Estilo   |   Tamaño   |   Peso   |   Uso
Display   |   32px   |   700 (Bold)   |   Título grande en splash, "Octubre 2026"
H1   |   24px   |   700   |   Título de pantalla principal
H2   |   20px   |   600 (SemiBold)   |   Títulos de sección, "Martes, 14 de octubre"
H3   |   17px   |   600   |   Subtítulos, títulos de card
Body   |   16px   |   400 (Regular)   |   Texto corrido, descripciones
Body Strong   |   16px   |   600   |   Títulos de actividad, énfasis
Caption   |   14px   |   400   |   Notas, texto secundario
Small   |   12px   |   500   |   Etiquetas, badges, días del calendario

### 3.3. Interlineado y tracking
- Line height: 1.4× el tamaño de fuente (ej: Body 16px → line-height 22px).
- Tracking: normal (0); solo títulos grandes con -0.3px para dar solidez visual.

### 3.4. Configuración en el proyecto

export const typography = {
  display:     { fontFamily: 'Inter_700Bold',    fontSize: 32, lineHeight: 38 },
  h1:          { fontFamily: 'Inter_700Bold',    fontSize: 24, lineHeight: 30 },
  h2:          { fontFamily: 'Inter_600SemiBold', fontSize: 20, lineHeight: 26 },
  h3:          { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 22 },
  body:        { fontFamily: 'Inter_400Regular',  fontSize: 16, lineHeight: 22 },
  bodyStrong:  { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22 },
  caption:     { fontFamily: 'Inter_400Regular',  fontSize: 14, lineHeight: 20 },
  small:       { fontFamily: 'Inter_500Medium',   fontSize: 12, lineHeight: 16 },
};

---

## 4. Espaciado y Layout

### 4.1. Sistema de espaciado (base 4px)

Token   |   Valor   |   Uso típico
xs   |   4px   |   Separación mínima entre iconos y texto
sm   |   8px   |   Padding interno de badges, gap entre elementos relacionados
md   |   12px   |   Padding interno de inputs
lg   |   16px   |   Padding de pantalla, gap entre secciones
xl   |   24px   |   Separación entre bloques grandes
2xl   |   32px   |   Márgenes superiores de pantalla
3xl   |   48px   |   Separación de bloques hero

### 4.2. Layout general
- Padding horizontal de pantalla: 16px (lg).
- Padding vertical superior: 24px + safe area.
- Ancho máximo de contenido: no aplica (móvil only).

### 4.3. Border radius
Elemento   |   Radio
Botones   |   12px
Inputs   |   12px
Cards   |   16px
Modales   |   20px (top corners)
Badges / Pills   |   100px (fully rounded)
Avatares   |   Circular
Día del calendario (celda)   |   12px

### 4.4. Sombras y elevación
Tema claro:
export const shadows = {
  sm: { shadowColor: '#1F2A2E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#1F2A2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: '#1F2A2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 6 },
};

Tema oscuro: las sombras se reemplazan por bordes sutiles (border: 1px solid border) para evitar manchas negras sobre fondos oscuros.

---

## 5. Componentes UI

### 5.1. Botones
Botón primario
- Fondo: primary (#00A4CC)
- Texto: #FFFFFF, bodyStrong
- Padding: 16px vertical, 24px horizontal
- Radio: 12px
- Altura mínima: 52px
- Estado pressed: primaryPressed + opacidad 0.9
- Estado disabled: primary con opacidad 0.4, texto con opacidad 0.6

Botón secundario (outline)
- Fondo: transparente
- Borde: 1.5px primary
- Texto: primary, bodyStrong
- Resto igual al primario.

Botón de texto (terciario)
- Fondo: transparente
- Texto: primary, bodyStrong, subrayado en pressed.
- Uso: enlaces, acciones secundarias.

Botón destructivo
- Fondo: error (coral)
- Texto: #FFFFFF
- Uso: solo en confirmación de eliminación.

Botón icono (circular)
- Tamaño: 44x44px
- Radio: circular
- Fondo: surface con sombra sm (o surfaceSecondary en dark).
- Icono: 22px, color text.

FAB (Floating Action Button)
- Tamaño: 56x56px
- Radio: circular
- Fondo: primary
- Icono: + (Ionicons add), 28px, blanco.
- Posición: bottom-right, 16px de margen, sobre safe area.
- Sombra: md.

### 5.2. Inputs
- Altura: 52px
- Fondo: surface (light) / surfaceSecondary (dark)
- Borde: 1px border (en foco: 1.5px primary)
- Radio: 12px
- Padding: 14px horizontal
- Placeholder: textSecondary
- Label flotante o superior: preferimos label superior en caption (textSecondary).
- Estado error: borde error + mensaje debajo en caption color error.

### 5.3. Cards
Card de actividad (en lista del día):
- Fondo: surface
- Radio: 16px
- Padding: 16px
- Sombra: sm (light) / sin sombra + borde border (dark)
- Layout:
-- Barra vertical de color de categoría a la izquierda (ancho 4px, altura completa, radio izquierdo).
-- Contenido: título (bodyStrong) + nota (caption, textSecondary, máx 2 líneas) + badge de categoría.
-- Estado pressed: opacidad 0.85.

Card de sección (agrupador):
- Sin fondo, solo título y contenido.

### 5.4. Badges / Pills
- Padding: 6px vertical, 10px horizontal
- Radio: 100px
- Fondo: color de categoría al 15% de opacidad
- Texto: color de categoría, small, 500
- Uso: mostrar categoría en cards, filtros, etc.

### 5.5. Indicadores del calendario
Dot (punto de categoría):
- Tamaño: 6x6px
- Radio: circular
- Color: color de categoría
- Separación entre dots: 3px
- Máximo visible por día: 3; si hay más, mostrar +N en small.

### 5.6. Modales
- Presentación: bottom sheet (React Native Modal con animación slide-up).
- Radio superior: 20px.
- Fondo: surface.
- Backdrop: rgba(31, 42, 46, 0.4).
- Handle: barra gris de 4x40px centrada en la parte superior.
- Padding interno: 20px.

### 5.7. Diálogos de confirmación
- Presentación: modal centrado (Alert nativo o modal custom).
- Ancho máximo: 320px.
- Botones: "Cancelar" (texto) + "Eliminar" (destructivo).

### 5.8. Estados vacíos
- Icono: Ionicons, 48px, color textSecondary, opacidad 0.5.
- Título: h3, text.
- Descripción: body, textSecondary.
- Uso: "No hay actividades para este día".

---

## 6. Iconografía
- Set: Ionicons (vía @expo/vector-icons).
- Estilo: outline por defecto, filled en estados activos.
- Tamaño estándar: 22px en navegación, 20px en inputs, 24-28px en acciones principales.
- Iconos clave:
-- add / add-circle → crear actividad
-- chevron-back / chevron-forward → navegación entre meses
-- calendar-outline → calendario
-- list-outline → lista
-- settings-outline → ajustes
-- moon-outline / sunny-outline → toggle de tema
-- log-out-outline → cerrar sesión
-- pencil-outline → editar
-- trash-outline → eliminar
-- circle → guardar / confirmar
-- close → cerrar

---

## 7. Pantallas — Especificación Visual

###7.1. Splash Screen
- Fondo: #F2ECEA (light) / #0E1C22 (dark).
- Logo: centrado, 200px de ancho.
- Estado: se oculta al terminar la hidratación de sesión (máx 1.5s).
- Config: plugin expo-splash-screen en app.json.

### 7.2. Login
Layout vertical, centrado:
1. Logo (80px) arriba, centrado, margen superior 80px.
2. Título "Bienvenido a Calendaria" (h1, text).
3. Subtítulo "Tu agenda personal, simple y clara" (body, textSecondary).
4. Espacio xl (24px).
5. Input email con icono mail-outline.
6. Input contraseña con icono lock-closed-outline y toggle de visibilidad (eye-outline / eye-off-outline).
7. Botón primario "Iniciar sesión" (full width).
8. Enlace "¿No tienes cuenta? Regístrate" (bodyStrong, primary), centrado.
Espaciado: padding horizontal lg (16px), gap entre elementos md (12px).

### 7.3. Registro
Layout similar al login:
1. Botón de retroceso arriba a la izquierda (chevron-back).
2. Título "Crear cuenta" (h1).
3. Subtítulo "Solo necesitas un correo y una contraseña" (body, textSecondary).
4. Input email.
5. Input contraseña (con requisitos visibles debajo: mínimo 8 caracteres, una letra y un número, en caption textSecondary).
6. Input confirmar contraseña.
7. Botón primario "Crear cuenta".
8. Enlace "¿Ya tienes cuenta? Inicia sesión".

### 7.4. Verificación por código
1. Botón retroceso.
2. Icono mail-open-outline (48px, primary), centrado.
3. Título "Verifica tu correo" (h1).
4. Subtítulo "Enviamos un código de 6 dígitos a correo@ejemplo.com" (body, textSecondary).
5. Campo OTP de 6 dígitos:
- 6 cajas cuadradas de 48x56px.
- Radio 12px.
- Borde border (en foco: primary).
- Texto h2 centrado.
- Auto-avance al escribir.
6. Botón primario "Verificar".
7. Enlace "Reenviar código" (bodyStrong, primary), deshabilitado 30s con countdown.

### 7.5. Calendario mensual (Home)
Estructura vertical:
1. Header (safe area + 16px):
- Izquierda: Título del mes "Octubre 2026" (h1).
- Derecha: Botón de ajustes (icono settings-outline).
2. Navegador de mes:
- Fila con: chevron-back | "Octubre 2026" (h3) | chevron-forward.
- Opcional: gestos swipe en el grid.
3. Días de la semana (L M X J V S D):
- Fila con 7 columnas, texto small, textSecondary, centrado.
4. Grid del mes (6 filas x 7 columnas):
- Cada celda: 44px de alto, radio 12px.
- Número del día (body, text).
- Si es hoy: fondo primary al 15%, número en primary y bodyStrong.
- Si está seleccionado: fondo primary, número en blanco.
- Debajo del número: dots de categorías (máx 3).
- Padding de la celda: sm (8px).
5. Leyenda de categorías (opcional, colapsable):
- Fila horizontal scrollable con pills de categoría.
6. Espacio inferior: reservado para safe area.
7. Espaciado: padding horizontal lg (16px).

### 7.6. Detalle del día
Estructura vertical:

1. Header:
- Izquierda: chevron-back (volver al calendario).
- Centro: Fecha completa "Martes, 14 de octubre" (h2).
- Derecha: espacio vacío o icono de ajustes.
2. Subtítulo "3 actividades" (caption, textSecondary), padding horizontal 16px.
3. Lista de actividades:
- FlatList con gap de 12px.
- Cada ítem: Card de actividad (ver 5.3).
- Estado vacío si no hay actividades.
4. FAB "+" en bottom-right para crear actividad.

### 7.7. Crear / Editar actividad
Presentación: modal bottom sheet (slide-up).

Contenido:
1. Handle (barra gris).
2. Título del modal: "Nueva actividad" / "Editar actividad" (h2).
3. Fecha (solo lectura, mostrada como texto en caption textSecondary).
4. Input título:
- Label: "Título"
- Placeholder: "Ej: Reunión con el equipo"
- Máx 100 caracteres. Contador a la derecha si se acerca al límite.
5. Selector de categoría:
- Label: "Categoría".
- Fila horizontal scrollable con 5 pills (una por categoría).
- Pill activo: fondo del color de la categoría, texto blanco.
- Pill inactivo: fondo surfaceSecondary, texto text.
6. Input nota (multiline):
- Label: "Nota (opcional)"
- Placeholder: "Añade detalles si lo necesitas"
- Altura mínima 80px, máx 500 caracteres.
7. Fila inferior:
- Si es edición: botón icono trash-outline (color error) a la izquierda.
- Botón primario "Guardar" a la derecha (flex 1).

### 7.8. Ajustes
Estructura vertical:
1. Header: chevron-back + "Ajustes" (h1).
2. Sección "Apariencia":
- Fila con label "Tema" y 3 opciones (Claro / Oscuro / Sistema) como segmented control.
- Segmented control: fondo surfaceSecondary, opción activa con fondo primary + texto blanco, radio 10px.
3. Sección "Cuenta":
- Fila con email del usuario (body, text) y debajo "Sesión iniciada" (caption, textSecondary).
- Botón secundario "Cerrar sesión" (outline, color error).
4. Sección "Acerca de":
- Versión de la app (caption, textSecondary).

---

## 8. Navegación

### 8.1. Patrón
- Sin tab bar. La app usa un stack simple: Calendario → Día → Modal actividad.
- Ajustes se accede desde el icono en el header del calendario.

### 8.2. Transiciones
- Push (Calendario → Día): slide horizontal estándar de iOS / fade + slide de Android.
- Modal (actividad): slide-up (bottom sheet).
- Volver: slide inverso automático.

### 8.3. Gestos
- Swipe horizontal en el grid del calendario: cambiar de mes (habilitado en MVP).
- Swipe down en modal: cerrar (con confirmación si hay cambios sin guardar).

---

## 9. Animaciones y Microinteracciones
- Duración estándar: 200-250ms para transiciones; 150ms para feedback táctil.
- Easing: ease-out para entradas, ease-in para salidas.
- Feedback al tocar botones: escala 0.97 con react-native-reanimated (opcional, sutil).
- Feedback háptico: expo-haptics ligero (impactLight) al:
-- Crear actividad.
-- Eliminar actividad.
-- Cambiar de mes.
- Dots del calendario: fade-in al cargar (200ms).
- FAB: escala de entrada al abrir pantalla (spring suave).

Regla: las animaciones son sutiles y nunca bloquean la interacción.

---

## 10. Accesibilidad
- Contraste:
-- Texto principal sobre background (light): ratio ≥ 12:1 ✓
-- Texto principal sobre background (dark): ratio ≥ 12:1 ✓
-- Texto primary sobre background: ratio ≥ 4.5:1 ✓
- Tamaño de toque mínimo: 44x44pt.
- Soporte de Dynamic Type / fontScale: usar <Text> con allowFontScaling (por defecto true).
- Labels para lectores de pantalla: accessibilityLabel en botones con icono (ej: FAB → "Crear nueva actividad").
- Focus visible: bordes de foco claros en inputs.

---

## 11. Modo Oscuro — Consideraciones específicas
- No usar negro puro (#000000): usamos #0E1C22 (noche profunda) para reducir fatiga visual.
- Elevación por contraste, no por sombra: las cards en dark usan surface más claro que background + borde sutil.
- Imágenes y logos: versión adaptada (logo blanco sobre dark).
- Colores de categorías: idénticos, pero se les añade un borde sutil blanco al 10% para que resalten.
- Transición entre temas: sin animación (cambio instantáneo) para evitar flashes.

---

## 12. Assets

### 12.1. Logo
- Formato: SVG o PNG transparente.
- Tamaño mínimo: 240x240px (para splash).
- Variantes:
-- Logo principal (color o sobre fondo claro).
-- Logo blanco (sobre fondo oscuro).
-- Isotipo (solo símbolo, sin texto).

### 12.2. Splash screen
- Imagen centrada: logo + "Calendaria" debajo.
- Fondo: #F2ECEA (light) / #0E1C22 (dark).

### 12.3. App icon
- Cuadrado 1024x1024px.
- Fondo: #00A4CC (turquesa de marca).
- Símbolo: isotipo blanco centrado.

---

## 13. Checklist de Diseño para el Implementador
Antes de dar por terminada una pantalla, verifica:

□ Se respeta el sistema de espaciado (múltiplos de 4px).
□ Los textos usan la escala tipográfica definida.
□ Los colores provienen de theme (nunca hardcodeados).
□ Funciona correctamente en tema claro y oscuro.
□ Los toques son ≥ 44x44pt.
□ Hay estado de pressed / disabled / loading en elementos interactivos.
□ Se maneja el estado vacío.
□ Se maneja el estado de error.
□ Respeta safe areas (notch, home indicator).
□ Los textos están en español.
□ accessibilityLabel presente en botones de icono.

---

##14. Referencias visuales (moodboard)
- Airbnb → claridad, calidez, jerarquía tipográfica.
- Things 3 → simplicidad, uso del espacio, elegancia.
- Bear app → uso del color en contexto, tema claro/oscuro excepcional.
- Google Calendar (versión minimal) → pero sin la densidad de información.

Contraste con la paleta: tomamos la sensación "playa tranquila" de la paleta del cliente y la aplicamos con la disciplina visual de estas apps.

---

## 15. Notas finales
- La paleta del cliente es el ancla emocional de la app. No añadir colores fuera de los definidos sin justificación.
- El turquesa es el color de marca y debe usarse con moderación (acciones principales, no decoración).
- El coral es el acento y debe reservarse para estados que requieran atención (Pendiente, error, acciones destructivas).
- La calidez del durazno y la arena contrarresta la frialdad del turquesa. El balance entre ambos es la clave del look & feel.

Cualquier decisión visual debe poder justificarse con este documento. Si hay dudas, consultar antes de improvisar.

