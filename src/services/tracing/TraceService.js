/**
 * TraceService - Lightweight tracing service for the UI
 *
 * Collects traces from UI interactions and sends them to the backend
 * for forwarding to Jaeger. Uses W3C Trace Context format for distributed
 * tracing compatibility with OpenTelemetry.
 */
import { v4 as uuidv4 } from 'uuid';

// Configuration
const TRACING_ENABLED = import.meta.env.VITE_TRACING_ENABLED === 'true';
const FLUSH_INTERVAL_MS = 5000; // Send traces every 5 seconds
const MAX_TRACES_PER_FLUSH = 50; // Maximum traces to send in one batch
const OTLP_ENDPOINT = '/api/v2/tracing/prompt_lib/collect';

/**
 * Generate a random hex string of specified length
 * @param {number} length - Number of hex characters
 * @returns {string} Random hex string
 */
const generateHex = length => {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Generate a W3C Trace Context trace ID (32 hex chars = 16 bytes)
 * @returns {string} 32-character hex trace ID
 */
export const generateW3CTraceId = () => {
  return generateHex(32);
};

/**
 * Generate a W3C Trace Context span ID (16 hex chars = 8 bytes)
 * @returns {string} 16-character hex span ID
 */
export const generateW3CSpanId = () => {
  return generateHex(16);
};

/**
 * Generate a W3C traceparent header value
 * Format: {version}-{trace-id}-{span-id}-{trace-flags}
 * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
 *
 * @param {string} traceId - Optional trace ID (32 hex chars), generates new if not provided
 * @param {string} spanId - Optional span ID (16 hex chars), generates new if not provided
 * @param {boolean} sampled - Whether the trace is sampled (default: true)
 * @returns {string} W3C traceparent header value
 */
export const generateTraceparent = (traceId = null, spanId = null, sampled = true) => {
  const version = '00';
  const tId = traceId || generateW3CTraceId();
  const sId = spanId || generateW3CSpanId();
  const flags = sampled ? '01' : '00';
  return `${version}-${tId}-${sId}-${flags}`;
};

/**
 * Parse a traceparent header value
 * @param {string} traceparent - W3C traceparent header value
 * @returns {Object|null} Parsed components or null if invalid
 */
export const parseTraceparent = traceparent => {
  if (!traceparent) return null;
  const parts = traceparent.split('-');
  if (parts.length !== 4) return null;
  const [version, traceId, spanId, flags] = parts;
  if (traceId.length !== 32 || spanId.length !== 16) return null;
  return {
    version,
    traceId,
    spanId,
    sampled: flags === '01',
  };
};

/**
 * Generate a legacy trace ID with UI prefix (for backwards compatibility)
 * Format: ui-{timestamp}-{random}
 * @deprecated Use generateTraceparent() for W3C Trace Context
 */
export const generateTraceId = () => {
  return `ui-${Date.now()}-${uuidv4().slice(0, 8)}`;
};

/**
 * Generate a span ID (legacy format)
 */
const generateSpanId = () => {
  return uuidv4().slice(0, 16);
};

class TraceService {
  constructor() {
    this.enabled = TRACING_ENABLED;
    this.traces = new Map();
    this.completedTraces = [];
    this.flushInterval = null;

    if (this.enabled) {
      this._startFlushInterval();
    }
  }

  /**
   * Start a new trace
   * @param {string} name - Trace name (e.g., 'chat_message', 'load_page')
   * @param {Object} metadata - Additional metadata
   * @returns {string|null} Trace ID or null if tracing disabled
   */
  startTrace(name, metadata = {}) {
    if (!this.enabled) return null;

    const traceId = generateTraceId();
    const trace = {
      trace_id: traceId,
      name,
      started_at: performance.now(),
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        user_agent: navigator.userAgent,
        url: window.location.href,
      },
      spans: [],
      completed: false,
    };

    this.traces.set(traceId, trace);
    return traceId;
  }

  /**
   * Add a span to an existing trace
   * @param {string} traceId - Parent trace ID
   * @param {string} name - Span name
   * @param {Object} metadata - Additional metadata
   * @returns {string|null} Span ID or null
   */
  startSpan(traceId, name, metadata = {}) {
    if (!this.enabled || !traceId) return null;

    const trace = this.traces.get(traceId);
    if (!trace) return null;

    const spanId = generateSpanId();
    const span = {
      span_id: spanId,
      name,
      started_at: performance.now(),
      timestamp: new Date().toISOString(),
      metadata,
      ended_at: null,
      duration_ms: null,
    };

    trace.spans.push(span);
    return spanId;
  }

  /**
   * End a span
   * @param {string} traceId - Parent trace ID
   * @param {string} spanId - Span ID to end
   * @param {Object} metadata - Additional metadata to merge
   */
  endSpan(traceId, spanId, metadata = {}) {
    if (!this.enabled || !traceId || !spanId) return;

    const trace = this.traces.get(traceId);
    if (!trace) return;

    const span = trace.spans.find(s => s.span_id === spanId);
    if (span && !span.ended_at) {
      span.ended_at = performance.now();
      span.duration_ms = span.ended_at - span.started_at;
      span.metadata = { ...span.metadata, ...metadata };
    }
  }

  /**
   * End a span by name (convenience method)
   * @param {string} traceId - Parent trace ID
   * @param {string} name - Span name to end
   * @param {Object} metadata - Additional metadata to merge
   */
  endSpanByName(traceId, name, metadata = {}) {
    if (!this.enabled || !traceId) return;

    const trace = this.traces.get(traceId);
    if (!trace) return;

    // Find the most recent span with this name that hasn't been ended
    const span = [...trace.spans].reverse().find(s => s.name === name && !s.ended_at);
    if (span) {
      span.ended_at = performance.now();
      span.duration_ms = span.ended_at - span.started_at;
      span.metadata = { ...span.metadata, ...metadata };
    }
  }

  /**
   * End a trace and queue it for sending
   * @param {string} traceId - Trace ID to end
   * @param {Object} metadata - Additional metadata to merge
   */
  endTrace(traceId, metadata = {}) {
    if (!this.enabled || !traceId) return;

    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.ended_at = performance.now();
    trace.duration_ms = trace.ended_at - trace.started_at;
    trace.metadata = { ...trace.metadata, ...metadata };
    trace.completed = true;

    // Move to completed queue
    this.completedTraces.push(trace);
    this.traces.delete(traceId);
  }

  /**
   * Get trace ID for an active trace
   * @param {string} traceId - Trace ID
   * @returns {Object|null} Trace object or null
   */
  getTrace(traceId) {
    return this.traces.get(traceId) || null;
  }

  /**
   * Check if tracing is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Start the flush interval
   */
  _startFlushInterval() {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this._flush();
    }, FLUSH_INTERVAL_MS);

    // Also flush on page unload
    window.addEventListener('beforeunload', () => {
      this._flush(true);
    });
  }

  /**
   * Flush completed traces to the backend
   * @param {boolean} sync - Use synchronous request (for beforeunload)
   */
  async _flush(sync = false) {
    if (this.completedTraces.length === 0) return;

    // Take traces to send
    const tracesToSend = this.completedTraces.splice(0, MAX_TRACES_PER_FLUSH);

    try {
      const payload = { traces: tracesToSend };

      if (sync) {
        // Use sendBeacon for synchronous unload
        navigator.sendBeacon(OTLP_ENDPOINT, JSON.stringify(payload));
      } else {
        const response = await fetch(OTLP_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          // Put traces back for retry
          this.completedTraces.unshift(...tracesToSend);
        }
      }
    } catch {
      // Put traces back for retry
      this.completedTraces.unshift(...tracesToSend);
    }
  }

  /**
   * Force flush all traces immediately
   */
  async flush() {
    await this._flush();
  }

  /**
   * Disable tracing (for testing or runtime toggle)
   */
  disable() {
    this.enabled = false;
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Enable tracing
   */
  enable() {
    this.enabled = true;
    this._startFlushInterval();
  }
}

// Singleton instance
export const traceService = new TraceService();

export default traceService;
