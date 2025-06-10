import { io, Socket } from 'socket.io-client';

// Define interfaces locally to avoid import issues
interface DiagramNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: any;
  selected?: boolean;
  [key: string]: any;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  data?: any;
  [key: string]: any;
}

interface WebSocketEvents {
  // Diagram events
  'diagram:update': (data: { diagramId: string; nodes: DiagramNode[]; edges: DiagramEdge[] }) => void;
  'diagram:node:add': (data: { diagramId: string; node: DiagramNode }) => void;
  'diagram:node:update': (data: { diagramId: string; node: DiagramNode }) => void;
  'diagram:node:delete': (data: { diagramId: string; nodeId: string }) => void;
  'diagram:edge:add': (data: { diagramId: string; edge: DiagramEdge }) => void;
  'diagram:edge:update': (data: { diagramId: string; edge: DiagramEdge }) => void;
  'diagram:edge:delete': (data: { diagramId: string; edgeId: string }) => void;
  
  // Collaboration events
  'user:joined': (data: { userId: string; userName: string; diagramId: string }) => void;
  'user:left': (data: { userId: string; diagramId: string }) => void;
  'user:cursor:move': (data: { userId: string; x: number; y: number }) => void;
  'user:selection:change': (data: { userId: string; selectedNodes: string[]; selectedEdges: string[] }) => void;
  
  // Comment events
  'comment:add': (data: { diagramId: string; comment: Comment }) => void;
  'comment:update': (data: { diagramId: string; comment: Comment }) => void;
  'comment:delete': (data: { diagramId: string; commentId: string }) => void;
  
  // Lock events
  'element:lock': (data: { elementId: string; userId: string; type: 'node' | 'edge' }) => void;
  'element:unlock': (data: { elementId: string; type: 'node' | 'edge' }) => void;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  position?: { x: number; y: number };
  resolved?: boolean;
  replies?: Comment[];
}

interface CollaboratorCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<keyof WebSocketEvents, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentDiagramId: string | null = null;
  private collaborators: Map<string, CollaboratorCursor> = new Map();
  
  constructor() {
    // Initialize event listeners map
    const events: (keyof WebSocketEvents)[] = [
      'diagram:update',
      'diagram:node:add',
      'diagram:node:update',
      'diagram:node:delete',
      'diagram:edge:add',
      'diagram:edge:update',
      'diagram:edge:delete',
      'user:joined',
      'user:left',
      'user:cursor:move',
      'user:selection:change',
      'comment:add',
      'comment:update',
      'comment:delete',
      'element:lock',
      'element:unlock'
    ];
    
    events.forEach(event => {
      this.listeners.set(event, new Set());
    });
  }
  
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }
      
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      
      this.socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });
      
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, attempt to reconnect
          this.socket?.connect();
        }
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to WebSocket server'));
        }
      });
      
      // Set up event listeners
      this.setupEventListeners();
    });
  }
  
  private setupEventListeners() {
    if (!this.socket) return;
    
    // Diagram events
    this.socket.on('diagram:update', (data) => this.emit('diagram:update', data));
    this.socket.on('diagram:node:add', (data) => this.emit('diagram:node:add', data));
    this.socket.on('diagram:node:update', (data) => this.emit('diagram:node:update', data));
    this.socket.on('diagram:node:delete', (data) => this.emit('diagram:node:delete', data));
    this.socket.on('diagram:edge:add', (data) => this.emit('diagram:edge:add', data));
    this.socket.on('diagram:edge:update', (data) => this.emit('diagram:edge:update', data));
    this.socket.on('diagram:edge:delete', (data) => this.emit('diagram:edge:delete', data));
    
    // Collaboration events
    this.socket.on('user:joined', (data) => {
      const color = this.generateUserColor(data.userId);
      this.collaborators.set(data.userId, {
        userId: data.userId,
        userName: data.userName,
        x: 0,
        y: 0,
        color
      });
      this.emit('user:joined', data);
    });
    
    this.socket.on('user:left', (data) => {
      this.collaborators.delete(data.userId);
      this.emit('user:left', data);
    });
    
    this.socket.on('user:cursor:move', (data) => {
      const collaborator = this.collaborators.get(data.userId);
      if (collaborator) {
        collaborator.x = data.x;
        collaborator.y = data.y;
      }
      this.emit('user:cursor:move', data);
    });
    
    this.socket.on('user:selection:change', (data) => this.emit('user:selection:change', data));
    
    // Comment events
    this.socket.on('comment:add', (data) => this.emit('comment:add', data));
    this.socket.on('comment:update', (data) => this.emit('comment:update', data));
    this.socket.on('comment:delete', (data) => this.emit('comment:delete', data));
    
    // Lock events
    this.socket.on('element:lock', (data) => this.emit('element:lock', data));
    this.socket.on('element:unlock', (data) => this.emit('element:unlock', data));
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.collaborators.clear();
    this.currentDiagramId = null;
  }
  
  joinDiagram(diagramId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    
    // Leave current diagram if any
    if (this.currentDiagramId) {
      this.leaveDiagram();
    }
    
    this.currentDiagramId = diagramId;
    this.socket.emit('diagram:join', { diagramId });
  }
  
  leaveDiagram() {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('diagram:leave', { diagramId: this.currentDiagramId });
    this.currentDiagramId = null;
    this.collaborators.clear();
  }
  
  // Emit events to server
  updateNode(node: DiagramNode) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('diagram:node:update', {
      diagramId: this.currentDiagramId,
      node
    });
  }
  
  addNode(node: DiagramNode) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('diagram:node:add', {
      diagramId: this.currentDiagramId,
      node
    });
  }
  
  deleteNode(nodeId: string) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('diagram:node:delete', {
      diagramId: this.currentDiagramId,
      nodeId
    });
  }
  
  updateEdge(edge: DiagramEdge) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('diagram:edge:update', {
      diagramId: this.currentDiagramId,
      edge
    });
  }
  
  addEdge(edge: DiagramEdge) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('diagram:edge:add', {
      diagramId: this.currentDiagramId,
      edge
    });
  }
  
  deleteEdge(edgeId: string) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('diagram:edge:delete', {
      diagramId: this.currentDiagramId,
      edgeId
    });
  }
  
  updateCursorPosition(x: number, y: number) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('user:cursor:move', { x, y });
  }
  
  updateSelection(selectedNodes: string[], selectedEdges: string[]) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('user:selection:change', { selectedNodes, selectedEdges });
  }
  
  lockElement(elementId: string, type: 'node' | 'edge') {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('element:lock', { elementId, type });
  }
  
  unlockElement(elementId: string, type: 'node' | 'edge') {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('element:unlock', { elementId, type });
  }
  
  addComment(comment: Omit<Comment, 'id'>) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('comment:add', {
      diagramId: this.currentDiagramId,
      comment: {
        ...comment,
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
  }
  
  updateComment(comment: Comment) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('comment:update', {
      diagramId: this.currentDiagramId,
      comment
    });
  }
  
  deleteComment(commentId: string) {
    if (!this.socket?.connected || !this.currentDiagramId) return;
    
    this.socket.emit('comment:delete', {
      diagramId: this.currentDiagramId,
      commentId
    });
  }
  
  // Event subscription
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }
  
  off<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  private emit<K extends keyof WebSocketEvents>(event: K, data: Parameters<WebSocketEvents[K]>[0]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data as any));
    }
  }
  
  // Helper methods
  getCollaborators(): CollaboratorCursor[] {
    return Array.from(this.collaborators.values());
  }
  
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    
    // Generate consistent color based on userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
  
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
