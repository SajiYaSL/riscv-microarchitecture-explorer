import {validateWorkspace, type WorkspaceInput} from './simulationStore';
import {assemble} from '../engine/assembler';

const MAX_BYTES = 64000;
const MAX_ENCODED = 16000;
function base64url(bytes: Uint8Array) {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function unbase64(value: string) {
  if (!/^[\w-]+$/.test(value) || value.length > MAX_ENCODED) throw Error('This shared link is invalid or too large.');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
}
async function readBounded(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader(); const parts: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const result = await reader.read(); if (result.done) break;
      size += result.value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw Error('The shared program is too large.'); }
      parts.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  parts.forEach(part => {bytes.set(part, offset); offset += part.length;});
  return bytes;
}
export async function encodeWorkspace(input: WorkspaceInput): Promise<string> {
  assemble(input.code);
  const safe = validateWorkspace({...input, loadedSource: input.code});
  if (!safe) throw Error('Assemble a valid program before sharing.');
  const bytes = new TextEncoder().encode(JSON.stringify(safe));
  const compressed = typeof CompressionStream !== 'undefined';
  const result = compressed ? await readBounded(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))) : bytes;
  const encoded = `${compressed ? '2z' : '2r'}.${base64url(result)}`;
  if (encoded.length > MAX_ENCODED) throw Error('This program is too large for a link. Export an experiment instead.');
  return encoded;
}
export async function decodeWorkspace(encoded: string): Promise<WorkspaceInput> {
  const [version, payload, extra] = encoded.split('.');
  if (!['2z', '2r'].includes(version) || !payload || extra) throw Error('This share link is not supported.');
  const bytes = unbase64(payload);
  const source = version === '2z' ? await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))) : bytes;
  if (source.length > MAX_BYTES) throw Error('This shared program is too large.');
  const result = validateWorkspace(JSON.parse(new TextDecoder().decode(source)));
  if (!result) throw Error('The shared program or CPU configuration is invalid.');
  return result;
}
