/**
 * OpenRev Event Store & Typed Audit Trail Engine
 * 
 * Records all system, tool, and user events for replay, auditing, and debugging.
 */

export interface SystemEvent {
  id: string;
  timestamp: string;
  topic: string;
  source: string;
  payload: Record<string, any>;
}

export class EventStore {
  private events: SystemEvent[] = [];
  private listeners: Map<string, Array<(event: SystemEvent) => void>> = new Map();

  public publish(topic: string, source: string, payload: Record<string, any>): SystemEvent {
    const event: SystemEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      topic,
      source,
      payload
    };

    this.events.push(event);

    const topicListeners = this.listeners.get(topic) || [];
    topicListeners.forEach((fn) => fn(event));

    console.log(`[EventStore] Event published [${topic}] from ${source}`);
    return event;
  }

  public subscribe(topic: string, callback: (event: SystemEvent) => void): void {
    const topicListeners = this.listeners.get(topic) || [];
    topicListeners.push(callback);
    this.listeners.set(topic, topicListeners);
  }

  public getHistory(topicFilter?: string): SystemEvent[] {
    if (!topicFilter) return [...this.events];
    return this.events.filter((e) => e.topic === topicFilter);
  }
}
