// Shared by the image post-processing (photoFinish.ts) that downloads an
// already-uploaded R2 object, transforms it with sharp, and re-uploads it in place.
export async function streamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
