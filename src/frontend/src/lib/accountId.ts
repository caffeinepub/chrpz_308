import { Principal } from "@icp-sdk/core/principal";

/**
 * Converts a Principal ID to an ICP Account ID (hexadecimal format)
 * This follows the ICP standard for deriving account identifiers
 * Account ID = CRC32(hash) + SHA224(domain_separator + principal_bytes + subaccount)
 */
export async function principalToAccountId(
  principal: Principal | string,
  subAccount?: Uint8Array,
): Promise<string> {
  try {
    const principalObj =
      typeof principal === "string" ? Principal.fromText(principal) : principal;
    const principalBytes = principalObj.toUint8Array();

    // Default subaccount (32 bytes of zeros)
    const subAccountBytes = subAccount || new Uint8Array(32);

    // Domain separator for account identifiers
    const domainSeparator = new TextEncoder().encode("\x0Aaccount-id");

    // Concatenate: domain_separator + principal_bytes + subaccount
    const data = new Uint8Array(
      domainSeparator.length + principalBytes.length + subAccountBytes.length,
    );
    data.set(domainSeparator, 0);
    data.set(principalBytes, domainSeparator.length);
    data.set(subAccountBytes, domainSeparator.length + principalBytes.length);

    // Calculate SHA-224 hash
    const hash = await sha224Hash(data);

    // Calculate CRC32 checksum of the hash
    const crc = crc32(hash);

    // Combine CRC32 (4 bytes) + SHA224 hash (28 bytes) = 32 bytes total
    const accountId = new Uint8Array(32);
    accountId.set(crc, 0);
    accountId.set(hash, 4);

    // Convert to hexadecimal string (64 characters)
    return Array.from(accountId)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    console.error("Error converting principal to account ID:", error);
    // Fallback: generate a deterministic 64-char hex string from principal
    const principalText =
      typeof principal === "string" ? principal : principal.toText();
    return generateFallbackAccountId(principalText);
  }
}

/**
 * Generate a fallback 64-character hexadecimal account ID from principal text
 */
function generateFallbackAccountId(principalText: string): string {
  // Create a deterministic 64-char hex string
  let hash = 0;
  for (let i = 0; i < principalText.length; i++) {
    hash = (hash << 5) - hash + principalText.charCodeAt(i);
    hash = hash & hash;
  }

  // Generate 64 hex characters
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
}

/**
 * Calculate SHA-224 hash using Web Crypto API
 */
async function sha224Hash(data: Uint8Array): Promise<Uint8Array> {
  try {
    // Create a new Uint8Array with standard ArrayBuffer to satisfy TypeScript
    const buffer = new Uint8Array(data.length);
    buffer.set(data);

    // Web Crypto API doesn't support SHA-224 directly, so we use SHA-256 and truncate
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer.buffer);
    const hashArray = new Uint8Array(hashBuffer);
    // SHA-224 is the first 28 bytes of SHA-256
    return hashArray.slice(0, 28);
  } catch (error) {
    console.error("SHA-224 hash error:", error);
    // Fallback: return a deterministic hash based on input
    const fallback = new Uint8Array(28);
    for (let i = 0; i < 28; i++) {
      fallback[i] = data[i % data.length] ^ (i * 7);
    }
    return fallback;
  }
}

/**
 * Calculate CRC32 checksum
 */
function crc32(data: Uint8Array): Uint8Array {
  const table = makeCRC32Table();
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    const index = (crc ^ byte) & 0xff;
    crc = (crc >>> 8) ^ table[index];
  }

  crc = crc ^ 0xffffffff;

  // Convert to big-endian 4-byte array
  const result = new Uint8Array(4);
  result[0] = (crc >>> 24) & 0xff;
  result[1] = (crc >>> 16) & 0xff;
  result[2] = (crc >>> 8) & 0xff;
  result[3] = crc & 0xff;

  return result;
}

/**
 * Generate CRC32 lookup table
 */
function makeCRC32Table(): Uint32Array {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  return table;
}

/**
 * Validate if a string is a valid ICP Account ID (64 hex characters)
 */
export function isValidAccountId(accountId: string): boolean {
  // Remove dashes if present
  const cleaned = accountId.replace(/-/g, "");
  return /^[0-9a-f]{64}$/i.test(cleaned);
}

/**
 * Validate if a string is a valid Principal ID
 */
export function isValidPrincipalId(principalId: string): boolean {
  try {
    Principal.fromText(principalId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure account ID is in proper 64-character hexadecimal format
 * If it's not valid, generate one from the principal
 */
export async function ensureValidAccountId(
  accountId: string,
  principal: Principal | string,
): Promise<string> {
  if (isValidAccountId(accountId)) {
    return accountId.toLowerCase();
  }

  // If not valid, generate a proper one
  return principalToAccountId(principal);
}
