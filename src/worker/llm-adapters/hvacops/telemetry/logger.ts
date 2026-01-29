import type { Telemetry, TelemetryEvent } from '../../../llm-core/telemetry/types';

export function createConsoleTelemetry(options?: {
  prefix?: string;
  includePayload?: boolean;
}): Telemetry {
  const prefix = options?.prefix ?? '[llm]';
  const includePayload = options?.includePayload ?? true;

  return {
    emit(event: TelemetryEvent) {
      const payload = includePayload ? (event.payload ?? {}) : undefined;
      const output = {
        name: event.name,
        requestId: event.requestId,
        timestamp: event.timestamp ?? new Date().toISOString(),
        ...(payload ? { payload } : {}),
      };
      console.log(`${prefix} ${JSON.stringify(output)}`);
    },
  };
}
