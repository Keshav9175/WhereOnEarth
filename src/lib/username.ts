// The rules for usernames, shared by the forms (quick feedback) and the server (the real check, D-027).
export const USERNAME_RULES = {
  min: 3,
  max: 20,
  // Letters, numbers, underscore and dot (Better Auth's default allowed characters).
  pattern: /^[a-zA-Z0-9_.]+$/,
} as const;

export const USERNAME_HINT = `${USERNAME_RULES.min}–${USERNAME_RULES.max} characters: letters, numbers, _ or .`;

// Better Auth's error codes → messages for players.
export function usernameErrorMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case "USERNAME_IS_ALREADY_TAKEN":
      return "That username is already taken. Please try another.";
    case "USERNAME_TOO_SHORT":
      return `Usernames need at least ${USERNAME_RULES.min} characters.`;
    case "USERNAME_TOO_LONG":
      return `Usernames can have at most ${USERNAME_RULES.max} characters.`;
    case "INVALID_USERNAME":
      return "Use only letters, numbers, _ or . (no spaces).";
    default:
      return fallback;
  }
}

// Where players without a username pick one; afterwards they go on to `next` (see safeNextPath).
export const CHOOSE_USERNAME_URL = "/choose-username";
