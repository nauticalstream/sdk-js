# [7.0.0](https://github.com/nauticalstream/sdk-js/compare/v6.0.0...v7.0.0) (2026-03-20)


### Bug Fixes

* move JwtUtils to conditional export for browser compatibility ([adfcec8](https://github.com/nauticalstream/sdk-js/commit/adfcec8e545d3f06c6ac8918d495ef7967f442d7))


### BREAKING CHANGES

* JwtUtils moved from '@nauticalstream/sdk/realtime' to '@nauticalstream/sdk/realtime/jwt'

# [6.0.0](https://github.com/nauticalstream/sdk-js/compare/v5.1.3...v6.0.0) (2026-03-20)


### Bug Fixes

* add correlationId option to toProtoError for test compatibility ([8b3f68b](https://github.com/nauticalstream/sdk-js/commit/8b3f68b3fab2d9dfb9884a797018296eabe2ec78))


### Features

* add conditional exports and centralized logger for browser compatibility ([4f50809](https://github.com/nauticalstream/sdk-js/commit/4f50809bd9c15079ab4787b494f9db6664d4f89d))


### BREAKING CHANGES

* None - fully backward compatible with existing services

## [5.1.3](https://github.com/nauticalstream/sdk-js/compare/v5.1.2...v5.1.3) (2026-03-20)


### Bug Fixes

* exclude Sentry profiling-node from bundle ([5f49017](https://github.com/nauticalstream/sdk-js/commit/5f49017575a0a851c02aca9acb6bfa953e534ad8))
* externalize Sentry to prevent bundling native bindings ([821b603](https://github.com/nauticalstream/sdk-js/commit/821b6030ebb34731d1cc4384f6aef9614bb90d6c))

## [5.1.2](https://github.com/nauticalstream/sdk-js/compare/v5.1.1...v5.1.2) (2026-03-20)


### Bug Fixes

* update proto dependency to latest version with ESM imports ([287bce3](https://github.com/nauticalstream/sdk-js/commit/287bce3797475d68a06c85b3888e690fe537d6dc))

## [5.1.1](https://github.com/nauticalstream/sdk-js/compare/v5.1.0...v5.1.1) (2026-03-20)


### Bug Fixes

* migrate to tsup for proper ESM compatibility ([7681c78](https://github.com/nauticalstream/sdk-js/commit/7681c78e6a0ade9735c6d60b03880046bd02cb42))

# [5.1.0](https://github.com/nauticalstream/sdk-js/compare/v5.0.4...v5.1.0) (2026-03-20)


### Features

* add generateClientId utility for unique MQTT connections ([1ba57d3](https://github.com/nauticalstream/sdk-js/commit/1ba57d35cb7dcd00d4456539d79352030f0c0887))

## [5.0.4](https://github.com/nauticalstream/sdk-js/compare/v5.0.3...v5.0.4) (2026-03-20)


### Bug Fixes

* export JwtUtils from realtime module ([8209733](https://github.com/nauticalstream/sdk-js/commit/82097337d728e65dfb9e62452b352521dc3eb8f4))

## [5.0.3](https://github.com/nauticalstream/sdk-js/compare/v5.0.2...v5.0.3) (2026-03-20)


### Bug Fixes

* resolve JWT type issues and add proper types for jsonwebtoken ([f8b34b3](https://github.com/nauticalstream/sdk-js/commit/f8b34b319bc3b87890dd8663ac3e560a96da01c0))
* update JWT utilities and refactor realtime SDK ([1f15630](https://github.com/nauticalstream/sdk-js/commit/1f156307b04dabe19bc7a796ea73756600e8bc5e))

## [5.0.2](https://github.com/nauticalstream/sdk-js/compare/v5.0.1...v5.0.2) (2026-03-12)


### Bug Fixes

* auto-convert ZodError to ValidationError in GraphQL error formatter ([e24f6a6](https://github.com/nauticalstream/sdk-js/commit/e24f6a6e53cc94098652fe361a3ef8e61ccf532b))

## [5.0.1](https://github.com/nauticalstream/sdk-js/compare/v5.0.0...v5.0.1) (2026-03-10)


### Bug Fixes

* update deriveStream to use uppercase stream names matching NATS convention ([a23819f](https://github.com/nauticalstream/sdk-js/commit/a23819fc5bd83e082f58b4771941a1c769f67945))

# [5.0.0](https://github.com/nauticalstream/sdk-js/compare/v4.0.3...v5.0.0) (2026-03-08)


* feat(realtime)!: add user-scoped chat command topics and platform user topic ([77ba0af](https://github.com/nauticalstream/sdk-js/commit/77ba0af6fe7d50122600d34fb8a1176689a0a874))


### BREAKING CHANGES

* Chat command topics changed from commands/chat/{action} to commands/chat/user/{userId}/{action}. User topic moved from TOPICS.CHAT.user() to TOPICS.PLATFORM.user().

- change chat command topics to commands/chat/user/{userId}/{action}
- add markDelivered chat command topic
- move user topic to platformTopics.user(userId)
- export TOPICS.PLATFORM and update realtime topic tests

## [4.0.3](https://github.com/nauticalstream/sdk-js/compare/v4.0.2...v4.0.3) (2026-03-06)


### Bug Fixes

* **errors:** include validation details in GraphQL error extensions ([007ed82](https://github.com/nauticalstream/sdk-js/commit/007ed8286fb25f19a83dc37b0be4acd471918d19))

## [4.0.2](https://github.com/nauticalstream/sdk-js/compare/v4.0.1...v4.0.2) (2026-03-06)


### Bug Fixes

* **inbox:** make PrismaClient type compatible with any generated Prisma client ([58e734b](https://github.com/nauticalstream/sdk-js/commit/58e734b931491f0068429ce21ac0c0012ca6fa29))

## [4.0.1](https://github.com/nauticalstream/sdk-js/compare/v4.0.0...v4.0.1) (2026-03-06)


### Bug Fixes

* simplify inbox to use id field directly for event.id ([f2b55a3](https://github.com/nauticalstream/sdk-js/commit/f2b55a3af912d1d8be3a5b30a1217008b1d3616b))

# [4.0.0](https://github.com/nauticalstream/sdk-js/compare/v3.1.1...v4.0.0) (2026-03-06)


* feat!: add Event.id support and outbox pattern ([d97ca42](https://github.com/nauticalstream/sdk-js/commit/d97ca4258c550a54a94ab3b158d9e812677b8b17))


### BREAKING CHANGES

* Updated to proto v3.0.0 with Event.id field. Inbox pattern now uses eventId for deduplication instead of correlationId. IDGenerator refactored to parameter-based API with UUID v7 support for event IDs.

Added transactional outbox pattern with OutboxPublisher class for reliable event publishing. All 528 tests passing.

## [3.1.1](https://github.com/nauticalstream/sdk-js/compare/v3.1.0...v3.1.1) (2026-03-06)


### Bug Fixes

* add eventbus/inbox export to package.json ([173851f](https://github.com/nauticalstream/sdk-js/commit/173851f176268ba3d949e969f289fcb6c20fa99f))

# [3.1.0](https://github.com/nauticalstream/sdk-js/compare/v3.0.0...v3.1.0) (2026-03-06)


### Bug Fixes

* update Event envelope to use 'subject' field instead of 'type' ([e2d9021](https://github.com/nauticalstream/sdk-js/commit/e2d902171b5459bead40e091bde0e124c3ea4221))
* use envelope.subject instead of type in queue-group ([ae0b033](https://github.com/nauticalstream/sdk-js/commit/ae0b033dd8e3b7824b9e220f96268fa933cdefe8))


### Features

* add transactional inbox pattern for idempotent event consumption ([46c885b](https://github.com/nauticalstream/sdk-js/commit/46c885ba0e3efc595041070b6ce382cafdcfa69e))

# [3.0.0](https://github.com/nauticalstream/sdk-js/compare/v2.3.1...v3.0.0) (2026-03-05)


* feat!: simplify Context with pre-computed audit fields and unified ActionSource ([8b536e2](https://github.com/nauticalstream/sdk-js/commit/8b536e287d5f58369803dbaa84278b5700533a09))


### BREAKING CHANGES

* ActionSource type changed. Context interface unified - BaseContext and BusinessContext removed. createSystemContext() signature simplified.

## [2.3.1](https://github.com/nauticalstream/sdk-js/compare/v2.3.0...v2.3.1) (2026-03-01)


### Bug Fixes

* export workspace validator module in SDK ([1574ca8](https://github.com/nauticalstream/sdk-js/commit/1574ca86e027d0aa91e05a2fcff718c2cdfd39d9))

# [2.3.0](https://github.com/nauticalstream/sdk-js/compare/v2.2.3...v2.3.0) (2026-03-01)


### Features

* update workspace validator to fail-closed for security, use 'Published' terminology ([943c4d3](https://github.com/nauticalstream/sdk-js/commit/943c4d36f44c226c4867810a111bec2fe0537d22))

## [2.2.3](https://github.com/nauticalstream/sdk-js/compare/v2.2.2...v2.2.3) (2026-02-27)


### Bug Fixes

* improve error handling and formatting across SDK ([29d9c10](https://github.com/nauticalstream/sdk-js/commit/29d9c10005b8a3a12905b16d3eaf953e2c7b4626))

## [2.2.2](https://github.com/nauticalstream/sdk-js/compare/v2.2.1...v2.2.2) (2026-02-26)


### Bug Fixes

* **eventbus:** make stream parameter optional with auto-derivation ([62d46c2](https://github.com/nauticalstream/sdk-js/commit/62d46c2b574db445c39fa58901a7bec5f0b9d8e3))

## [2.2.1](https://github.com/nauticalstream/sdk-js/compare/v2.2.0...v2.2.1) (2026-02-24)


### Bug Fixes

* remove legacy buildEnvelope overload and make subject optional in JetStreamAPI.subscribe ([9b2bc2b](https://github.com/nauticalstream/sdk-js/commit/9b2bc2b263a38664278086b20e311192a0529da8))

# [2.2.0](https://github.com/nauticalstream/sdk-js/compare/v2.1.0...v2.2.0) (2026-02-23)


### Features

* **permissions:** per-domain modules (posts/articles/files) replacing generic resource API ([b911d39](https://github.com/nauticalstream/sdk-js/commit/b911d3981f5fca070254761c116bb14194599ae4))

# [2.1.0](https://github.com/nauticalstream/sdk-js/compare/v2.0.2...v2.1.0) (2026-02-23)


### Features

* **permissions:** add ResourcePermission enum support, remove OPL namespace config ([0e58551](https://github.com/nauticalstream/sdk-js/commit/0e58551079878ebb733d8e0f3f7b9fa770ce87de))

## [2.0.2](https://github.com/nauticalstream/sdk-js/compare/v2.0.1...v2.0.2) (2026-02-23)


### Bug Fixes

* **permissions:** remove health check, probe methods, and stale bootstrap logger ([caa2c7e](https://github.com/nauticalstream/sdk-js/commit/caa2c7e5f3bd51940d006c6f2689cfd6d2342090))

## [2.0.1](https://github.com/nauticalstream/sdk-js/compare/v2.0.0...v2.0.1) (2026-02-23)


### Bug Fixes

* **permissions:** accept string | undefined | null for all userId params, throw ForbiddenError on missing auth ([8fd5d18](https://github.com/nauticalstream/sdk-js/commit/8fd5d18ec2b4b2c17f2cc8d5fb6c01534a477cfb))
* **permissions:** restore ValidationError import and replace assertNonEmpty in grantRole/revokeRole ([ea13664](https://github.com/nauticalstream/sdk-js/commit/ea136644fe9ef1d8aac1f646e7bf6314c1546320))

# [2.0.0](https://github.com/nauticalstream/sdk-js/compare/v1.6.0...v2.0.0) (2026-02-23)


### Bug Fixes

* **deps:** update zod peer dependency to ^4.0.0 ([a0ece69](https://github.com/nauticalstream/sdk-js/commit/a0ece693ef5522e59bf379ededb015f660dbcaba))


### BREAKING CHANGES

* **deps:** Requires zod ^4.0.0 instead of ^3.0.0

# [1.6.0](https://github.com/nauticalstream/sdk-js/compare/v1.5.1...v1.6.0) (2026-02-23)


### Features

* **fastify:** add error handling and validation middleware ([12d499f](https://github.com/nauticalstream/sdk-js/commit/12d499f261d320f9bada0f876be1949842e52f59))

## [1.5.1](https://github.com/nauticalstream/sdk-js/compare/v1.5.0...v1.5.1) (2026-02-23)


### Bug Fixes

* **permissions:** replace OPL syntax check with Keto health check in bootstrap ([ab24ba7](https://github.com/nauticalstream/sdk-js/commit/ab24ba75724cce1663db2b7315dd0b4015aba416))

# [1.5.0](https://github.com/nauticalstream/sdk-js/compare/v1.4.3...v1.5.0) (2026-02-23)


### Features

* **telemetry:** add Node.js runtime metrics via RuntimeNodeInstrumentation ([8dc0362](https://github.com/nauticalstream/sdk-js/commit/8dc0362b9eea5e4ad123ecb9c8871459772d6560))

## [1.4.3](https://github.com/nauticalstream/sdk-js/compare/v1.4.2...v1.4.3) (2026-02-23)


### Bug Fixes

* use JSON payload string and auto-derive subject in buildEnvelope ([985abe8](https://github.com/nauticalstream/sdk-js/commit/985abe8e69ff925e3f949868842cf4ba1dc22a02))

## [1.4.2](https://github.com/nauticalstream/sdk-js/compare/v1.4.1...v1.4.2) (2026-02-23)


### Bug Fixes

* simplify realtime to JSON, rename correlation.id span attr, add module READMEs ([e331189](https://github.com/nauticalstream/sdk-js/commit/e33118992d14846b1a6a6f8efec7966eb3845d2e))

## [1.4.1](https://github.com/nauticalstream/sdk-js/compare/v1.4.0...v1.4.1) (2026-02-23)


### Bug Fixes

* add withServiceSpan helper with automatic request.id injection from correlationId ([98b7de0](https://github.com/nauticalstream/sdk-js/commit/98b7de015f5ef3b586cf6ba2fba2fd5eba70d596))

# [1.4.0](https://github.com/nauticalstream/sdk-js/compare/v1.3.6...v1.4.0) (2026-02-23)


### Features

* harden SDK across all libraries for production readiness ([bd44597](https://github.com/nauticalstream/sdk-js/commit/bd4459708390cd87e473ecb758b74595d219d81a))

## [1.3.6](https://github.com/nauticalstream/sdk-js/compare/v1.3.5...v1.3.6) (2026-02-21)


### Bug Fixes

* trigger release with updated dependencies ([80260e0](https://github.com/nauticalstream/sdk-js/commit/80260e04720f2ef5f5aef223a6eb22d02b88ed29))

## [1.3.5](https://github.com/nauticalstream/sdk-js/compare/v1.3.4...v1.3.5) (2026-02-21)


### Bug Fixes

* use Mercurius context correlationId in error formatter ([7cce094](https://github.com/nauticalstream/sdk-js/commit/7cce09409373e58dc9b5070a700ff0bc16254bd6))

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
