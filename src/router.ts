/**
 * maim_message - Router 路由器实现
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

import { MessageBase } from './message-base';
import { MessageClient } from './api';

/**
 * 目标配置
 */
export class TargetConfig {
  url: string;
  token?: string;
  sslVerify?: string;

  constructor(url: string, token?: string, sslVerify?: string) {
    this.url = url;
    this.token = token;
    this.sslVerify = sslVerify;
  }

  toDict(): Record<string, any> {
    const result: Record<string, any> = { url: this.url };
    if (this.token !== undefined) result.token = this.token;
    if (this.sslVerify !== undefined) result.ssl_verify = this.sslVerify;
    return result;
  }

  static fromDict(data: Record<string, any>): TargetConfig {
    return new TargetConfig(data.url, data.token, data.ssl_verify);
  }
}

/**
 * 路由配置
 */
export class RouteConfig {
  routeConfig: Map<string, TargetConfig>;

  constructor(routeConfig: Map<string, TargetConfig> | Record<string, TargetConfig>) {
    if (routeConfig instanceof Map) {
      this.routeConfig = routeConfig;
    } else {
      this.routeConfig = new Map(Object.entries(routeConfig));
    }
  }

  toDict(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.routeConfig.entries()) {
      result[key] = value.toDict();
    }
    return { route_config: result };
  }

  static fromDict(data: Record<string, any>): RouteConfig {
    const routeConfig: Record<string, TargetConfig> = {};
    const configData = data.route_config || {};

    for (const [key, value] of Object.entries(configData)) {
      routeConfig[key] = TargetConfig.fromDict(value as Record<string, any>);
    }

    return new RouteConfig(routeConfig);
  }
}

/**
 * Router 路由器类
 * 管理到多个 WebSocket 服务器的客户端连接
 */
export class Router {
  private config: RouteConfig;
  private clients: Map<string, MessageClient> = new Map();
  private handlers: Array<(message: MessageBase) => void | Promise<void>> = [];
  private customMessageHandlers: Map<string, Array<(message: any) => void | Promise<void>>> = new Map();
  private running: boolean = false;
  private clientTasks: Map<string, Promise<void>> = new Map();
  private stopMonitor: boolean = false;

  constructor(config: RouteConfig) {
    this.config = config;
  }

  /**
   * 监控所有客户端连接状态
   */
  private async monitorConnections(): Promise<void> {
    await this.sleep(3000); // 等待初始连接建立

    while (this.running && !this.stopMonitor) {
      for (const [platform, client] of this.clients.entries()) {
        if (!client.isConnected()) {
          console.log(`检测到平台 ${platform} 的连接已断开，正在尝试重新连接`);
          await this.reconnectPlatform(platform);
        }
      }
      await this.sleep(5000); // 每5秒检查一次
    }
  }

  /**
   * 重新连接指定平台
   */
  private async reconnectPlatform(platform: string): Promise<void> {
    const client = this.clients.get(platform);
    if (client) {
      await client.stop();
      this.clients.delete(platform);
    }

    await this.connect(platform);
  }

  /**
   * 动态添加新平台
   */
  async addPlatform(platform: string, config: TargetConfig): Promise<void> {
    this.config.routeConfig.set(platform, config);
    if (this.running) {
      await this.connect(platform);
    }
  }

  /**
   * 动态移除平台
   */
  async removePlatform(platform: string): Promise<void> {
    this.config.routeConfig.delete(platform);

    const client = this.clients.get(platform);
    if (client) {
      await client.stop();
      this.clients.delete(platform);
    }

    this.clientTasks.delete(platform);
  }

  /**
   * 连接指定平台
   */
  async connect(platform: string): Promise<void> {
    const config = this.config.routeConfig.get(platform);
    if (!config) {
      throw new Error(`未找到平台配置: ${platform}`);
    }

    // 根据URL协议决定使用哪种模式
    const mode = config.url.startsWith('tcp://') || config.url.startsWith('tcps://') ? 'tcp' : 'ws';
    const client = new MessageClient(mode);

    await client.connect(config.url, platform, config.token, config.sslVerify);

    // 注册常规消息处理器
    for (const handler of this.handlers) {
      client.registerMessageHandler(handler);
    }

    // 注册自定义消息处理器
    for (const [messageTypeName, handlers] of this.customMessageHandlers.entries()) {
      for (const handler of handlers) {
        client.registerCustomMessageHandler(messageTypeName, handler);
      }
    }

    this.clients.set(platform, client);

    if (this.running) {
      this.clientTasks.set(platform, client.run());
    }
  }

  /**
   * 运行所有客户端连接
   */
  async run(): Promise<void> {
    this.running = true;
    this.stopMonitor = false;

    try {
      // 初始化所有平台的连接
      for (const [platform] of this.config.routeConfig.entries()) {
        if (!this.clients.has(platform)) {
          await this.connect(platform);
        }
      }

      // 启动连接监控任务
      void this.monitorConnections();

      // 等待运行状态改变
      while (this.running) {
        await this.sleep(1000);
      }
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  /**
   * 停止所有客户端
   */
  async stop(): Promise<void> {
    this.running = false;
    this.stopMonitor = true;

    // 停止所有客户端
    const stopPromises: Promise<void>[] = [];
    for (const client of this.clients.values()) {
      stopPromises.push(client.stop());
    }

    if (stopPromises.length > 0) {
      await Promise.all(stopPromises);
    }

    this.clients.clear();
    this.clientTasks.clear();
  }

  /**
   * 注册消息处理器
   */
  registerClassHandler(handler: (message: MessageBase) => void | Promise<void>): void {
    if (!this.handlers.includes(handler)) {
      this.handlers.push(handler);
    }
  }

  /**
   * 注册消息处理器（别名）
   */
  registerMessageHandler(handler: (message: MessageBase) => void | Promise<void>): void {
    this.registerClassHandler(handler);
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

    // 为所有已连接的客户端注册此处理器
    for (const client of this.clients.values()) {
      client.registerCustomMessageHandler(messageTypeName, handler);
    }
  }

  /**
   * 获取目标URL
   */
  getTargetUrl(message: MessageBase): string | null {
    const platform = message.messageInfo.platform;
    if (!platform) {
      return null;
    }
    const config = this.config.routeConfig.get(platform);
    return config ? config.url : null;
  }

  /**
   * 发送消息
   */
  async sendMessage(message: MessageBase): Promise<boolean> {
    const platform = message.messageInfo.platform;
    const url = this.getTargetUrl(message);

    if (!platform) {
      throw new Error('消息缺少平台信息');
    }

    if (!url) {
      throw new Error(`不存在该平台url配置: ${platform}`);
    }

    const client = this.clients.get(platform);
    if (!client) {
      throw new Error(`平台 ${platform} 未连接`);
    }

    return await client.sendMessage(message.toDict());
  }

  /**
   * 发送自定义类型消息到指定平台
   */
  async sendCustomMessage(platform: string, messageTypeName: string, message: Record<string, any>): Promise<boolean> {
    if (!platform) {
      throw new Error('平台参数不能为空');
    }

    const client = this.clients.get(platform);
    if (!client) {
      throw new Error(`平台 ${platform} 未连接`);
    }

    return await client.sendCustomMessage(messageTypeName, message);
  }

  /**
   * 检查指定平台的连接状态
   */
  checkConnection(platform: string): boolean {
    const client = this.clients.get(platform);
    return client !== undefined && client.isConnected();
  }

  /**
   * 辅助睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
