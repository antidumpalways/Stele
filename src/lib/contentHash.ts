/**
 * Compute SHA-256 content hash for file(s).
 * For single file: returns hex hash.
 * For multiple files: returns hash of concatenated sorted file hashes (deterministic).
 */
export async function computeContentHash(files: File[]): Promise<string> {
  if (files.length === 0) throw new Error("At least one file required");

  const hashes: string[] = [];
  for (const file of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    const buf = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
    hashes.push(Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""));
  }

  if (hashes.length === 1) return hashes[0];

  const combined = hashes.join("");
  const combinedBuf = new TextEncoder().encode(combined);
  const finalHash = await crypto.subtle.digest("SHA-256", combinedBuf);
  return Array.from(new Uint8Array(finalHash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify file content matches expected hash.
 */
export async function verifyContentHash(file: File | Blob, expectedHash: string): Promise<boolean> {
  const buf = await (file instanceof File ? file.arrayBuffer() : file.arrayBuffer());
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  const actual = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return actual === expectedHash.toLowerCase();
}

/**
 * Verify content hash for multiple blobs (same logic as computeContentHash).
 */
export async function verifyContentHashMultiple(
  blobs: { name: string; data: ArrayBuffer }[],
  expectedHash: string
): Promise<boolean> {
  const hashes: string[] = [];
  for (const { data } of [...blobs].sort((a, b) => a.name.localeCompare(b.name))) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    hashes.push(
      Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }
  const combined = hashes.length === 1 ? hashes[0] : hashes.join("");
  const finalHash =
    hashes.length === 1
      ? combined
      : Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(combined))))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
  return finalHash === expectedHash.toLowerCase();
}
