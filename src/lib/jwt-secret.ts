import crypto from "crypto";
import fs from "fs";
import path from "path";

let cachedSecret: Uint8Array | null = null;

/**
 * Gets the JWT secret. If JWT_SECRET is not set in environment,
 * auto-generates a random 64-byte hex secret and writes it to .env.
 */
export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;

  let secret = process.env.JWT_SECRET;

  if (!secret || secret === "your-secret-key-change-this-in-production") {
    // Auto-generate a strong random secret
    secret = crypto.randomBytes(64).toString("hex");

    // Persist to .env file so it survives restarts
    const envPath = path.join(process.cwd(), ".env");
    try {
      let envContent = "";
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8");
      }

      if (envContent.includes("JWT_SECRET=")) {
        // Replace existing JWT_SECRET line
        envContent = envContent.replace(
          /^JWT_SECRET=.*$/m,
          `JWT_SECRET=${secret}`
        );
      } else {
        // Append JWT_SECRET
        envContent += `\nJWT_SECRET=${secret}\n`;
      }

      fs.writeFileSync(envPath, envContent, "utf-8");
      console.log("[jwt-secret] Auto-generated JWT_SECRET and saved to .env");
    } catch (err) {
      console.warn(
        "[jwt-secret] Could not persist JWT_SECRET to .env file. Token will be regenerated on restart.",
        err
      );
    }

    // Set it in process.env so subsequent calls see it
    process.env.JWT_SECRET = secret;
  }

  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}
