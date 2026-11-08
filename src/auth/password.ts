import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

// Stored format: scrypt$<salt base64>$<hash base64>
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

// Used when there is no real hash, so a missing account takes as long as a wrong password.
const DUMMY_SALT = randomBytes(16).toString('base64');
const DUMMY_HASH = randomBytes(KEY_LENGTH).toString('base64');

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) {
    await scryptAsync(password, Buffer.from(DUMMY_SALT, 'base64'), Buffer.from(DUMMY_HASH, 'base64').length);
    return false;
  }
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
