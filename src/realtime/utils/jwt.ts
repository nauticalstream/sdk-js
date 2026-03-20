import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

/**
 * Type definition for the payload of a realtime JWT.
 */
export interface RealtimeJwtPayload {
  userId: string;
  type: 'user' | 'service';
  workspaceId?: string; // Optional for microservices or frontend apps
  clientId?: string; // Optional - MQTT connection provides this separately
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}

/**
 * Utility class for handling JWT operations.
 */
export class JwtUtils {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Signs a JWT token with the given payload.
   *
   * @param payload - The payload to include in the JWT.
   * @param expiresIn - The expiration time for the JWT (default: 30 seconds).
   * @returns The signed JWT token.
   */
  sign(payload: RealtimeJwtPayload, expiresIn: StringValue | number = '30s'): string {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, this.secret, options);
  }

  /**
   * Parses and verifies a JWT token.
   *
   * @param token - The JWT token to parse.
   * @returns The decoded payload if the token is valid.
   * @throws An error if the token is invalid or verification fails.
   */
  parse(token: string): RealtimeJwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded as RealtimeJwtPayload;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid JWT: ${error.message}`);
      }
      throw error; // Re-throw if not an Error instance
    }
  }

  /**
   * Extracts the payload from a JWT token without verification.
   *
   * @param token - The JWT token to decode.
   * @returns The decoded payload.
   * @throws An error if the token is malformed.
   */
  decode(token: string): RealtimeJwtPayload {
    try {
      const payload = jwt.decode(token);
      if (!payload || typeof payload !== 'object') {
        throw new Error('Malformed JWT payload');
      }
      return payload as RealtimeJwtPayload;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decode JWT: ${error.message}`);
      }
      throw error; // Re-throw if not an Error instance
    }
  }
}