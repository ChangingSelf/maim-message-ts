/**
 * maim_message - API 接口实现（Legacy API）
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

import { MessageBase } from './message-base';
import { WebSocketClientConnection, WebSocketServerConnection } from './ws-connection';

/**
 * 消息处理器基类
 */
class BaseMessageHandler {
  protected messageHandlers: Array<(message: any) => void | Promise<void>> = [];
  protected customMessageHandlers: Map<string, Array<(message: any) => void | Promise<void>>> = new Map();
  protected backgroundTasks: Set<Promise<void>> = new Set();

  /**
   * 注册消息处理函数
   */
  registerMessageHandler(handler: (message: any) => void | Promise<void>): void {
    if (!this.messageHandlers.includes(handler)) {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * 注册自定义消息类型的处理函数
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
   * 处理单条消息
   */
  protected async processMessage(message: Record<string, any>): Promise<void> {
    const tasks: Promise<void>[] = [];

    // 判断是否为自定义消息类型
    let isCustomMessage = false;

    if (message.is_custom_message || message.message_type_name) {
      const messageTypeName = message.message_type_name;
      if (messageTypeName && this.customMessageHandlers.has(messageTypeName)) {
        isCustomMessage = true;
        const handlers = this.customMessageHandlers.get(messageTypeName)!;

        for (const handler of handlers) {
          try {
            const result = handler(message);
            if (result instanceof Promise) {
              const task = result.catch(error => {
                console.error(`处理自定义消息类型 ${messageTypeName} 时出错:`, error);
              });
              tasks.push(task);
              this.backgroundTasks.add(task);
              task.finally(() => this.backgroundTasks.delete(task));
            }
          } catch (error) {
            console.error(`处理自定义消息类型 ${messageTypeName} 时出错:`, error);
          }
        }
      }
    }

    if (!isCustomMessage) {
      // 处理全局处理器
      for (const handler of this.messageHandlers) {
        try {
          const result = handler(message);
          if (result instanceof Promise) {
            const task = result.catch(error => {
              console.error('处理消息时出错:', error);
            });
            tasks.push(task);
            this.backgroundTasks.add(task);
            task.finally(() => this.backgroundTasks.delete(task));
          }
        } catch (error) {
          console.error('处理消息时出错:', error);
        }
      }
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  /**
   * 后台处理单个消息
   */
  protected async handleMessage(message: Record<string, any>): Promise<void> {
    try {
      await this.processMessage(message);
    } catch (error) {
      throw new Error(String(error));
    }
  }
}

/**
 * 消息服务器，支持 WebSocket 模式
 */
export class MessageServer extends BaseMessageHandler {
  private connection: WebSocketServerConnection;

  constructor(
    host: string = '0.0.0.0',
    port: number = 18000,
    enableToken: boolean = false,
    path: string = '/ws',
    sslCertfile?: string,
    sslKeyfile?: string,
    mode: 'ws' | 'tcp' = 'ws',
  ) {
    super();

    if (mode === 'tcp') {
      throw new Error('TCP 模式暂未实现');
    }

    // 创建 WebSocket 连接
    this.connection = new WebSocketServerConnection(host, port, path, sslCertfile, sslKeyfile, enableToken);

    // 注册消息处理器
    this.connection.registerMessageHandler(message => this.processMessage(message));
  }

  /**
   * 验证令牌是否有效
   */
  async verifyToken(token: string): Promise<boolean> {
    return await this.connection.verifyToken(token);
  }

  /**
   * 添加有效令牌
   */
  addValidToken(token: string): void {
    this.connection.addValidToken(token);
  }

  /**
   * 移除有效令牌
   */
  removeValidToken(token: string): void {
    this.connection.removeValidToken(token);
  }

  /**
   * 广播消息给所有连接的客户端
   */
  async broadcastMessage(message: Record<string, any>): Promise<void> {
    await this.connection.broadcastMessage(message);
  }

  /**
   * 向指定平台的所有客户端广播消息
   */
  async broadcastToPlatform(platform: string, message: Record<string, any>): Promise<boolean> {
    return await this.connection.sendMessage(platform, message);
  }

  /**
   * 发送消息给指定平台
   */
  async sendMessage(message: MessageBase): Promise<boolean> {
    return await this.connection.sendMessage(message.messageInfo.platform!, message.toDict());
  }

  /**
   * 发送自定义消息给指定平台
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
   * 异步方式运行服务器
   */
  async run(): Promise<void> {
    try {
      await this.connection.start();
    } catch (error) {
      await this.stop();
      throw new Error(`服务器运行错误: ${error}`);
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    await this.connection.stop();

    // 等待所有后台任务完成
    if (this.backgroundTasks.size > 0) {
      await Promise.all(Array.from(this.backgroundTasks));
    }
    this.backgroundTasks.clear();
  }
}

/**
 * 消息客户端，支持 WebSocket 模式
 */
export class MessageClient extends BaseMessageHandler {
  private platform?: string;
  private connection?: WebSocketClientConnection;
  private connectionConfigured: boolean = false;

  constructor(mode: 'ws' | 'tcp' = 'ws') {
    super();

    if (mode === 'tcp') {
      throw new Error('TCP 模式暂未实现');
    }
  }

  /**
   * 设置连接参数并连接到服务器
   */
  async connect(url: string, platform: string, token?: string, sslVerify?: string): Promise<void> {
    this.platform = platform;

    // 创建 WebSocket 客户端
    this.connection = new WebSocketClientConnection();
    this.connection.registerMessageHandler(message => this.processMessage(message));
    await this.connection.configure(url, platform, token, sslVerify);

    this.connectionConfigured = true;
  }

  /**
   * 维持连接和消息处理
   */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('请先调用connect方法连接到服务器');
    }

    await this.connection.start();
  }

  /**
   * 停止客户端
   */
  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
    }

    // 等待所有后台任务完成
    if (this.backgroundTasks.size > 0) {
      await Promise.all(Array.from(this.backgroundTasks));
    }
    this.backgroundTasks.clear();
  }

  /**
   * 发送消息到服务器
   */
  async sendMessage(message: Record<string, any>): Promise<boolean> {
    if (!this.connection) {
      throw new Error('请先调用connect方法连接到服务器');
    }

    return await this.connection.sendMessage(message);
  }

  /**
   * 发送自定义消息到服务器
   */
  async sendCustomMessage(messageTypeName: string, message: Record<string, any>): Promise<boolean> {
    if (!this.connection) {
      throw new Error('请先调用connect方法连接到服务器');
    }

    const fullMessage = {
      platform: this.platform,
      message_type_name: messageTypeName,
      content: message,
      timestamp: Date.now() / 1000,
      is_custom_message: true,
    };
    return await this.connection.sendMessage(fullMessage);
  }

  /**
   * 判断当前连接是否有效
   */
  isConnected(): boolean {
    if (!this.connection || !this.connectionConfigured) {
      return false;
    }

    return this.connection.isConnectedStatus();
  }
}
