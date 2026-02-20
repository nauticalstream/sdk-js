# @nauticalstream/proto

Protocol Buffer definitions for Nauticalstream services.

## 📦 Installation

### JavaScript/TypeScript (npm)

```bash
npm install @nauticalstream/proto
```

```typescript
import { Event } from "@nauticalstream/proto/event/v1/event_pb";
import { ErrorCode } from "@nauticalstream/proto/error/v1/codes_pb";
import { User } from "@nauticalstream/proto/user/v1/user_pb";
```

### Go

```bash
go get github.com/nauticalstream/proto
```

```go
import pb "github.com/nauticalstream/proto/gen/go"
```

### Python (PyPI)

```bash
pip install nauticalstream-proto
```

```python
from nauticalstream_proto import error_pb2, event_pb2
```

## 🔄 Updating Proto Definitions

```bash
# Generate code for all languages
npm run buf:generate

# Lint proto files
npm run buf:lint

# Check for breaking changes
npm run buf:breaking
```

## 📝 Publishing

### JavaScript/TypeScript

```bash
npm run buf:generate
npm version patch
npm publish
```

### Go

```bash
git tag proto/v0.0.2
git push origin proto/v0.0.2
```

### Python

```bash
python -m build
twine upload dist/*
```

## 📄 License

ISC
