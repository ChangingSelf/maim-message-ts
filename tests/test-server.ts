/**
 * 测试服务器
 * 用于测试多客户端连接
 */

import { MessageServer } from '../src/api';
import { MessageBase, Seg } from '../src/message-base';

async function main() {
  console.log('启动测试服务器...');

  const server = new MessageServer('0.0.0.0', 18000);

  // 注册消息处理器
  server.registerMessageHandler(async (messageData: any) => {
    try {
      const message = MessageBase.fromDict(messageData);
      console.log('\n收到消息:');
      console.log('  平台:', message.messageInfo.platform);
      console.log('  消息ID:', message.messageInfo.messageId);
      console.log('  内容:', message.messageSegment);
      console.log('  时间:', new Date(message.messageInfo.time * 1000).toISOString());

      // 回复消息
      const reply = new MessageBase(
        {
          platform: message.messageInfo.platform,
          messageId: 'reply_' + message.messageInfo.messageId,
          time: Date.now() / 1000,
          groupInfo: message.messageInfo.groupInfo,
          userInfo: message.messageInfo.userInfo,
        },
        new Seg('text', `服务器收到了你的消息: ${JSON.stringify(message.messageSegment)}`),
      );

      // 发送回复
      setTimeout(async () => {
        await server.sendMessage(message.messageInfo.platform || 'unknown', reply.toDict());
        console.log('  已发送回复');
      }, 100);
    } catch (error) {
      console.error('处理消息时出错:', error);
    }
  });

  // 启动服务器
  await server.run();
}

// 运行主函数
main().catch(error => {
  console.error('服务器运行出错:', error);
  process.exit(1);
});

