/**
 * maim_message - WebSocket 服务器 API (API-Server Version)
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

import { APIMessageBase } from './api-message-base';
import { WebSocketServerConnection } from './ws-connection';
import { ServerConfig } from './ws-config';

/**
 * WebSocket 服务器 (API-Server Version)
 */
export class WebSocketServer {
  private config: ServerConfig;
  private connection: WebSocketServerConnection;
  private messageHandlers: Array<(message: APIMessageBase) => void | Promise<void>> = [];
  private customMessageHandlers: Map<string, Array<(message: any) => void | Promise<void>>> = new Map();

  constructor(config: ServerConfig) {
    this.config = config;

    // 创建 WebSocket 连接
    this.connection = new WebSocketServerConnection(config.host, config.port, config.path, config.sslCertfile, config.sslKeyfile, config.enableToken);

    // 注册消息处理器
    this.connection.registerMessageHandler(message => this.handleIncomingMessage(message));
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
   * 添加有效token
   */
  addValidToken(token: string): void {
    this.connection.addValidToken(token);
  }

  /**
   * 移除有效token
   */
  removeValidToken(token: string): void {
    this.connection.removeValidToken(token);
  }

  /**
   * 发送消息（从消息中自动获取路由信息）
   */
  async sendMessage(message: APIMessageBase): Promise<boolean> {
    const platform = message.getPlatform();
    return await this.connection.sendMessage(platform, message.toDict());
  }

  /**
   * 发送自定义消息
   */
  async sendCustomMessage(platform: string, messageTypeName: string, message: Record<string, any>): Promise<boolean> {
    const fullMessage = {
      platform: platform,
      message_type_name: messageTypeName,
      content: message,
      timestamp: Date.now() / 1000,
      is_custom_message: true,
    };
    return await this.connection.sendMessage(platform, fullMessage);
  }

  /**
   * 广播消息给所有连接的客户端
   */
  async broadcastMessage(message: Record<string, any>): Promise<void> {
    await this.connection.broadcastMessage(message);
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    await this.connection.start();
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    await this.connection.stop();
  }

  /**
   * 获取配置
   */
  getConfig(): ServerConfig {
    return this.config;
  }
}
