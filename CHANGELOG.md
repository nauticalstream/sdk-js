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
