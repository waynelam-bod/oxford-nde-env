import zlib from 'zlib';
import { promisify } from 'util';

// Re-export shared transforms
export { pickupLocationTransforms, transformAlmaRequestResponse } from './alma-request-transforms.mjs';

const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const brotliDecompress = promisify(zlib.brotliDecompress);

// Added deepMerge utility to retain unspecified fields
export function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return source;
  const out = Array.isArray(target) ? [...target] : {...target};
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] !== null && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Decompress buffer based on content-encoding header
 */
export async function decompressBuffer(buffer, encoding) {
  if (encoding === 'gzip') {
    return (await gunzip(buffer)).toString('utf8');
  } else if (encoding === 'deflate') {
    return (await inflate(buffer)).toString('utf8');
  } else if (encoding === 'br') {
    return (await brotliDecompress(buffer)).toString('utf8');
  }
  return buffer.toString('utf8');
}

