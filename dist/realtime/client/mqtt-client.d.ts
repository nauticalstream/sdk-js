import { MqttClient } from 'mqtt';
import type { Logger } from 'pino';
export interface MQTTClientConfig {
    brokerUrl: string;
    clientId?: string;
    username?: string;
    password?: string;
    reconnectPeriod?: number;
    connectTimeout?: number;
    clean?: boolean;
    keepalive?: number;
    logger?: Logger;
}
export declare class MQTTClientManager {
    private client;
    private config;
    private logger?;
    private isConnecting;
    private isDisconnecting;
    constructor(config: MQTTClientConfig);
    connect(): Promise<MqttClient>;
    getClient(): MqttClient;
    /**
     * Returns true only when the underlying MQTT socket is live.
     * Use this to check the actual transport state, not just our local flag.
     */
    isConnected(): boolean;
    /**
     * Gracefully disconnect from MQTT broker
     * Allows pending messages to complete before closing
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=mqtt-client.d.ts.map