export const activityMessages = {
  loadFailed: 'No se pudieron cargar las actividades.',
  offline: 'Sin conexión. Revisa tu internet.',
  invalidDate: 'Esa fecha no es válida.',
  emptyTitle: 'No hay actividades para este día',
  emptyDescription: 'Pulsa + para anotar lo que hiciste o lo que tienes pendiente.',
  titleRequired: 'Escribe un título.',
  titleTooLong: 'El título puede tener hasta 100 caracteres.',
  noteTooLong: 'La nota puede tener hasta 500 caracteres.',
  customNameTooLong: 'El nombre de la categoría puede tener hasta 30 caracteres.',
  customColorRequired: 'Elige un color para la categoría.',
  saveFailed: 'No se pudo guardar la actividad.',
  deleteFailed: 'No se pudo eliminar la actividad.',
  missingActivity: 'No se encontró esa actividad.',
  deleteTitle: '¿Eliminar esta actividad?',
  deleteMessage: 'Esta acción no se puede deshacer.',
  discardTitle: '¿Descartar los cambios?',
  discardMessage: 'Se perderá lo que no has guardado.',
} as const;

export function activityCountLabel(count: number): string {
  return count === 1 ? '1 actividad' : `${count} actividades`;
}
