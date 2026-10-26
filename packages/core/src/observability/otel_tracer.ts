/**
 * OpenRev OpenTelemetry Observability Engine
 * 
 * Instruments reverse engineering workflows, provider executions, tool calls,
 * and memory trace events with semantic OpenTelemetry distributed spans.
 * Compatible with Langfuse, Datadog, Honeycomb, and local OpenRev SQLite audit trails.
 */

export interface OtelSpanAttributeValue {
  [key: string]: string | number | boolean | undefined;
}

export interface OtelSpanRecord {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: 'INTERNAL' | 'CLIENT' | 'SERVER' | 'PRODUCER';
  startTimeMs: number;
  endTimeMs?: number;
  durationMs?: number;
  status: 'UNSET' | 'OK' | 'ERROR';
  statusMessage?: string;
  attributes: Record<string, string | number | boolean>;
  events: Array<{ name: string; timestampMs: number; attributes?: Record<string, any> }>;
}

export class AgentOtelTracer {
  private activeSpans: Map<string, OtelSpanRecord> = new Map();
  private completedSpans: OtelSpanRecord[] = [];
  private currentTraceId: string;

  constructor(traceId?: string) {
    this.currentTraceId = traceId ?? `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public get traceId(): string {
    return this.currentTraceId;
  }

  /**
   * Starts a new OpenTelemetry-compliant execution span.
   */
  public startSpan(name: string, parentSpanId?: string, initialAttributes: Record<string, any> = {}): string {
    const spanId = `span_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const span: OtelSpanRecord = {
      traceId: this.currentTraceId,
      spanId,
      parentSpanId,
      name,
      kind: 'INTERNAL',
      startTimeMs: Date.now(),
      status: 'UNSET',
      attributes: {
        'gen_ai.system': 'openrev',
        'openrev.version': '0.1.0-alpha.2',
        ...initialAttributes
      },
      events: []
    };

    this.activeSpans.set(spanId, span);
    return spanId;
  }

  /**
   * Attaches semantic attributes to an active span.
   */
  public setAttribute(spanId: string, key: string, value: string | number | boolean): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.attributes[key] = value;
    }
  }

  /**
   * Adds an instant telemetry event to a span.
   */
  public addEvent(spanId: string, eventName: string, attributes?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.events.push({
        name: eventName,
        timestampMs: Date.now(),
        attributes
      });
    }
  }

  /**
   * Ends an active span with status and duration.
   */
  public endSpan(spanId: string, status: 'OK' | 'ERROR' = 'OK', statusMessage?: string): OtelSpanRecord | undefined {
    const span = this.activeSpans.get(spanId);
    if (!span) return undefined;

    span.endTimeMs = Date.now();
    span.durationMs = span.endTimeMs - span.startTimeMs;
    span.status = status;
    if (statusMessage) span.statusMessage = statusMessage;

    this.activeSpans.delete(spanId);
    this.completedSpans.push(span);
    return span;
  }

  public getCompletedSpans(): OtelSpanRecord[] {
    return [...this.completedSpans];
  }

  public exportTraceJson(): string {
    return JSON.stringify({
      traceId: this.currentTraceId,
      spansCount: this.completedSpans.length,
      spans: this.completedSpans
    }, null, 2);
  }
}
