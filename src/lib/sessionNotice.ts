let sessionNotice: string | null = null;

export function setSessionNotice(message: string): void {
  sessionNotice = message;
}

export function consumeSessionNotice(): string | null {
  const current = sessionNotice;
  sessionNotice = null;
  return current;
}
