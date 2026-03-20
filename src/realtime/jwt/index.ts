/**
 * @nauticalstream/sdk/realtime/jwt
 * 
 * JWT utilities for MQTT authentication (Node.js only)
 * 
 * @example Server-side (SvelteKit .server.ts)
 * ```typescript
 * import { JwtUtils } from '@nauticalstream/sdk/realtime/jwt';
 * 
 * const jwtUtils = new JwtUtils(process.env.MQTT_JWT_SECRET);
 * const token = jwtUtils.sign({ userId, type: 'user' });
 * ```
 */

export { JwtUtils, type RealtimeJwtPayload } from '../utils/jwt';
