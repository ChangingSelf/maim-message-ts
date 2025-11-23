import { APIMessageBase } from './src/api-message-base';

// 测试真实的驼峰命名消息反序列化
function testRealCase() {
  // 你提供的JSON字符串（简化版）
  const jsonStr = '{"messageInfo":{"platform":"maicraft","messageId":"msg_1763886221191","time":1763886221191,"senderInfo":{"groupInfo":null,"userInfo":{"platform":"maicraft","userId":"maicraft_bot","userNickname":"Maicraft AI","userCardname":"Minecraft AI助手"}}},"messageSegment":{"type":"seglist","data":[{"type":"text","data":"[思考记忆]\\n🤔 LLM思维: 测试消息"}]},"messageDim":{"apiKey":"maicraft_key","platform":"maicraft"}}';

  try {
    console.log('解析JSON字符串...');
    const data = JSON.parse(jsonStr);
    console.log('JSON解析成功');

    console.log('反序列化消息...');
    const message = APIMessageBase.fromDict(data);
    console.log('反序列化成功!');

    console.log('验证结果:');
    console.log('- Platform:', message.getPlatform());
    console.log('- API Key:', message.getApiKey());
    console.log('- Message ID:', message.getMessageId());
    console.log('- User ID:', message.messageInfo.senderInfo?.userInfo?.userId);
    console.log('- User Nickname:', message.messageInfo.senderInfo?.userInfo?.userNickname);
    console.log('- Message Type:', message.messageSegment.type);

    return true;
  } catch (error) {
    console.error('处理失败:', error);
    return false;
  }
}

// 运行测试
if (require.main === module) {
  const success = testRealCase();
  console.log('\n测试结果:', success ? '✓ 成功' : '✗ 失败');
}
