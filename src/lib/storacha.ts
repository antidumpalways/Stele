import * as Client from "@storacha/client";
import * as Delegation from "@storacha/client/delegation";
import { getStorachaDelegation } from "./api";

let clientInstance: Awaited<ReturnType<typeof Client.create>> | null = null;
let clientCreatedAt = 0;
const CLIENT_TTL_MS = 1000 * 60 * 60 * 23; // refresh every 23h (safely within 1-year delegation)

async function getStorachaClient() {
  const now = Date.now();
  if (clientInstance && now - clientCreatedAt < CLIENT_TTL_MS) return clientInstance;
  clientInstance = null;

  const client = await Client.create();
  const did = client.agent.did();
  const res = await getStorachaDelegation(did);
  const delegation = await Delegation.extract(new Uint8Array(res));
  if (!delegation.ok) {
    throw new Error("Failed to extract delegation", { cause: delegation.error });
  }
  const space = await client.addSpace(delegation.ok);
  client.setCurrentSpace(space.did());
  clientInstance = client;
  clientCreatedAt = now;
  return client;
}

/**
 * Inscription Engine — Permanently anchors evidence to IPFS/Filecoin via Storacha.
 * Bundles the file + World ID Proof into a single CAR package.
 * Human identity metadata is permanently bound to the file on IPFS.
 * @returns Root CID — proof that the inscription has been permanently recorded
 */
export async function inscribeToIPFS(
  file: File,
  worldIDProof: unknown,
  contentHash: string
): Promise<string> {
  const client = await getStorachaClient();

  const metadata = {
    contentHash,
    worldIDProof,
    filename: file.name,
    evidencePaths: [file.name],
    timestamp: new Date().toISOString(),
  };

  const metadataBlob = new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  });
  const metadataFile = new File([metadataBlob], "metadata.json");
  const evidenceFile = new File([file], `evidence/${file.name}`);

  const files: File[] = [metadataFile, evidenceFile];
  const rootCid = await client.uploadDirectory(files);

  return rootCid.toString();
}
