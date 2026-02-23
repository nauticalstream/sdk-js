/**
 * Re-exports all context utilities from the context/ submodules.
 * Import from here for the public API; import directly from context/base or
 * context/builder when writing unit tests for those pure functions.
 */
export {
  createBaseContext,
  extractBusinessContext,
} from './context/base';

export {
  createContext,
  createContextBuilder,
} from './context/builder';
