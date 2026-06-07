/**
 * Base URL for the Aerolith backend.
 *
 * In development, point to your local Docker-compose stack.
 * In production this will be https://aerolith.org.
 *
 * Override via EAS build profile env vars:
 *   eas.json -> { "build": { "production": { "env": { "EXPO_PUBLIC_API_BASE": "..." } } } }
 */
export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000';

/** Default lexicon PK. NWL23=24, CSW24=25 on aerolith.org. */
export const DEFAULT_LEXICON_ID: number = parseInt(
  process.env.EXPO_PUBLIC_DEFAULT_LEXICON_ID ?? '24',
  10,
);

/** Number of alphagrams visible at once in the column UI. */
export const MAX_ON_SCREEN = 10;

/** Minutes before JWT expiry to proactively refresh. */
export const JWT_RENEWAL_BUFFER_MINUTES = 10;
