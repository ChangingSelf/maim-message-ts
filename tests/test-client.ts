/**
 * 测试客户端
 * 连接到测试服务器并发送消息
 */

import { MessageClient } from '../src/api';
import { MessageBase, Seg, UserInfo, GroupInfo, BaseMessageInfo } from '../src/message-base';

async function main() {
  console.log('启动测试客户端...');

  const platform = process.argv[2] || 'test_platform_1';
  const client = new MessageClient('ws');

  // 注册消息处理器
  client.registerMessageHandler(async (messageData: any) => {
    try {
      const message = MessageBase.fromDict(messageData);
      console.log('\n收到服务器回复:');
      console.log('  消息ID:', message.messageInfo.messageId);
      console.log('  内容:', message.messageSegment);
    } catch (error) {
      console.error('处理消息时出错:', error);
    }
  });

  // 连接到服务器
  console.log(`正在连接到服务器 (平台: ${platform})...`);
  await client.connect('ws://localhost:18000/ws', platform);

  // 运行客户端（非阻塞）
  client.run().catch(console.error);

  // 等待连接建立
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 定期发送消息
  let count = 0;
  const sendMessage = async () => {
    count++;
    const message = new MessageBase(
      new BaseMessageInfo(
        platform,
        `msg_${platform}_${count}_${Date.now()}`,
        Date.now() / 1000,
        new GroupInfo(platform, 'group_test'),
        new UserInfo(platform, 'user_test'),
      ),
      new Seg('text', `来自 ${platform} 的测试消息 #${count}`),
    );

    console.log(`\n发送消息 #${count}:`);
    console.log('  平台:', platform);
    console.log('  内容:', message.messageSegment);

    await client.sendMessage(message.toDict());
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
    process.exit(0);
  });

  console.log(`\n客户端运行中 (平台: ${platform})，按 Ctrl+C 退出`);
}

// 运行主函数
main().catch(error => {
  console.error('客户端运行出错:', error);
  process.exit(1);
});

