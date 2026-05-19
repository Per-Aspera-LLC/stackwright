/**
 * Estimate entropy of a string (bits per character).
 * High entropy suggests random/generated values (real secrets).
 * Low entropy suggests human-readable text (potential plaintext).
 */
export function estimateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Check if a string looks like a plaintext secret (not an env var reference).
 * Returns warning message if looks like plaintext, null otherwise.
 */
export function checkForPlaintextSecret(value: string, fieldName: string): string | null {
  // Skip if it's an env var reference
  if (value.startsWith('$')) return null;

  // Skip very short values
  if (value.length < 8) return null;

  const entropy = estimateEntropy(value);

  // Low-to-moderate entropy (<3.8 bits/char) = likely a human-readable plaintext
  // password or hardcoded secret (e.g. 'password123', 'mysecret').
  // Higher entropy (≥3.8 bits/char) = looks sufficiently random; not flagged.
  if (entropy < 3.8) {
    return (
      `SECURITY WARNING: "${fieldName}" appears to be a low-entropy plaintext value that looks like a hardcoded password or secret. ` +
      `Use an environment variable reference like $API_TOKEN instead.`
    );
  }

  return null;
}
