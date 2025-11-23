/**
 * maim_message - WebSocket 连接实现
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

import WebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import { EventEmitter } from 'events';

/**
 * WebSocket 客户端连接
 */
export class WebSocketClientConnection extends EventEmitter {
  private ws?: WebSocket;
  private url: string = '';
  private platform: string = '';
  private token?: string;
  private sslVerify?: string;
  private reconnectInterval: number = 5000;
  private reconnectTimer?: NodeJS.Timeout;
  private isConnected: boolean = false;
  private shouldReconnect: boolean = true;
  private messageHandlers: Array<(message: any) => void | Promise<void>> = [];

  constructor() {
    super();
  }

  /**
   * 配置连接参数
   */
  async configure(url: string, platform: string, token?: string, sslVerify?: string): Promise<void> {
    this.url = url;
    this.platform = platform;
    this.token = token;
    this.sslVerify = sslVerify;
  }

  /**
   * 注册消息处理器
   */
  registerMessageHandler(handler: (message: any) => void | Promise<void>): void {
    if (!this.messageHandlers.includes(handler)) {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * 启动连接
   */
  async start(): Promise<void> {
    await this.connect();
  }

  /**
   * 连接到服务器
   */
  private async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const options: WebSocket.ClientOptions = {};

      // SSL 证书验证
      if (this.sslVerify && this.url.startsWith('wss://')) {
        options.ca = fs.readFileSync(this.sslVerify);
      }

      // 添加 token 到 URL
      let connectUrl = this.url;
      if (this.token) {
        const separator = this.url.includes('?') ? '&' : '?';
        connectUrl = `${this.url}${separator}token=${this.token}`;
      }

      // 添加 platform 到 URL
      const separator = connectUrl.includes('?') ? '&' : '?';
      connectUrl = `${connectUrl}${separator}platform=${this.platform}`;

      const ws = new WebSocket(connectUrl, options);
      this.ws = ws;

      ws.on('open', () => {
        this.isConnected = true;
        console.log(`WebSocket 客户端已连接到 ${this.url} (平台: ${this.platform})`);
        this.emit('connected');
      });

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(message);
        } catch (error) {
          console.error('处理消息时出错:', error);
        }
      });

      ws.on('close', () => {
        this.isConnected = false;
        console.log(`WebSocket 连接已关闭 (平台: ${this.platform})`);
        this.emit('disconnected');

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      });

      ws.on('error', (error: Error) => {
        console.error(`WebSocket 错误 (平台: ${this.platform}):`, error);
        this.emit('error', error);
      });
    } catch (error) {
      console.error('连接失败:', error);
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessage(message: any): Promise<void> {
    for (const handler of this.messageHandlers) {
      try {
        const result = handler(message);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error('消息处理器出错:', error);
      }
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      console.log(`尝试重新连接... (平台: ${this.platform})`);
      await this.connect();
    }, this.reconnectInterval);
  }

  /**
   * 发送消息
   * @param message - 要发送的消息对象
   */
  async sendMessage(message: any): Promise<boolean> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket 未连接');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('发送消息失败:', error);
      return false;
    }
  }

  /**
   * 检查连接状态
   */
  isConnectedStatus(): boolean {
    return this.isConnected && this.ws !== undefined && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 停止连接
   */
  async stop(): Promise<void> {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    this.isConnected = false;
  }
}

/**
 * WebSocket 服务器连接
 */
export class WebSocketServerConnection extends EventEmitter {
  private server?: http.Server | https.Server;
  private wss?: WebSocket.Server;
  private host: string;
  private port: number;
  private path: string;
  private sslCertfile?: string;
  private sslKeyfile?: string;
  private enableToken: boolean;
  private validTokens: Set<string> = new Set();
  private clients: Map<string, Set<WebSocket>> = new Map();
  private messageHandlers: Array<(message: any) => void | Promise<void>> = [];

  constructor(
    host: string = '0.0.0.0',
    port: number = 18000,
    path: string = '/ws',
    sslCertfile?: string,
    sslKeyfile?: string,
    enableToken: boolean = false,
  ) {
    super();
    this.host = host;
    this.port = port;
    this.path = path;
    this.sslCertfile = sslCertfile;
    this.sslKeyfile = sslKeyfile;
    this.enableToken = enableToken;
  }

