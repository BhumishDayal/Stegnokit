export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const CIPHER_CHARS = "0123456789ABCDEF░▒▓█▀▄▌▐■◆◇◢◣◤◥▲▼◀▶";

export function randomCipherChar(): string {
  return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
}
