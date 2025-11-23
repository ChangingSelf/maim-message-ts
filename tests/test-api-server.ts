/**
 * 测试 API-Server 版本服务器
 * 支持多客户端连接和消息转发
 */

import { WebSocketServer, createServerConfig } from '../src/index';
import { APIMessageBase, Seg, MessageDim, APIBaseMessageInfo } from '../src/api-message-base';

async function main() {
  console.log('启动 API-Server 版本测试服务器...');

  // 创建服务器配置
  const config = createServerConfig('0.0.0.0', 18040, '/ws');

  // 创建服务器
  const server = new WebSocketServer(config);

  // 统计信息
  const stats = {
    messagesReceived: 0,
    messagesSent: 0,
    clients: new Set<string>(),
  };

  // 注册消息处理器
  server.registerMessageHandler(async (message: APIMessageBase) => {
    stats.messagesReceived++;
    const platform = message.getMessagePlatform();
    const apiKey = message.getApiKey();

    stats.clients.add(`${apiKey}@${platform}`);

    console.log('\n收到消息:');
    console.log('  平台:', platform);
    console.log('  API Key:', apiKey);
    console.log('  消息ID:', message.getMessageId());
    console.log('  内容:', message.messageSegment);
    console.log('  统计: 收到', stats.messagesReceived, '条，发送', stats.messagesSent, '条');
    console.log('  客户端:', stats.clients.size, '个');

    // 回复消息
    try {
      const reply = new APIMessageBase(
        new APIBaseMessageInfo(platform, `reply_${message.getMessageId()}`, Date.now()),
        new Seg('text', `服务器收到消息: ${JSON.stringify(message.messageSegment)}`),
        new MessageDim(apiKey, platform),
      );

      const success = await server.sendMessage(reply);
      if (success) {
        stats.messagesSent++;
        console.log('  已发送回复');
      } else {
        console.log('  发送回复失败');
      }
    } catch (error) {
      console.error('  发送回复出错:', error);
    }
  });

  // 启动服务器
  await server.start();
  console.log('API-Server 已启动在 ws://0.0.0.0:18040/ws');

  // 定期打印统计信息
  setInterval(() => {
    console.log('\n=== 统计信息 ===');
    console.log('  收到消息:', stats.messagesReceived);
    console.log('  发送消息:', stats.messagesSent);
    console.log('  活跃客户端:', stats.clients.size);
    console.log('  客户端列表:', Array.from(stats.clients));
  }, 30000);

  // 监听退出信号
  process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    await server.stop();
    console.log('服务器已关闭');
    process.exit(0);
  });

  console.log('\n服务器运行中，按 Ctrl+C 退出');
}

// 运行主函数
main().catch(error => {
  console.error('服务器运行出错:', error);
  process.exit(1);
});