  /**
   * 注册消息处理器
   */
  registerMessageHandler(handler: (message: any) => void | Promise<void>): void {
    if (!this.messageHandlers.includes(handler)) {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * 添加有效token
   */
  addValidToken(token: string): void {
    this.validTokens.add(token);
  }

  /**
   * 移除有效token
   */
  removeValidToken(token: string): void {
    this.validTokens.delete(token);
  }

  /**
   * 验证token
   */
  async verifyToken(token: string): Promise<boolean> {
    return !this.enableToken || this.validTokens.has(token);
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    // 创建 HTTP/HTTPS 服务器
    if (this.sslCertfile && this.sslKeyfile) {
      const options = {
        cert: fs.readFileSync(this.sslCertfile),
        key: fs.readFileSync(this.sslKeyfile),
      };
      this.server = https.createServer(options);
    } else {
      this.server = http.createServer();
    }

    // 创建 WebSocket 服务器
    this.wss = new WebSocket.Server({
      server: this.server,
      path: this.path,
    });

    this.wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
      await this.handleConnection(ws, req);
    });

    // 启动服务器
    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, this.host, () => {
        const protocol = this.sslCertfile ? 'wss' : 'ws';
        console.log(`WebSocket 服务器启动成功: ${protocol}://${this.host}:${this.port}${this.path}`);
        resolve();
      });

      this.server!.on('error', error => {
        reject(error);
      });
    });
  }

  /**
   * 处理新连接
   */
  private async handleConnection(ws: WebSocket, req: http.IncomingMessage): Promise<void> {
    // 从 URL 中提取参数
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const platform = url.searchParams.get('platform') || 'unknown';

    // 验证 token
    if (this.enableToken && token) {
      const isValid = await this.verifyToken(token);
      if (!isValid) {
        ws.close(1008, 'Invalid token');
        return;
      }
    }

    console.log(`新客户端连接 (平台: ${platform})`);

    // 将客户端添加到对应平台的集合中
    if (!this.clients.has(platform)) {
      this.clients.set(platform, new Set());
    }
    this.clients.get(platform)!.add(ws);

    // 处理消息
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(message);
      } catch (error) {
        console.error('处理消息时出错:', error);
      }
    });

    // 处理连接关闭
    ws.on('close', () => {
      console.log(`客户端断开连接 (平台: ${platform})`);
      const platformClients = this.clients.get(platform);
      if (platformClients) {
        platformClients.delete(ws);
        if (platformClients.size === 0) {
          this.clients.delete(platform);
        }
      }
    });

    // 处理错误
    ws.on('error', error => {
      console.error(`客户端错误 (平台: ${platform}):`, error);
    });
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessage(message: any): Promise<void> {
    for (const handler of this.messageHandlers) {
      try {
        const result = handler(message);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error('消息处理器出错:', error);
      }
    }
  }

  /**
   * 发送消息到指定平台
   */
  async sendMessage(platform: string, message: any): Promise<boolean> {
    const platformClients = this.clients.get(platform);
    if (!platformClients || platformClients.size === 0) {
      console.warn(`没有找到平台 ${platform} 的客户端`);
      return false;
    }

    const messageStr = JSON.stringify(message);
    let success = false;

    for (const client of platformClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          success = true;
        } catch (error) {
          console.error('发送消息失败:', error);
        }
      }
    }

    return success;
  }

  /**
   * 广播消息给所有客户端
   */
  async broadcastMessage(message: any): Promise<void> {
    const messageStr = JSON.stringify(message);

    for (const platformClients of this.clients.values()) {
      for (const client of platformClients) {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(messageStr);
          } catch (error) {
            console.error('广播消息失败:', error);
          }
        }
      }
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    // 关闭所有客户端连接
    for (const platformClients of this.clients.values()) {
      for (const client of platformClients) {
        client.close();
      }
    }
    this.clients.clear();

    // 关闭 WebSocket 服务器
    if (this.wss) {
      await new Promise<void>(resolve => {
        this.wss!.close(() => {
          resolve();
        });
      });
      this.wss = undefined;
    }

    // 关闭 HTTP 服务器
    if (this.server) {
      await new Promise<void>(resolve => {
        this.server!.close(() => {
          resolve();
        });
      });
      this.server = undefined;
    }

    console.log('WebSocket 服务器已停止');
  }
}
