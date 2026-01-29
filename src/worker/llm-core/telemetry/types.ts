export interface TelemetryEvent {
  name: string;
  requestId: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
}

export interface Telemetry {
  emit: (event: TelemetryEvent) => void;
}
