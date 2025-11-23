# maim-message-ts

[![npm version](https://img.shields.io/npm/v/@changingself/maim-message-ts.svg)](https://www.npmjs.com/package/@changingself/maim-message-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[maim-message](https://github.com/MaiM-with-u/maim_message) 是一个为 [MaiBot](https://github.com/MaiM-with-u/MaiBot) 生态系统设计的 TypeScript/JavaScript 库，旨在提供一套标准化的消息格式定义和基于 WebSocket 的通信机制。它的核心目标是解耦 MaimBot 的各个组件（如核心服务 `maimcore`、平台适配器 `Adapter`、插件 `Plugin` 等），使得它们可以通过统一的接口进行交互，从而简化开发、增强可扩展性并支持多平台接入。

原项目是 Python 项目，本项目是它的 TypeScript 实现，同时也兼容 JavaScript 项目引入。

## 注意事项

本项目主要通过 AI 辅助进行语言转写，目前已通过基础编译测试，但暂未进行全面的功能测试和生产环境验证，请谨慎用于生产环境。

## 快速开始

参见 [examples/quickstart.ts](examples/quickstart.ts) 查看完整的示例代码。

## 本地开发和测试

如果你想在不发布到 npm 的情况下测试这个库，请参阅 [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) 了解多种本地引用方式。

推荐使用 `npm link`：

```bash
# 在 maim-message-ts 项目中
pnpm build
npm link

# 在你的测试项目中
npm link @changingself/maim-message-ts
```

## 测试脚本

本项目提供了多个测试脚本，方便开发时测试功能：

```bash
# Legacy API 测试
pnpm test:server         # 启动测试服务器
pnpm test:client         # 启动测试客户端
pnpm test:router         # 启动路由器测试

# API-Server 版本测试
pnpm test:api-server     # 启动 API 服务器
pnpm test:api-client     # 启动 API 客户端

# 运行示例
pnpm example
```

详见 [tests/README.md](tests/README.md) 了解更多测试场景。

## 版本对应

| 本项目版本 | 基于的 maim_message 版本 |
| ---------- | ------------------------ |
| 0.1.0      | 0.5.7                    |

## 安装

```bash
npm install @changingself/maim-message-ts
```

或使用 yarn:

```bash
yarn add @changingself/maim-message-ts
```

或使用 pnpm:

```bash
pnpm add @changingself/maim-message-ts
```

## 核心概念

1.  **`MessageBase`**: 所有通过 `maim_message` 传输的消息的基础结构。它包含：
    - `messageInfo`: 消息元数据 (`BaseMessageInfo`)，如来源平台 (`platform`)、用户 (`UserInfo`)、群组 (`GroupInfo`)、消息ID、时间戳等
    - `messageSegment`: 消息内容 (`Seg`)，通常是一个 `type` 为 `seglist` 的 `Seg`，其 `data` 包含一个由不同类型 `Seg` 组成的列表
    - `rawMessage` (可选): 原始消息字符串

2.  **`Seg`**: 消息内容的基本单元。每个 `Seg` 有：
    - `type`: 字符串，表示内容类型（如 `"text"`, `"image"`, `"emoji"`, `"at"`, `"reply"`, `"seglist"` 等）
    - `data`: 具体内容。对于 `"text"` 是字符串，对于 `"image"` 或 `"emoji"` 通常是 Base64 编码的字符串，对于 `"seglist"` 是一个 `Seg` 对象的列表

3.  **WebSocket 通信**:
    - **`Router`**: 用于管理一个或多个到下游服务的 `MessageClient` 连接
    - **`MessageServer`**: 用于创建一个 WebSocket 服务器，接收来自上游客户端的连接和消息
    - **`MessageClient`**: 用于创建到 WebSocket 服务器的单个连接

## 快速开始

### API-Server Version 快速上手 (推荐)

#### TypeScript 服务端

```typescript
import { WebSocketServer, createServerConfig, APIMessageBase } from '@changingself/maim-message-ts';

async function startServer() {
  // 创建配置
  const config = createServerConfig('localhost', 18040, '/ws');

  // 创建并启动服务器
  const server = new WebSocketServer(config);

  // 注册消息处理器
  server.registerMessageHandler(async (message: APIMessageBase) => {
    console.log('收到消息:', message.toDict());
  });

  await server.start();
  console.log('服务器已启动');
}

startServer().catch(console.error);
```

#### TypeScript 客户端 - 多连接模式

```typescript
import { WebSocketClient, createClientConfig, APIMessageBase, MessageDim, APIBaseMessageInfo, Seg } from '@changingself/maim-message-ts';

async function startClient() {
  // 创建客户端
  const config = createClientConfig('ws://localhost:18040/ws', 'main_key', 'main_platform');
  const client = new WebSocketClient(config);

  await client.start();

  // 添加多个平台连接
  const wechatConn = await client.addConnection('ws://localhost:18040/ws', 'wechat_key', 'wechat');
  const qqConn = await client.addConnection('ws://localhost:18040/ws', 'qq_key', 'qq');

  // 连接所有平台
  await client.connectTo(wechatConn);
  await client.connectTo(qqConn);

  // 智能路由发送（自动选择连接）
  const message = new APIMessageBase(
    new APIBaseMessageInfo('test_platform', 'msg_123', Date.now()),
    new Seg('seglist', [new Seg('text', 'Hello World')]),
    new MessageDim('wechat_key', 'wechat'),
  );

  await client.sendMessage(message);

  // 发送自定义消息（通过主连接发送）
  await client.sendCustomMessage('notification', { data: 'payload' });
}

startClient().catch(console.error);
```

#### JavaScript 使用示例

```javascript
const { WebSocketServer, createServerConfig } = require('@changingself/maim-message-ts');

async function startServer() {
  const config = createServerConfig('localhost', 18040, '/ws');
  const server = new WebSocketServer(config);

  server.registerMessageHandler(async message => {
    console.log('收到消息:', message.toDict());
  });

  await server.start();
  console.log('服务器已启动');
}

startServer().catch(console.error);
```

### Legacy API 快速上手

#### 场景一：构建适配器或客户端 (使用 Router 连接到服务器)

```typescript
import { BaseMessageInfo, UserInfo, GroupInfo, MessageBase, Seg, Router, RouteConfig, TargetConfig } from '@changingself/maim-message-ts';

// 定义连接目标
const routeConfig = new RouteConfig({
  my_platform_instance_1: new TargetConfig('ws://127.0.0.1:8000/ws'),
});

// 创建 Router 实例
const router = new Router(routeConfig);

// 定义消息处理器
async function handleResponseFromMaimcore(message: MessageBase) {
  console.log(`收到来自 MaimCore 的回复:`, message.messageSegment);
}

// 注册消息处理器
router.registerMessageHandler(handleResponseFromMaimcore);

// 构造消息
function constructMessage(platform: string, userId: string, groupId: string, textContent: string): MessageBase {
  const userInfo = new UserInfo(platform, userId);
  const groupInfo = new GroupInfo(platform, groupId);
  const messageInfo = new BaseMessageInfo(platform, 'some_unique_id', Date.now(), groupInfo, userInfo);
  const messageSegment = new Seg('seglist', [new Seg('text', textContent)]);
  return new MessageBase(messageInfo, messageSegment);
}

// 运行并发送消息
async function runClient() {
  // 启动 Router
  const routerTask = router.run();

  // 等待连接建立
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 发送消息
  const msg = constructMessage('my_platform_instance_1', '12345', '98765', '你好 MaimCore！');
  await router.sendMessage(msg);

  // 保持运行...
}

runClient().catch(console.error);
```

#### 场景二：构建服务器 (使用 MessageServer 接受连接)

```typescript
import { MessageBase, Seg, MessageServer } from '@changingself/maim-message-ts';

// 定义消息处理器
async function handleIncomingMessage(messageData: any) {
  try {
    const message = MessageBase.fromDict(messageData);
    console.log(`收到来自 ${message.messageInfo.platform} 的消息:`, message.messageSegment);

    // 处理消息逻辑...
  } catch (error) {
    console.error('处理消息时出错:', error);
  }
}

// 创建并运行服务器
const server = new MessageServer('0.0.0.0', 19000);
server.registerMessageHandler(handleIncomingMessage);

// 启动服务器
server.run().catch(console.error);
```

## SSL/TLS 支持

### 服务端使用 SSL

```typescript
import { createSslServerConfig, WebSocketServer } from '@changingself/maim-message-ts';

const config = createSslServerConfig('0.0.0.0', 8090, '/ws', './ssl/server.crt', './ssl/server.key');

const server = new WebSocketServer(config);
await server.start();
```

### 客户端使用 SSL

```typescript
import { createSslClientConfig, WebSocketClient } from '@changingself/maim-message-ts';

const config = createSslClientConfig(
  'wss://127.0.0.1:8090/ws',
  'api_key',
  'platform',
  './ssl/server.crt', // SSL 验证证书
);

const client = new WebSocketClient(config);
await client.start();
```

## API 概览

### Legacy API 主要类

- `MessageBase`: 消息传输的基本单位
- `BaseMessageInfo`, `UserInfo`, `GroupInfo`, `FormatInfo`, `TemplateInfo`: 构成消息信息的数据类
- `Seg`: 消息内容的基本单元
- `Router`: 管理到多个 WebSocket 服务器的客户端连接
- `RouteConfig`, `TargetConfig`: 用于配置 Router 的连接目标
- `MessageServer`: 创建 WebSocket 服务器
- `MessageClient`: 创建到 WebSocket 服务器的连接

### API-Server Version 主要类

- `APIMessageBase`: API-Server 版本的主要消息类
- `MessageDim`: 消息维度信息（包含 API 密钥和平台标识）
- `WebSocketServer`: API-Server 版本的 WebSocket 服务器
- `WebSocketClient`: API-Server 版本的 WebSocket 客户端（支持多连接）
- `ServerConfig`, `ClientConfig`: 配置类
- `ConnectionInfo`: 连接信息类

## TypeScript 类型支持

本库完全使用 TypeScript 编写，提供完整的类型定义。在 TypeScript 项目中使用时，您将获得完整的类型检查和智能提示支持。

```typescript
import { MessageBase, Seg, APIMessageBase } from '@changingself/maim-message-ts';

// 享受完整的类型支持
const seg: Seg = new Seg('text', 'Hello');
const message: MessageBase = new MessageBase(/* ... */);
```

## 与 Python 版本的对应关系

本 TypeScript 实现与 Python 版本保持 API 一致性，主要差异在于命名风格：

| Python            | TypeScript       |
| ----------------- | ---------------- |
| `message_info`    | `messageInfo`    |
| `message_segment` | `messageSegment` |
| `user_id`         | `userId`         |
| `group_id`        | `groupId`        |
| `api_key`         | `apiKey`         |

类和方法名称保持一致，只是属性名称遵循 JavaScript/TypeScript 的驼峰命名约定。

## 开发和构建

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 构建后的文件将在 dist/ 目录中
```

## 许可证

MIT License
