import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws'; // Cập nhật port backend nếu cần

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
  }

  connect(onConnect, onError) {
    if (this.client && this.client.connected) {
      if (onConnect) onConnect();
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('Connected to WebSocket');
      if (onConnect) onConnect();
      
      // Khôi phục các subscriptions sau khi reconnect
      this.subscriptions.forEach((callback, topic) => {
        this.client.subscribe(topic, (message) => {
          callback(JSON.parse(message.body));
        });
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
      console.log('Disconnected from WebSocket');
    }
  }

  subscribe(topic, callback) {
    // Lưu callback để reconnect
    this.subscriptions.set(topic, callback);
    
    if (this.client && this.client.connected) {
      return this.client.subscribe(topic, (message) => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  }

  unsubscribe(topic) {
    this.subscriptions.delete(topic);
    // STOMPjs handles actual unsubscription internally or we can keep the reference returned by subscribe() if needed
  }
}

export const webSocketService = new WebSocketService();
