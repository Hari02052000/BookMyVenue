import crypto from "crypto";
import { TokenProviderInterface } from "@src/user/interfaces/utils";

const DEFAULT_SECRET = process.env.JWT_SECRET || "BookMyVenueJwtSecret";
const DEFAULT_ALGORITHM = "HS256";

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value: string): string {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");

  return Buffer.from(normalized, "base64").toString("utf8");
}

function parseExpiresIn(expiresIn?: string | number): number | undefined {
  if (expiresIn === undefined || expiresIn === null) {
    return undefined;
  }

  if (typeof expiresIn === "number") {
    return expiresIn;
  }

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error("Invalid expiresIn format");
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      throw new Error("Invalid expiresIn unit");
  }
}

export class JwtTokenProvider implements TokenProviderInterface {
  private readonly secret: string;

  constructor(secret?: string) {
    this.secret = secret || DEFAULT_SECRET;
  }

  private signPayload(payload: string): string {
    return crypto
      .createHmac("sha256", this.secret)
      .update(payload)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  async sign(payload: any, expiresIn?: string | number): Promise<string> {
    const header = {
      alg: DEFAULT_ALGORITHM,
      typ: "JWT",
    };

    const now = Math.floor(Date.now() / 1000);
    const claims = { ...payload, iat: now } as Record<string, any>;
    const ttl = parseExpiresIn(expiresIn);
    if (ttl !== undefined) {
      claims.exp = now + ttl;
    }

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(claims));
    const signature = this.signPayload(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  async verify(token: string): Promise<any> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = this.signPayload(
      `${encodedHeader}.${encodedPayload}`
    );

    const signatureBuffer = Buffer.from(signature, "ascii");
    const expectedBuffer = Buffer.from(expectedSignature, "ascii");
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) {
      throw new Error("Token expired");
    }

    return payload;
  }

  async signAccess(payload: any, expiresIn: string | number = "15m"): Promise<string> {
    return this.sign({ ...payload, token_type: "access" }, expiresIn);
  }

  async signRefresh(payload: any, expiresIn: string | number = "7d"): Promise<string> {
    return this.sign({ ...payload, token_type: "refresh" }, expiresIn);
  }

  async verifyAccess(token: string): Promise<any> {
    const payload = await this.verify(token);
    if (payload.token_type !== "access") {
      throw new Error("Invalid access token");
    }
    return payload;
  }

  async verifyRefresh(token: string): Promise<any> {
    const payload = await this.verify(token);
    if (payload.token_type !== "refresh") {
      throw new Error("Invalid refresh token");
    }
    return payload;
  }
}
