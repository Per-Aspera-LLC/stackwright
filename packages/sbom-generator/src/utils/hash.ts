/**
 * SHA-256 hashing utilities for SBOM integrity verification
 * @package @stackwright/sbom-generator
 */

import { createHash } from 'node:crypto';

/**
 * Compute SHA-256 hash of a string or buffer
 * @param content - The content to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Compute SHA-256 hash of a file's contents
 * @param filePath - Path to the file (must be readable)
 * @returns Promise resolving to hex-encoded SHA-256 hash
 */
export async function sha256File(filePath: string): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(filePath);
  return sha256(content);
}

/**
 * Generate integrity string in SRI format (sha256-<base64>)
 * @param content - The content to hash
 * @returns SRI-compatible integrity string
 */
export function sha256SRI(content: string | Buffer): string {
  const hash = sha256(content);
  const base64 = Buffer.from(hash, 'hex').toString('base64');
  return `sha256-${base64}`;
}

/**
 * Verify content matches expected hash
 * @param content - Content to verify
 * @param expectedHash - Expected SHA-256 hash (hex)
 * @returns true if hash matches
 */
export function verifySHA256(content: string | Buffer, expectedHash: string): boolean {
  const actualHash = sha256(content);
  return actualHash === expectedHash;
}
