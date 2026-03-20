/**
 * JWT utilities for MQTT authentication (Node.js only)
 * 
 * This module is only available in Node.js environments.
 * JWT signing requires Node.js native modules.
 */

const createBrowserError = () => {
  throw new Error(
    'JwtUtils is only available in Node.js. JWT signing/verification requires server-side processing for security.'
  );
};

export class JwtUtils {
  constructor(..._args: any[]) {
    createBrowserError();
  }
}

export type RealtimeJwtPayload = any;
