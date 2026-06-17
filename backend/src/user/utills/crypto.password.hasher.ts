import crypto from "crypto";
import { PasswordHasherInterface } from "@src/user/interfaces/utils";

const HASH_ALGORITHM = "sha512";
const HASH_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export class CryptoPasswordHasher implements PasswordHasherInterface {
  getSalt(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
    const derivedKey = crypto.pbkdf2Sync(
      password,
      salt,
      HASH_ITERATIONS,
      KEY_LENGTH,
      HASH_ALGORITHM
    );

    return `pbkdf2$${HASH_ITERATIONS}$${salt}$${derivedKey.toString("hex")}`;
  }

  async compare(password: string, storedHash: string): Promise<boolean> {
    if (!storedHash || typeof storedHash !== "string") {
      return false;
    }

    const parts = storedHash.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") {
      return false;
    }

    const [, iterationsText, salt, hash] = parts;
    const iterations = Number(iterationsText);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return false;
    }

    const derivedKey = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      KEY_LENGTH,
      HASH_ALGORITHM
    );

    const hashBuffer = Buffer.from(hash, "hex");
    const derivedBuffer = Buffer.from(derivedKey.toString("hex"), "hex");
    if (hashBuffer.length !== derivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, derivedBuffer);
  }
}
