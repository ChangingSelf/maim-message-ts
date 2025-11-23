/**
 * 测试 API-Server 版本客户端
 * 连接到 API 服务器并发送消息
 */

import { WebSocketClient, createClientConfig } from '../src/index';
import { APIMessageBase, Seg, MessageDim, APIBaseMessageInfo } from '../src/api-message-base';

async function main() {
  console.log('启动 API-Server 版本测试客户端...');

  const apiKey = process.argv[2] || 'test_api_key_1';
  const platform = process.argv[3] || 'test_platform_1';

  // 创建客户端配置
  const config = createClientConfig('ws://localhost:18040/ws', apiKey, platform);

  // 创建客户端
  const client = new WebSocketClient(config);

  // 注册消息处理器
  client.registerMessageHandler(async (message: APIMessageBase) => {
    console.log('\n收到服务器回复:');
    console.log('  消息ID:', message.getMessageId());
    console.log('  内容:', message.messageSegment);
    console.log('  时间:', new Date(message.getMessageTime() * 1000).toISOString());
  });

  // 启动客户端
  console.log(`正在连接到服务器 (API Key: ${apiKey}, 平台: ${platform})...`);
  await client.start();

  // 等待连接建立
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('客户端已连接');

  // 定期发送消息
  let count = 0;
  const sendMessage = async () => {
    count++;
    const message = new APIMessageBase(
      new APIBaseMessageInfo(platform, `msg_${apiKey}_${count}_${Date.now()}`, Date.now()),
      new Seg('text', `来自 ${platform} (${apiKey}) 的消息 #${count}`),
      new MessageDim(apiKey, platform),
    );

    console.log(`\n发送消息 #${count}:`);
    console.log('  API Key:', apiKey);
    console.log('  平台:', platform);
    console.log('  内容:', message.messageSegment);

    try {
      const success = await client.sendMessage(message);
      console.log('  发送结果:', success ? '成功' : '失败');
    } catch (error) {
      console.error('  发送失败:', error);
    }
  };

  // 每3秒发送一次消息
  const interval = setInterval(async () => {
    try {
      await sendMessage();
    } catch (error) {
      console.error('发送消息出错:', error);
    }
  }, 3000);

  // 立即发送第一条消息
  await sendMessage();

  // 监听退出信号
  process.on('SIGINT', async () => {
    console.log('\n正在关闭客户端...');
    clearInterval(interval);
    await client.stop();
    console.log('客户端已关闭');
    process.exit(0);
  });

  console.log(`\n客户端运行中 (API Key: ${apiKey}, 平台: ${platform})，按 Ctrl+C 退出`);
}

// 运行主函数
main().catch(error => {
  console.error('客户端运行出错:', error);
  process.exit(1);
});
