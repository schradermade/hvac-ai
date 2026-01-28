import type { Telemetry, TelemetryEvent } from '../../../llm-core/telemetry/types';

export function createConsoleTelemetry(options?: {
  prefix?: string;
  includePayload?: boolean;
}): Telemetry {
  const prefix = options?.prefix ?? '[llm]';
  const includePayload = options?.includePayload ?? true;

  return {
    emit(event: TelemetryEvent) {
      const message = `${prefix} ${event.name} requestId=${event.requestId}`;
      if (includePayload) {
        console.log(message, event.payload ?? {});
      } else {
        console.log(message);
      }
    },
  };
}
