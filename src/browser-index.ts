/**
 * Browser-safe entry point for @nauticalstream/sdk
 * 
 * Re-exports only browser-compatible modules.
 * Server-only modules (telemetry, eventbus, server) export browser stubs.
 */

// Browser-safe modules (full implementation)
export * as logger from './logger';
export * as errors from './errors';
export * as crypto from './crypto';
export * as realtime from './realtime';
export * as permissions from './permissions';
export * as resilience from './resilience';
export * as workspace from './workspace';

// Server-only modules (browser stubs)
export * as telemetry from './telemetry/browser-stub';
export * as eventbus from './eventbus/browser-stub';
export * as server from './server/fastify/browser-stub';
