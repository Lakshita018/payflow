// ---------------------------------------------------------------------------
// generatePayflowId — produces a single candidate PayFlow ID.
//
// Format: <firstname><4-digit-random>@payflow
//   • firstname — lowercase letters extracted from the email local-part
//                 (everything before @). Non-alpha characters are stripped.
//                 Falls back to "user" if nothing remains.
//   • 4-digit-random — uniform random integer in [1000, 9999].
//
// This function does NOT guarantee uniqueness. The caller is responsible for
// checking the generated ID against the database and retrying as needed.
// ---------------------------------------------------------------------------
export function generatePayflowId(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  const firstName = localPart.replace(/[^a-zA-Z]/g, '').toLowerCase() || 'user';
  const random4 = Math.floor(1000 + Math.random() * 9000).toString();
  return `${firstName}${random4}@payflow`;
}
