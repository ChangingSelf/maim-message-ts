/**
 * maim_message - WebSocket 客户端 API (API-Server Version)
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

import { APIMessageBase } from './api-message-base';
import { WebSocketClientConnection } from './ws-connection';
import { ClientConfig } from './ws-config';

/**
 * 连接信息
 */
export class ConnectionInfo {
  id: string;
  url: string;
  apiKey: string;
  platform: string;
  token?: string;
  sslVerify?: string;

  constructor(id: string, url: string, apiKey: string, platform: string, token?: string, sslVerify?: string) {
    this.id = id;
    this.url = url;
    this.apiKey = apiKey;
    this.platform = platform;
    this.token = token;
    this.sslVerify = sslVerify;
  }
}

/**
 * WebSocket 客户端 (API-Server Version)
 * 支持多连接模式和智能路由
 */
export class WebSocketClient {
  private mainConfig: ClientConfig;
  private mainConnection?: WebSocketClientConnection;
  private connections: Map<string, WebSocketClientConnection> = new Map();
  private connectionInfos: Map<string, ConnectionInfo> = new Map();
  private messageHandlers: Array<(message: APIMessageBase) => void | Promise<void>> = [];
  private customMessageHandlers: Map<string, Array<(message: any) => void | Promise<void>>> = new Map();

  constructor(config: ClientConfig) {
    this.mainConfig = config;
  }

  /**
   * 处理接收到的消息
   */
  private async handleIncomingMessage(messageData: any): Promise<void> {
    try {
      // 判断是否为自定义消息
      if (messageData.is_custom_message || messageData.message_type_name) {
        const messageTypeName = messageData.message_type_name;
        if (messageTypeName && this.customMessageHandlers.has(messageTypeName)) {
          const handlers = this.customMessageHandlers.get(messageTypeName)!;
          for (const handler of handlers) {
            try {
              const result = handler(messageData);
              if (result instanceof Promise) {
                await result;
              }
            } catch (error) {
              console.error(`处理自定义消息类型 ${messageTypeName} 时出错:`, error);
            }
          }
          return;
        }
      }

      // 处理标准消息
      const message = APIMessageBase.fromDict(messageData);
      for (const handler of this.messageHandlers) {
        try {
          const result = handler(message);
          if (result instanceof Promise) {
            await result;
          }
        } catch (error) {
          console.error('处理消息时出错:', error);
        }
      }
    } catch (error) {
      console.error('解析消息时出错:', error);
    }
  }

  /**
   * 注册消息处理器
   */
  registerMessageHandler(handler: (message: APIMessageBase) => void | Promise<void>): void {
    if (!this.messageHandlers.includes(handler)) {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * 注册自定义消息处理器
   */
  registerCustomMessageHandler(messageTypeName: string, handler: (message: any) => void | Promise<void>): void {
    if (!this.customMessageHandlers.has(messageTypeName)) {
      this.customMessageHandlers.set(messageTypeName, []);
    }

    const handlers = this.customMessageHandlers.get(messageTypeName)!;
    if (!handlers.includes(handler)) {
      handlers.push(handler);
    }
  }

  /**
   * 启动客户端
   */
  async start(): Promise<void> {
    // 创建主连接
    this.mainConnection = new WebSocketClientConnection();
    this.mainConnection.registerMessageHandler(message => this.handleIncomingMessage(message));
    await this.mainConnection.configure(this.mainConfig.url, this.mainConfig.platform, this.mainConfig.token, this.mainConfig.sslVerify);
    await this.mainConnection.start();

    console.log('WebSocket 客户端已启动');
  }

  /**
   * 添加连接
   */
  async addConnection(url: string, apiKey: string, platform: string, token?: string, sslVerify?: string): Promise<string> {
    const connectionId = `${apiKey}_${platform}`;

    const connectionInfo = new ConnectionInfo(connectionId, url, apiKey, platform, token, sslVerify);

    this.connectionInfos.set(connectionId, connectionInfo);

    return connectionId;
  }

  /**
   * 连接到指定连接
   */
  async connectTo(connectionId: string): Promise<void> {
    const connectionInfo = this.connectionInfos.get(connectionId);
    if (!connectionInfo) {
      throw new Error(`未找到连接信息: ${connectionId}`);
    }

    const connection = new WebSocketClientConnection();
    connection.registerMessageHandler(message => this.handleIncomingMessage(message));
    await connection.configure(connectionInfo.url, connectionInfo.platform, connectionInfo.token, connectionInfo.sslVerify);
    await connection.start();

    this.connections.set(connectionId, connection);
    console.log(`已连接到: ${connectionId}`);
  }

  /**
   * 智能路由发送（自动选择连接）
   */
  async sendMessage(message: APIMessageBase): Promise<boolean> {
    const apiKey = message.getApiKey();
    const platform = message.getPlatform();
    const connectionId = `${apiKey}_${platform}`;

    // 尝试使用对应的连接
    const connection = this.connections.get(connectionId);
    if (connection) {
      return await connection.sendMessage(message.toDict());
    }

    // 使用主连接
    if (this.mainConnection) {
      return await this.mainConnection.sendMessage(message.toDict());
    }

    throw new Error('没有可用的连接');
  }

  /**
   * 发送自定义消息（通过主连接发送）
   */
  async sendCustomMessage(messageTypeName: string, message: Record<string, any>): Promise<boolean> {
    if (!this.mainConnection) {
      throw new Error('主连接未建立');
    }

    const fullMessage = {
      platform: this.mainConfig.platform,
      message_type_name: messageTypeName,
      content: message,
      timestamp: Date.now() / 1000,
      is_custom_message: true,
    };

    return await this.mainConnection.sendMessage(fullMessage);
  }

  /**
   * 通过指定连接发送消息
   */
  async sendMessageViaConnection(connectionId: string, message: APIMessageBase): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`未找到连接: ${connectionId}`);
    }

    return await connection.sendMessage(message.toDict());
  }

  /**
   * 停止客户端
   */
  async stop(): Promise<void> {
    // 停止主连接
    if (this.mainConnection) {
      await this.mainConnection.stop();
      this.mainConnection = undefined;
    }

    // 停止所有连接
    for (const connection of this.connections.values()) {
      await connection.stop();
    }
    this.connections.clear();

    console.log('WebSocket 客户端已停止');
  }

  /**
   * 获取配置
   */
  getConfig(): ClientConfig {
    return this.mainConfig;
  }

  /**
   * 获取所有连接信息
   */
  getConnectionInfos(): ConnectionInfo[] {
    return Array.from(this.connectionInfos.values());
  }
}
