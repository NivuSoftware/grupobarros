import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 24;
const SCRYPT_COST = 32768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_OPTIONS: ScryptOptions = {
  cost: SCRYPT_COST,
  blockSize: SCRYPT_BLOCK_SIZE,
  parallelization: SCRYPT_PARALLELIZATION,
  maxmem: 64 * 1024 * 1024,
};

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !n || !r || !p || !salt || !hash) {
    return false;
  }

  const parsedOptions: ScryptOptions = {
    cost: Number(n),
    blockSize: Number(r),
    parallelization: Number(p),
    maxmem: 64 * 1024 * 1024,
  };

  if (!parsedOptions.cost || !parsedOptions.blockSize || !parsedOptions.parallelization) {
    return false;
  }

  const storedKey = Buffer.from(hash, "base64url");
  const derivedKey = await scrypt(password, Buffer.from(salt, "base64url"), storedKey.length, parsedOptions);

  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}
