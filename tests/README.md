# maim-message-ts 测试脚本

本目录包含用于测试 `maim-message-ts` 库功能的脚本。

## 测试脚本列表

### Legacy API 测试

#### 1. test-server.ts
基础 WebSocket 服务器，支持多客户端连接和消息回复。

**运行方式：**
```bash
npx ts-node tests/test-server.ts
```

**功能：**
- 监听 ws://0.0.0.0:18000/ws
- 接收客户端消息
- 自动回复确认消息
- 支持多平台同时连接

#### 2. test-client.ts
基础 WebSocket 客户端，连接到测试服务器发送消息。

**运行方式：**
```bash
# 默认平台
npx ts-node tests/test-client.ts

# 指定平台
npx ts-node tests/test-client.ts platform_name
```

**功能：**
- 连接到服务器
- 定期发送测试消息（每3秒）
- 接收并显示服务器回复
- 支持多实例运行（不同平台）

#### 3. test-router.ts
路由器测试，连接多个平台并转发消息。

**运行方式：**
```bash
npx ts-node tests/test-router.ts
```

**功能：**
- 连接到多个服务器（platform_a, platform_b, platform_c）
- 接收消息并转发到其他平台
- 演示消息路由功能

### API-Server 版本测试

#### 4. test-api-server.ts
API-Server 版本服务器，功能更强大。

**运行方式：**
```bash
npx ts-node tests/test-api-server.ts
```

**功能：**
- 监听 ws://0.0.0.0:18040/ws
- 支持多客户端（按 API Key 和平台区分）
- 自动回复消息
- 统计信息（消息数、客户端数）

#### 5. test-api-client.ts
API-Server 版本客户端。

**运行方式：**
```bash
# 默认参数
npx ts-node tests/test-api-client.ts

# 指定 API Key 和平台
npx ts-node tests/test-api-client.ts my_api_key my_platform
```

**功能：**
- 连接到 API 服务器
- 使用 API Key 认证
- 定期发送消息（每3秒）
- 接收服务器回复

## 测试场景

### 场景 1: 基础服务器-客户端通信

1. 启动服务器：
```bash
npx ts-node tests/test-server.ts
```

2. 在另一个终端启动客户端：
```bash
npx ts-node tests/test-client.ts client1
```

3. 可以启动多个客户端测试多连接：
```bash
npx ts-node tests/test-client.ts client2
npx ts-node tests/test-client.ts client3
```

### 场景 2: API-Server 版本通信

1. 启动 API 服务器：
```bash
npx ts-node tests/test-api-server.ts
```

2. 启动多个 API 客户端：
```bash
npx ts-node tests/test-api-client.ts key1 platform1
npx ts-node tests/test-api-client.ts key2 platform2
npx ts-node tests/test-api-client.ts key3 platform3
```

### 场景 3: 路由器测试（需要多个服务器）

1. 启动多个服务器（不同端口）：
```bash
# 需要修改 test-server.ts 端口为 18001、18002、18003
```

2. 启动路由器：
```bash
npx ts-node tests/test-router.ts
```

## 注意事项

1. **端口占用**：确保相应端口未被占用
2. **顺序**：先启动服务器，再启动客户端
3. **多实例**：可以同时运行多个客户端测试并发
4. **退出**：使用 Ctrl+C 优雅退出

## 调试建议

- 查看控制台输出了解消息流向
- 使用不同的平台名称测试多平台场景
- 观察服务器的统计信息
- 测试异常情况（如突然断开连接）

