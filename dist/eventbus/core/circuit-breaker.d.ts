import CircuitBreaker from 'opossum';
import { Logger } from 'pino';
interface BreakerConfig {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
}
export declare function getOrCreateBreaker(serverCluster: string, logger?: Logger, config?: BreakerConfig): CircuitBreaker<any>;
export declare function isBreakerOpen(serverCluster: string): boolean;
export declare function resetBreaker(serverCluster: string): void;
export {};
//# sourceMappingURL=circuit-breaker.d.ts.map