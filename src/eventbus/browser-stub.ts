/**
 * Browser stub for @nauticalstream/sdk/eventbus
 * 
 * This module is only available in Node.js environments.
 * EventBus is for internal service-to-service messaging via NATS.
 * 
 * For client-side pub/sub, use @nauticalstream/sdk/realtime (MQTT).
 */

const createBrowserError = () => {
  throw new Error(
    'EventBus is only available in Node.js. This is for internal service-to-service messaging. For client-side pub/sub, use @nauticalstream/sdk/realtime instead.'
  );
};

export class EventBus {
  constructor(..._args: any[]) {
    createBrowserError();
  }
}
