/**
 * Password hashing and validation utilities using Web Crypto API
 */

/**
 * Hash a password using SHA-256
 * @param password - Plain text password
 * @returns Hex string of the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if password meets strength requirements
 * @param password - Password to check
 * @returns True if password is strong enough
 */
export function isStrongPassword(password: string): boolean {
  // At least 8 characters, contains uppercase, lowercase, number
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Get password strength message
 * @param password - Password to check
 * @returns Strength message
 */
export function getPasswordStrengthMessage(password: string): string {
  if (password.length === 0) return "";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(password)) return "Password must contain lowercase letters";
  if (!/[A-Z]/.test(password)) return "Password must contain uppercase letters";
  if (!/[0-9]/.test(password)) return "Password must contain numbers";
  return "Strong password";
}

// Backward compatibility aliases
export const validateEmail = isValidEmail;
export const validatePassword = isStrongPassword;
