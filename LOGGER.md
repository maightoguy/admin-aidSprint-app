# Logger Toggle

The app now has a shared frontend logger at:

- `src/lib/logger.ts`

## How to switch logs on or off

Open `src/lib/logger.ts` and change this value:

```ts
export const LOGGING_ENABLED = true;
```

Use:

- `true` to enable logs
- `false` to disable logs

## Example

```ts
import { createLogger } from "@/lib/logger";

const logger = createLogger("Overview");

logger.info("Loaded live overview data");
logger.error("Failed to load overview data", error);
```

When `LOGGING_ENABLED` is set to `false`, all logger calls become no-ops.
