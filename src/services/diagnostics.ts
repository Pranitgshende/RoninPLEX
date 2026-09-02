export type DiagnosticCategory =
  | 'startup'
  | 'network'
  | 'playback'
  | 'provider'
  | 'trailer'
  | 'persistence'
  | 'navigation'
  | 'unexpected';

export type DiagnosticSeverity = 'info' | 'warn' | 'error';

export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  message: string;
  context?: Record<string, any>;
}

const MAX_EVENTS = 100;
const SENSITIVE_KEYS = ['apikey', 'key', 'token', 'authorization', 'cookie', 'secret', 'password'];

class DiagnosticsStore {
  private events: DiagnosticEvent[] = [];
  private listeners: Set<() => void> = new Set();

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;
    
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
           sanitized[key] = value.map(v => typeof v === 'object' ? this.sanitizeContext(v) : v);
        } else if (value instanceof Error) {
           sanitized[key] = { message: value.message, name: value.name };
        } else {
           // Shallow sanitize for nested objects to prevent deep recursion
           sanitized[key] = this.sanitizeContext(value);
        }
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  public log(category: DiagnosticCategory, severity: DiagnosticSeverity, message: string, context?: Record<string, any>) {
    const event: DiagnosticEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      severity,
      message,
      context: this.sanitizeContext(context)
    };

    this.events.unshift(event);
    
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(0, MAX_EVENTS);
    }

    if (severity === 'error') {
      console.error(`[RoninPLEX ${category}] ${message}`, event.context || '');
    } else if (severity === 'warn') {
      console.warn(`[RoninPLEX ${category}] ${message}`, event.context || '');
    } else {
      console.log(`[RoninPLEX ${category}] ${message}`, event.context || '');
    }

    this.notify();
  }

  public info(category: DiagnosticCategory, message: string, context?: Record<string, any>) {
    this.log(category, 'info', message, context);
  }

  public warn(category: DiagnosticCategory, message: string, context?: Record<string, any>) {
    this.log(category, 'warn', message, context);
  }

  public error(category: DiagnosticCategory, message: string, context?: Record<string, any>) {
    this.log(category, 'error', message, context);
  }

  public getEvents(): DiagnosticEvent[] {
    return [...this.events];
  }

  public clear() {
    this.events = [];
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

export const diagnostics = new DiagnosticsStore();
