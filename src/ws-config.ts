/**
 * maim_message - WebSocket 配置类
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

/**
 * 服务器配置
 */
export class ServerConfig {
  host: string;
  port: number;
  path: string;
  sslCertfile?: string;
  sslKeyfile?: string;
  enableToken: boolean;

  constructor(
    host: string = 'localhost',
    port: number = 18040,
    path: string = '/ws',
    sslCertfile?: string,
    sslKeyfile?: string,
    enableToken: boolean = false,
  ) {
    this.host = host;
    this.port = port;
    this.path = path;
    this.sslCertfile = sslCertfile;
    this.sslKeyfile = sslKeyfile;
    this.enableToken = enableToken;
  }
}

/**
 * 客户端配置
 */
export class ClientConfig {
  url: string;
  apiKey: string;
  platform: string;
  token?: string;
  sslVerify?: string;

  constructor(url: string, apiKey: string, platform: string, token?: string, sslVerify?: string) {
    this.url = url;
    this.apiKey = apiKey;
    this.platform = platform;
    this.token = token;
    this.sslVerify = sslVerify;
  }
}

/**
 * 认证结果
 */
export class AuthResult {
  success: boolean;
  message?: string;

  constructor(success: boolean, message?: string) {
    this.success = success;
    this.message = message;
  }
}

/**
 * 配置管理器
 */
export class ConfigManager {
  private configs: Map<string, ServerConfig | ClientConfig> = new Map();

  /**
   * 添加配置
   */
  addConfig(name: string, config: ServerConfig | ClientConfig): void {
    this.configs.set(name, config);
  }

  /**
   * 获取配置
   */
  getConfig(name: string): ServerConfig | ClientConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * 移除配置
   */
  removeConfig(name: string): void {
    this.configs.delete(name);
  }

  /**
   * 清空所有配置
   */
  clearConfigs(): void {
    this.configs.clear();
  }
}

/**
 * 创建服务器配置
 */
export function createServerConfig(host: string = 'localhost', port: number = 18040, path: string = '/ws'): ServerConfig {
  return new ServerConfig(host, port, path);
}

/**
 * 创建SSL服务器配置
 */
export function createSslServerConfig(host: string, port: number, path: string, sslCertfile: string, sslKeyfile: string): ServerConfig {
  return new ServerConfig(host, port, path, sslCertfile, sslKeyfile);
}

/**
 * 创建客户端配置
 */
export function createClientConfig(url: string, apiKey: string, platform: string): ClientConfig {
  return new ClientConfig(url, apiKey, platform);
}

/**
 * 创建SSL客户端配置
 */
export function createSslClientConfig(url: string, apiKey: string, platform: string, sslVerify: string): ClientConfig {
  return new ClientConfig(url, apiKey, platform, undefined, sslVerify);
}
