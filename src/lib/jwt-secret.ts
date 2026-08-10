import crypto from "crypto";

let cachedSecret: Uint8Array | null = null;

/**
 * Gets the JWT secret.
 *
 * - Production (Vercel): MUST set JWT_SECRET env var. File system is read-only.
 * - Local dev: if JWT_SECRET is missing or is the default placeholder,
 *   auto-generates a random secret in-memory (logged to console so you can
 *   copy it to .env for persistence).
 */
export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;

  let secret = process.env.JWT_SECRET;

  if (!secret || secret === "your-secret-key-change-this-in-production") {
    secret = crypto.randomBytes(64).toString("hex");
    process.env.JWT_SECRET = secret;

    if (process.env.NODE_ENV === "production") {
      // On Vercel / production, the filesystem is read-only.
      // The secret will be regenerated on every cold start unless
      // JWT_SECRET is set as an environment variable.
      // This means existing JWTs become invalid on cold starts — acceptable
      // for most family sites; users just need to re-login.
      console.warn(
        "[jwt-secret] WARNING: JWT_SECRET not set in environment. " +
        "Auto-generated secret will change on every deployment/cold-start. " +
        "Set JWT_SECRET in Vercel Environment Variables for stable sessions."
      );
    } else {
      console.log(
        "[jwt-secret] Auto-generated JWT_SECRET. Copy this to your .env file:\n" +
        `JWT_SECRET=${secret}`
      );
    }
  }

  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}
