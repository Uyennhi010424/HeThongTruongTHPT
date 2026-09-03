import { Client } from '@stomp/stompjs';
import { SOCKET_URL } from '@/constants/config';

class WebSocketService {
  client: Client | null = null;
  subscriptions = new Map<string, Function>();

  connect(onConnect?: () => void, onError?: (err: any) => void) {
    if (this.client && this.client.connected) {
      if (onConnect) onConnect();
      return;
    }

    this.client = new Client({
      brokerURL: SOCKET_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
    });

    this.client.onConnect = () => {
      console.log('Connected to STOMP WebSocket');
      if (onConnect) onConnect();
      
      // Resubscribe on reconnect
      this.subscriptions.forEach((callback, topic) => {
        this.client?.subscribe(topic, (message) => {
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

  subscribe(topic: string, callback: (msg: any) => void) {
    this.subscriptions.set(topic, callback);
    
    if (this.client && this.client.connected) {
      return this.client.subscribe(topic, (message) => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  }

  unsubscribe(topic: string) {
    this.subscriptions.delete(topic);
  }
}

export const webSocketService = new WebSocketService();
