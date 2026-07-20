// Shared by the ingest-time image post-processing steps (watermark.ts,
// sharpening.ts) that download an already-uploaded R2 object, transform it
// with sharp, and re-upload it in place.
export async function streamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
