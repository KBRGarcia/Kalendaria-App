export const OTP_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 30;
export const TRUSTED_LOGIN_MS = 30 * 24 * 60 * 60 * 1000;

export const authMessages = {
  invalidCredentials: 'Correo o contraseña incorrectos.',
  emailNotConfirmed: 'Confirma tu correo antes de iniciar sesión.',
  duplicateEmail: 'Ese correo ya tiene una cuenta.',
  invalidOtp: 'El código no es válido o ha caducado.',
  rateLimit: 'Has pedido demasiados códigos. Espera un momento e inténtalo de nuevo.',
  offline: 'Sin conexión. Revisa tu internet.',
  generic: 'No se pudo completar la acción. Inténtalo de nuevo.',
  missingFields: 'Introduce tu correo y tu contraseña.',
  invalidEmail: 'Introduce un correo válido.',
  weakPassword: 'La contraseña debe tener al menos 8 caracteres, una letra y un número.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  incompleteSignUp: 'Completa correo, contraseña y confirmación.',
  incompleteOtp: 'Introduce el código de 6 dígitos.',
} as const;
