# maim-message-ts 示例

本目录包含了 maim-message-ts 的使用示例。

## 运行示例

首先确保已经构建了项目：

```bash
cd ..
npm install
npm run build
```

然后运行示例：

```bash
# 使用 ts-node 直接运行 TypeScript
npx ts-node examples/quickstart.ts

# 或者先编译再运行
npx tsc examples/quickstart.ts --outDir examples/dist --module commonjs
node examples/dist/quickstart.js
```

## 示例说明

### quickstart.ts

包含以下示例：

1. **API-Server 版本服务端**: 创建 WebSocket 服务器，接收和处理消息
2. **API-Server 版本客户端**: 连接到服务器，发送和接收消息
3. **Legacy API 服务端**: 使用传统 API 创建服务器
4. **Legacy API 客户端**: 使用 Router 连接到服务器并发送消息

每个示例都包含完整的消息发送和接收流程。

## 更多示例

更多使用示例请参考主 README.md 文档。
