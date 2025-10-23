/**
 * Generate a human-typeable join code in format: cliq-xxxxxx
 * Uses characters a-z and 2-7 (excludes 0, 1, o, i for clarity)
 */

const CHARSET = 'abcdefghjklmnpqrstuvwxyz23456789'; // Excludes 0, 1, o, i
const CODE_LENGTH = 6;

export function generateJoinCode(): string {
  let code = 'cliq-';
  
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[randomIndex];
  }
  
  return code;
}

/**
 * Normalize join code for database lookup (uppercase, trim)
 */
export function normalizeJoinCode(code: string): string {
  return code.toUpperCase().trim();
}
