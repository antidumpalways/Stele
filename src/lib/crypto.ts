/**
 * Hashing Engine — Local Cryptography
 * Generates a SHA-256 hash from a file to be used as the World ID Signal.
 * Atomic Binding: Proof is only valid for a file with this exact hash.
 * Change 1 pixel → different hash → STELE rejects the proof.
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
