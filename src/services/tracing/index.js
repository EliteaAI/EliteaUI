/**
 * Tracing Service
 *
 * Provides distributed tracing capabilities using OpenTelemetry.
 * Traces are sent to Jaeger via the backend OTLP proxy.
 */

export {
  traceService,
  generateTraceId,
  generateTraceparent,
  generateW3CTraceId,
  generateW3CSpanId,
  parseTraceparent,
} from './TraceService';
export { useTracing, withTracing } from './useTracing';
