/**
 * 测试路由器
 * 连接多个平台并路由消息
 */

import { Router, RouteConfig, TargetConfig } from '../src/router';
import { MessageBase, Seg, UserInfo, GroupInfo, BaseMessageInfo } from '../src/message-base';

async function main() {
  console.log('启动测试路由器...');

  // 创建路由配置
  const routeConfig = new RouteConfig({
    platform_a: new TargetConfig('ws://localhost:18001/ws'),
    platform_b: new TargetConfig('ws://localhost:18002/ws'),
    platform_c: new TargetConfig('ws://localhost:18003/ws'),
  });

  // 创建路由器
  const router = new Router(routeConfig);

  // 注册消息处理器
  router.registerMessageHandler(async (message: MessageBase) => {
    console.log('\n路由器收到消息:');
    console.log('  平台:', message.messageInfo.platform);
    console.log('  消息ID:', message.messageInfo.messageId);
    console.log('  内容:', message.messageSegment);

    // 转发到其他平台
    const currentPlatform = message.messageInfo.platform;
    const otherPlatforms = ['platform_a', 'platform_b', 'platform_c'].filter(p => p !== currentPlatform);

    for (const targetPlatform of otherPlatforms) {
      try {
        const forwardMessage = new MessageBase(
          new BaseMessageInfo(
            targetPlatform,
            `fwd_${message.messageInfo.messageId}`,
            Date.now() / 1000,
            new GroupInfo(targetPlatform, 'group_forward'),
            new UserInfo(targetPlatform, 'router'),
          ),
          new Seg('text', `[转发自 ${currentPlatform}] ${JSON.stringify(message.messageSegment)}`),
        );

        await router.sendMessage(forwardMessage);
        console.log(`  已转发到 ${targetPlatform}`);
      } catch (error) {
        console.error(`  转发到 ${targetPlatform} 失败:`, error);
      }
    }
  });

  // 启动路由器
  console.log('正在启动路由器...');
  router.run().catch(console.error);

  // 监听退出信号
  process.on('SIGINT', async () => {
    console.log('\n正在关闭路由器...');
    await router.stop();
    process.exit(0);
  });

  console.log('\n路由器运行中，按 Ctrl+C 退出');
  console.log('连接的平台:', Object.keys(routeConfig.routeConfig));
}

// 运行主函数
main().catch(error => {
  console.error('路由器运行出错:', error);
  process.exit(1);
});

