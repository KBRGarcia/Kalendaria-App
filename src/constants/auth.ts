export const authMessages = {
  invalidCredentials: 'Correo o contraseña incorrectos.',
  emailNotConfirmed:
    'Esta cuenta no está confirmada. En Supabase desactiva Confirm email y confirma o borra el usuario en Authentication → Users.',
  confirmationStillRequired:
    'Supabase sigue pidiendo confirmación por correo. Desactiva Confirm email. Si la cuenta ya se creó, confírmala o bórrala en Authentication → Users.',
  duplicateEmail: 'Ese correo ya tiene una cuenta.',
  rateLimit: 'Has pedido demasiados intentos. Espera un momento e inténtalo de nuevo.',
  offline: 'Sin conexión. Revisa tu internet.',
  generic: 'No se pudo completar la acción. Inténtalo de nuevo.',
  missingFields: 'Introduce tu correo y tu contraseña.',
  invalidEmail: 'Introduce un correo válido.',
  weakPassword: 'La contraseña debe tener al menos 8 caracteres, una letra y un número.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  incompleteSignUp: 'Completa correo, contraseña y confirmación.',
} as const;
