import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map(); // Map<topic, Map<id, callback>>
    this.activeSubscriptions = new Map(); // Lưu Stomp Subscription object
    this.connectionQueue = [];
    this.isConnecting = false;
    this.subCounter = 0;
  }

  connect(onConnect, onError) {
    if (this.client && this.client.connected) {
      if (onConnect) onConnect();
      return;
    }

    if (onConnect) this.connectionQueue.push(onConnect);

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('Connected to WebSocket');
      this.isConnecting = false;
      
      // Execute all pending connection callbacks
      const callbacks = [...this.connectionQueue];
      this.connectionQueue = [];
      callbacks.forEach(cb => cb());
      
      // Khôi phục subscriptions
      this.subscriptions.forEach((callbacks, topic) => {
        const sub = this.client.subscribe(topic, (message) => {
          const parsed = JSON.parse(message.body);
          callbacks.forEach(cb => cb(parsed));
        });
        this.activeSubscriptions.set(topic, sub);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      if (onError) onError(frame);
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnecting = false;
      this.activeSubscriptions.clear();
      console.log('Disconnected from WebSocket');
    }
  }

  subscribe(topic, callback) {
    const id = ++this.subCounter;
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Map());
    }
    this.subscriptions.get(topic).set(id, callback);
    
    if (this.client && this.client.connected) {
      if (!this.activeSubscriptions.has(topic)) {
        const sub = this.client.subscribe(topic, (message) => {
          const parsed = JSON.parse(message.body);
          this.subscriptions.get(topic)?.forEach(cb => cb(parsed));
        });
        this.activeSubscriptions.set(topic, sub);
      }
    }
    return id; // Trả về ID để unsubscribe chính xác callback này
  }

  unsubscribe(topic, id) {
    if (id !== undefined) {
      const callbacks = this.subscriptions.get(topic);
      if (callbacks) {
        callbacks.delete(id);
        if (callbacks.size === 0) {
          this.subscriptions.delete(topic);
          const sub = this.activeSubscriptions.get(topic);
          if (sub) {
            sub.unsubscribe();
            this.activeSubscriptions.delete(topic);
          }
        }
      }
    } else {
      // Fallback: xóa toàn bộ nếu không truyền id (không khuyến khích)
      this.subscriptions.delete(topic);
      const sub = this.activeSubscriptions.get(topic);
      if (sub) {
        sub.unsubscribe();
        this.activeSubscriptions.delete(topic);
      }
    }
  }
}

export const webSocketService = new WebSocketService();
