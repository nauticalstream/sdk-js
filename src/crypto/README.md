# Crypto

URL-safe unique ID generation backed by nanoid (CSPRNG). Base62 alphabet (0–9A–Za–z), 21 chars, ~125 bits entropy — slightly more than UUID v4, fully URL and database safe.

---

## Usage

```typescript
import { IDGenerator } from '@nauticalstream/sdk/crypto';

// Standard ID — 21 chars, base62
const id = IDGenerator.generate();
// → 'aB3xK9mQpR7vW2nYtL5eD'

// Custom length
const short = IDGenerator.generateWithLength(12);

// Custom alphabet + length
const numeric = IDGenerator.generateWithAlphabet('0123456789', 16);
```
