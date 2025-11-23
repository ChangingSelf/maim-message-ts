/**
 * maim_message - MaimBot 通用消息接口库 TypeScript 实现
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

export const VERSION = '0.5.8';

// ============ Legacy API Components ============
// 从根模块导出的传统 API 组件

// 消息基础类
export { MessageBase, Seg, GroupInfo, UserInfo, FormatInfo, TemplateInfo, BaseMessageInfo, InfoBase, SenderInfo, ReceiverInfo } from './message-base';

// Router 和配置
export { Router, RouteConfig, TargetConfig } from './router';

// 传统 API 客户端和服务器
export { MessageClient, MessageServer } from './api';

// ============ API-Server Version Components ============
// 需要从子模块导入的新版本组件

// 消息相关组件 - 从 message 模块导入
export { APIMessageBase, MessageDim, APIBaseMessageInfo } from './api-message-base';

// WebSocket 服务端组件 - 从 server 模块导入
export { WebSocketServer } from './server-ws-api';

// WebSocket 客户端组件 - 从 client 模块导入
export { WebSocketClient, ConnectionInfo } from './client-ws-api';

// 配置和工具
export {
  ServerConfig,
  ClientConfig,
  AuthResult,
  ConfigManager,
  createServerConfig,
  createSslServerConfig,
  createClientConfig,
  createSslClientConfig,
} from './ws-config';

// 导出连接层（供高级用户使用）
export { WebSocketClientConnection, WebSocketServerConnection } from './ws-connection';

// ============ 默认导出 ============
// 为了方便使用，提供默认导出
import { MessageBase as MB } from './message-base';
import { MessageClient as MC, MessageServer as MS } from './api';
import { Router as R, RouteConfig as RC, TargetConfig as TC } from './router';
import { APIMessageBase as AMB, MessageDim as MD } from './api-message-base';
import { WebSocketServer as WSS } from './server-ws-api';
import { WebSocketClient as WSC } from './client-ws-api';
import { createServerConfig as CSC, createClientConfig as CCC } from './ws-config';

export default {
  VERSION,
  // Legacy API
  MessageBase: MB,
  MessageClient: MC,
  MessageServer: MS,
  Router: R,
  RouteConfig: RC,
  TargetConfig: TC,
  // API-Server Version
  APIMessageBase: AMB,
  MessageDim: MD,
  WebSocketServer: WSS,
  WebSocketClient: WSC,
  // 配置
  createServerConfig: CSC,
  createClientConfig: CCC,
};
