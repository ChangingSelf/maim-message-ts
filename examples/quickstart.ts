/**
 * maim-message-ts 快速开始示例
 * Copyright (c) 2025 tcmofashi
 * MIT License
 */

import {
  // API-Server Version (推荐)
  WebSocketServer,
  WebSocketClient,
  createServerConfig,
  createClientConfig,
  APIMessageBase,
  MessageDim,
  APIBaseMessageInfo,
  Seg,

  // Legacy API
  MessageBase,
  BaseMessageInfo,
  UserInfo,
  GroupInfo,
  Router,
  RouteConfig,
  TargetConfig,
  MessageServer,
  MessageClient,
} from '../src/index';

// ============ API-Server Version 示例 ============

/**
 * API-Server 版本服务端示例
 */
async function apiServerExample() {
  console.log('=== API-Server 版本服务端示例 ===');

  // 创建配置
  const config = createServerConfig('localhost', 18040, '/ws');

  // 创建服务器
  const server = new WebSocketServer(config);

  // 注册消息处理器
  server.registerMessageHandler(async (message: APIMessageBase) => {
    console.log('服务端收到消息:', {
      platform: message.getMessagePlatform(),
      messageId: message.getMessageId(),
      apiKey: message.getApiKey(),
    });

    // 回复消息
    const reply = new APIMessageBase(
      new APIBaseMessageInfo(message.getMessagePlatform(), 'reply_' + message.getMessageId(), Date.now()),
      new Seg('seglist', [new Seg('text', '服务端已收到您的消息')]),
      new MessageDim(message.getApiKey(), message.getPlatform()),
    );

    await server.sendMessage(reply);
  });

  // 启动服务器
  await server.start();
  console.log('服务器已启动在 ws://localhost:18040/ws');

  return server;
}

/**
 * API-Server 版本客户端示例
 */
async function apiClientExample() {
  console.log('\n=== API-Server 版本客户端示例 ===');

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 创建客户端配置
  const config = createClientConfig('ws://localhost:18040/ws', 'test_api_key', 'test_platform');

  // 创建客户端
  const client = new WebSocketClient(config);

  // 注册消息处理器
  client.registerMessageHandler(async (message: APIMessageBase) => {
    console.log('客户端收到回复:', message.messageSegment);
  });

  // 启动客户端
  await client.start();
  console.log('客户端已连接');

  // 发送消息
  const message = new APIMessageBase(
    new APIBaseMessageInfo('test_platform', 'msg_' + Date.now(), Date.now()),
    new Seg('seglist', [new Seg('text', 'Hello from TypeScript client!')]),
    new MessageDim('test_api_key', 'test_platform'),
  );

  await client.sendMessage(message);
  console.log('消息已发送');

  return client;
}

// ============ Legacy API 示例 ============

/**
 * Legacy API 服务端示例
 */
async function legacyServerExample() {
  console.log('\n=== Legacy API 服务端示例 ===');

  const server = new MessageServer('localhost', 19000);

  server.registerMessageHandler(async (messageData: any) => {
    const message = MessageBase.fromDict(messageData);
    console.log('Legacy 服务端收到消息:', {
      platform: message.messageInfo.platform,
      messageId: message.messageInfo.messageId,
    });
  });

  // 启动服务器（非阻塞）
  setTimeout(() => {
    server.run().catch(console.error);
  }, 0);

  console.log('Legacy 服务器已启动在 ws://localhost:19000');

  return server;
}

/**
 * Legacy API 客户端示例（使用 Router）
 */
async function legacyClientExample() {
  console.log('\n=== Legacy API 客户端示例 (Router) ===');

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 创建路由配置
  const routeConfig = new RouteConfig({
    test_platform: new TargetConfig('ws://localhost:19000/ws'),
  });

  // 创建 Router
  const router = new Router(routeConfig);

  // 注册消息处理器
  router.registerMessageHandler(async (message: MessageBase) => {
    console.log('Router 收到消息:', message.messageSegment);
  });

  // 启动 Router（非阻塞）
  setTimeout(() => {
    router.run().catch(console.error);
  }, 0);

  // 等待连接建立
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 发送消息
  const message = new MessageBase(
    new BaseMessageInfo(
      'test_platform',
      'msg_' + Date.now(),
      Date.now(),
      new GroupInfo('test_platform', 'group_123'),
      new UserInfo('test_platform', 'user_456'),
    ),
    new Seg('seglist', [new Seg('text', 'Hello from Legacy Router!')]),
  );

  await router.sendMessage(message);
  console.log('Legacy 消息已发送');

  return router;
}

// ============ 运行示例 ============

/**
 * 主函数
 */
async function main() {
  console.log('maim-message-ts 快速开始示例\n');

  try {
    // 运行 API-Server 版本示例
    const apiServer = await apiServerExample();
    const apiClient = await apiClientExample();

    // 等待消息交互
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 清理 API-Server 版本资源
    await apiClient.stop();
    await apiServer.stop();
    console.log('\nAPI-Server 版本示例已完成');

    // 运行 Legacy API 示例
    const legacyServer = await legacyServerExample();
    const legacyRouter = await legacyClientExample();

    // 等待消息交互
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 清理 Legacy API 资源
    await legacyRouter.stop();
    await legacyServer.stop();
    console.log('\nLegacy API 示例已完成');

    console.log('\n所有示例运行完成！');
    process.exit(0);
  } catch (error) {
    console.error('示例运行出错:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

export { apiServerExample, apiClientExample, legacyServerExample, legacyClientExample };
