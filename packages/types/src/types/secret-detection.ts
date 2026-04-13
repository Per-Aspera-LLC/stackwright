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

  // High entropy (>4.5 bits/char) = looks like real secret
  // Low entropy (<3.5 bits/char) = looks like plaintext
  if (entropy < 3.5) {
    return (
      `SECURITY WARNING: "${fieldName}" appears to contain plaintext secrets. ` +
      `Use environment variable references like $API_TOKEN instead.`
    );
  }

  return null;
}
