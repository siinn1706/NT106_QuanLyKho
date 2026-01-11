// src/services/rt_ws_client.ts
/**
 * Singleton WebSocket client for realtime user-to-user chat.
 * Manages connection, reconnect, heartbeat, and event queue.
 */

import { useAuthStore } from '../state/auth_store';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const WS_URL = BASE_URL.replace(/^http/, 'ws');

type EventHandler = (data: any) => void;
type EventType = 
  | 'server:hello'
  | 'msg:ack'
  | 'msg:new'
  | 'msg:delivered'
  | 'msg:read'
  | 'msg:edit'
  | 'msg:edit:ack'
  | 'msg:delete'
  | 'msg:delete:ack'
  | 'msg:react'
  | 'msg:react:ack'
  | 'msg:pinned'
  | 'msg:unpinned'
  | 'typing'
  | 'conv:sync:result'
  | 'conv:upsert'
  | 'conv:rejected'
  | 'inventory:updated'
  | 'error'
  | 'ping';

interface QueuedEvent {
  type: string;
  reqId: string;
  data: any;
}

class RealtimeWSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private heartbeatIntervalMs = 30000;
  private eventHandlers: Map<EventType, Set<EventHandler>> = new Map();
  private eventQueue: QueuedEvent[] = [];
  private isConnecting = false;
  private isManualClose = false;
  
  constructor() {
    this.url = `${WS_URL}/ws/rt`;
  }
  
  connect(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[RT-WS] Already connected');
      return;
    }
    
    if (this.isConnecting) {
      console.log('[RT-WS] Connection in progress');
      return;
    }
    
    this.isConnecting = true;
    this.isManualClose = false;
    this.token = token;
    
    const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
    console.log('[RT-WS] Connecting to:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[RT-WS] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startHeartbeat();
        this.flushQueue();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('[RT-WS] Failed to parse message:', e);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[RT-WS] WebSocket error:', error);
      };
      
      this.ws.onclose = (event) => {
        console.log('[RT-WS] Connection closed:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        
        if (!this.isManualClose && this.token) {
          this.scheduleReconnect();
        }
      };
    } catch (e) {
      console.error('[RT-WS] Failed to create WebSocket:', e);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }
  
  disconnect() {
    console.log('[RT-WS] Manual disconnect');
    this.isManualClose = true;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.token = null;
    this.reconnectAttempts = 0;
    this.eventQueue = [];
  }
  
  private scheduleReconnect() {
    if (this.isManualClose || !this.token) return;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[RT-WS] Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`[RT-WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isManualClose && this.token) {
        this.connect(this.token);
      }
    }, delay);
  }
  
  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'pong', reqId: '', data: {} });
      }
    }, this.heartbeatIntervalMs);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private handleMessage(message: any) {
    const { type, data } = message;
    
    if (type === 'ping') {
      this.send({ type: 'pong', reqId: '', data: {} });
      return;
    }
    
    if (type === 'server:hello') {
      const { heartbeatIntervalMs } = data;
      if (heartbeatIntervalMs) {
        this.heartbeatIntervalMs = heartbeatIntervalMs;
        this.startHeartbeat();
      }
    }
    
    const handlers = this.eventHandlers.get(type as EventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (e) {
          console.error(`[RT-WS] Error in handler for ${type}:`, e);
        }
      });
    }
  }
  
  send(event: { type: string; reqId: string; data: any }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('[RT-WS] Not connected, queueing event:', event.type);
      this.eventQueue.push(event as QueuedEvent);
    }
  }
  
  private flushQueue() {
    if (this.eventQueue.length === 0) return;
    
    console.log(`[RT-WS] Flushing ${this.eventQueue.length} queued events`);
    
    const queue = [...this.eventQueue];
    this.eventQueue = [];
    
    queue.forEach(event => this.send(event));
  }
  
  on(eventType: EventType, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);
  }
  
  off(eventType: EventType, handler: EventHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  
  getStatus(): 'connecting' | 'open' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      default:
        return 'closed';
    }
  }
}

export const rtWSClient = new RealtimeWSClient();

// Auto-connect when auth token changes
useAuthStore.subscribe((state, prevState) => {
  if (state.token && state.token !== prevState.token) {
    console.log('[RT-WS] Auth token changed, connecting...');
    rtWSClient.connect(state.token);
  } else if (!state.token && prevState.token) {
    console.log('[RT-WS] Auth token removed, disconnecting...');
    rtWSClient.disconnect();
  }
});

// Connect immediately if already logged in
const token = useAuthStore.getState().token;
if (token) {
  rtWSClient.connect(token);
}
