## [1.3.4](https://github.com/nauticalstream/sdk-js/compare/v1.3.3...v1.3.4) (2026-02-21)


### Bug Fixes

* restore request logging plugin for consistent correlationId in all log lines ([9734aef](https://github.com/nauticalstream/sdk-js/commit/9734aef99a8d01d6265078959046fb90109920dc))

## [1.3.3](https://github.com/nauticalstream/sdk-js/compare/v1.3.2...v1.3.3) (2026-02-21)


### Bug Fixes

* add @fastify/cors and @mercuriusjs/federation as dependencies to prevent runtime errors ([c1f2dfd](https://github.com/nauticalstream/sdk-js/commit/c1f2dfd9ef72e6d25ee533486e29e009552a4989))

## [1.3.2](https://github.com/nauticalstream/sdk-js/compare/v1.3.1...v1.3.2) (2026-02-21)


### Bug Fixes

* refactor server/fastify - always use telemetry logger, remove logging plugin, clean comments, fix health plugin bugs ([59b114a](https://github.com/nauticalstream/sdk-js/commit/59b114abeb367fada173cb4ac086da494498352d))

## [1.3.1](https://github.com/nauticalstream/sdk-js/compare/v1.3.0...v1.3.1) (2026-02-21)


### Bug Fixes

* fastify server module with telemetry logger, clean server folder ([de52bdb](https://github.com/nauticalstream/sdk-js/commit/de52bdbccef60c2c79d9df16c619d05be8bb044a))

# [1.3.0](https://github.com/nauticalstream/sdk-js/compare/v1.2.0...v1.3.0) (2026-02-21)


### Features

* complete correlation ID propagation and add comprehensive test coverage ([d2a6883](https://github.com/nauticalstream/sdk-js/commit/d2a68833a9227ac3685c9da29610f33ee6f4d42c))

# [1.2.0](https://github.com/nauticalstream/sdk-js/compare/v1.1.0...v1.2.0) (2026-02-21)


### Bug Fixes

* accept MessageInitShape plain objects in publish and reply handlers ([0de2491](https://github.com/nauticalstream/sdk-js/commit/0de24913d472eb4189798a32199dc9decf79ff2e))


### Features

* accept MessageInitShape in publish and reply — callers no longer need create() ([3701667](https://github.com/nauticalstream/sdk-js/commit/3701667ade8c56a903c679f60d2a12e01ac858df))

# [1.1.0](https://github.com/nauticalstream/sdk-js/compare/v1.0.5...v1.1.0) (2026-02-21)


### Features

* **eventbus:** make NATS connection mandatory with waitOnFirstConnect ([8b4729e](https://github.com/nauticalstream/sdk-js/commit/8b4729e28d770ff3c3be965b82216fdea603d093))

## [1.0.5](https://github.com/nauticalstream/sdk-js/compare/v1.0.4...v1.0.5) (2026-02-21)


### Bug Fixes

* eventbus auto-derivation and code quality improvements ([a2d5fce](https://github.com/nauticalstream/sdk-js/commit/a2d5fce456a39f503782aba07351d7dd62908731))

## [1.0.4](https://github.com/nauticalstream/sdk-js/compare/v1.0.3...v1.0.4) (2026-02-21)


### Bug Fixes

* **build:** migrate to Bundler moduleResolution and remove .js extensions ([0a09197](https://github.com/nauticalstream/sdk-js/commit/0a091972904cec56bceb4c2fb7ea68cec4ef723f))

## [1.0.3](https://github.com/nauticalstream/sdk-js/compare/v1.0.2...v1.0.3) (2026-02-21)


### Bug Fixes

* **eventbus:** accept plain objects in request() instead of requiring create() call ([f04d642](https://github.com/nauticalstream/sdk-js/commit/f04d6424bba52382aaaed8142db605169ad0351b))

## [1.0.2](https://github.com/nauticalstream/sdk-js/compare/v1.0.1...v1.0.2) (2026-02-20)


### Bug Fixes

* add NPM_TOKEN environment variable for semantic-release npm plugin ([f7f5ad4](https://github.com/nauticalstream/sdk-js/commit/f7f5ad410d3f563f796f3e8f3d7cfa670dd8e780))

## [1.0.1](https://github.com/nauticalstream/sdk-js/compare/v1.0.0...v1.0.1) (2026-02-20)


### Bug Fixes

* remove npm provenance for private package publishing ([ff7de08](https://github.com/nauticalstream/sdk-js/commit/ff7de08980e7946dc5fc053db7717fd4a448cd59))

# 1.0.0 (2026-02-20)


### Bug Fixes

* add NODE_AUTH_TOKEN to npm ci step for private package installation ([56fa0d4](https://github.com/nauticalstream/sdk-js/commit/56fa0d4e0ae892f7d74416ad044c86acb7b687ef))
* regenerate package-lock.json with npm registry URLs for private packages ([035e914](https://github.com/nauticalstream/sdk-js/commit/035e914bab5bdb46123fc010432aca97ad432a06))
* remove node_modules from git tracking and keep package-lock.json ([0956aae](https://github.com/nauticalstream/sdk-js/commit/0956aaef59dc444d31886fcbdeb06f383036488e))
* trigger initial release with updated dependencies ([b16936f](https://github.com/nauticalstream/sdk-js/commit/b16936f60a1cd975625633b80a111deb17b8df70))


### Features

* initial SDK release with telemetry, errors, eventbus, crypto, and realtime modules ([7d4fc08](https://github.com/nauticalstream/sdk-js/commit/7d4fc0864dd399d785aa3badce44d79f18fd82c2))
