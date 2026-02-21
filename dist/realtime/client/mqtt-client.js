import mqtt from 'mqtt';
export class MQTTClientManager {
    client = null;
    config;
    logger;
    isConnecting = false;
    isDisconnecting = false;
    constructor(config) {
        this.config = config;
        this.logger = config.logger;
    }
    async connect() {
        if (this.client?.connected) {
            return this.client;
        }
        if (this.isConnecting) {
            // Wait for existing connection attempt
            return new Promise((resolve) => {
                const checkConnection = () => {
                    if (this.client?.connected) {
                        resolve(this.client);
                    }
                    else {
                        setTimeout(checkConnection, 100);
                    }
                };
                checkConnection();
            });
        }
        this.isConnecting = true;
        const options = {
            clientId: this.config.clientId || `mqtt_${Math.random().toString(16).slice(2, 8)}`,
            username: this.config.username,
            password: this.config.password,
            reconnectPeriod: this.config.reconnectPeriod || 5000,
            connectTimeout: this.config.connectTimeout || 30000,
            clean: this.config.clean !== false,
            keepalive: this.config.keepalive || 60,
            protocolVersion: 5, // Enable MQTT v5 for User Properties support
        };
        return new Promise((resolve, reject) => {
            this.client = mqtt.connect(this.config.brokerUrl, options);
            this.client.on('connect', () => {
                this.logger?.info('MQTT connected');
                this.isConnecting = false;
                resolve(this.client);
            });
            this.client.on('error', (error) => {
                this.logger?.error({ error }, 'MQTT connection error');
                this.isConnecting = false;
                reject(error);
            });
            this.client.on('reconnect', () => {
                if (!this.isDisconnecting) {
                    this.logger?.info('MQTT reconnecting...');
                }
            });
            this.client.on('offline', () => {
                this.logger?.warn('MQTT client offline');
            });
            this.client.on('close', () => {
                this.logger?.info('MQTT connection closed');
            });
        });
    }
    getClient() {
        if (!this.client) {
            throw new Error('MQTT client not initialized. Call connect() first.');
        }
        return this.client;
    }
    /**
     * Gracefully disconnect from MQTT broker
     * Allows pending messages to complete before closing
     */
    async disconnect() {
        if (!this.client) {
            return;
        }
        this.isDisconnecting = true;
        try {
            // End connection gracefully (force=false allows pending messages to complete)
            await this.client.endAsync(false);
            this.logger?.info('Disconnected from MQTT broker');
        }
        catch (error) {
            this.logger?.error({ error }, 'Error during MQTT disconnect');
            throw error;
        }
        finally {
            this.client = null;
            this.isDisconnecting = false;
        }
    }
    isConnected() {
        return this.client?.connected ?? false;
    }
}
//# sourceMappingURL=mqtt-client.js.map