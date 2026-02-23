# Resilience

Retry, circuit-breaker, timeout, and composed resilience primitives. Built on `p-retry` and `opossum`.

---

## Retry

```typescript
import { withRetry, AbortError } from '@nauticalstream/sdk/resilience';

const result = await withRetry(() => fetch('/api/data'), {
  retries:    3,
  minTimeout: 500,   // ms before first retry
  maxTimeout: 5000,
  factor:     2,     // exponential backoff multiplier
});

// Throw AbortError to stop retrying immediately (non-retryable failure)
const result = await withRetry(async () => {
  const res = await fetch('/api/data');
  if (res.status === 400) throw new AbortError('bad request');
  return res.json();
});
```

---

## Circuit Breaker

```typescript
import { getOrCreateCircuitBreaker } from '@nauticalstream/sdk/resilience';

const breaker = getOrCreateCircuitBreaker('payments-service', {
  timeout:          3000,   // ms — call considered failed if it takes longer
  errorThresholdPercentage: 50,
  resetTimeout:     30_000, // ms before half-open probe
});

const result = await breaker.fire(() => paymentsService.charge(amount));
```

---

## Timeout

```typescript
import { withTimeout, executeWithTimeout } from '@nauticalstream/sdk/resilience';

// Wraps a function with a timeout
const safe = withTimeout(fetchUser, 3000);
const user = await safe(userId);

// One-shot call
const data = await executeWithTimeout(() => fetch('/slow'), 5000);
```

---

## Composed resilience

Combines retry + circuit-breaker + timeout in one call.

```typescript
import { resilientOperation } from '@nauticalstream/sdk/resilience';

const result = await resilientOperation(
  () => paymentsService.charge(amount),
  {
    name:    'payments-service.charge',
    retry:   { retries: 2, minTimeout: 300 },
    breaker: { timeout: 3000, errorThresholdPercentage: 50 },
    timeout: 5000,
  },
);
```

---

## Error classification

```typescript
import { shouldRetry } from '@nauticalstream/sdk/resilience';

// Returns true for transient errors (network, timeout, 429, 5xx)
if (!shouldRetry(err)) throw err;
```
