const WIDE_BREAKPOINT = 600;

// Meses por fila en la vista anual: tres en teléfonos (vertical) y cuatro en pantallas
// anchas (tabletas o móvil en horizontal), para que cada mes conserve un tamaño legible.
export function yearColumns(width: number): number {
  return width >= WIDE_BREAKPOINT ? 4 : 3;
}
