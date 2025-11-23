/**
 * 测试字段转换功能
 */

import { MessageDim, APIBaseMessageInfo, APIMessageBase, Seg } from '../src/api-message-base';

// 测试字段转换函数
function testFieldConversion() {
  console.log('=== 测试字段转换功能 ===');

  // 测试MessageDim
  console.log('\n1. MessageDim字段转换:');
  const messageDim = new MessageDim('test_api_key', 'test_platform');
  const dimDict = messageDim.toDict();
  console.log('原始对象:', { apiKey: messageDim.apiKey, platform: messageDim.platform });
  console.log('转换后:', dimDict);

  // 验证转换结果
  const dimCorrect = dimDict.api_key === 'test_api_key' && dimDict.platform === 'test_platform';
  console.log('MessageDim转换结果:', dimCorrect ? '✓ 正确' : '✗ 错误');

  // 测试APIBaseMessageInfo
  console.log('\n2. APIBaseMessageInfo字段转换:');
  const messageInfo = new APIBaseMessageInfo('test_platform', 'test_msg_123', Date.now());
  const infoDict = messageInfo.toDict();
  console.log('原始对象:', {
    platform: messageInfo.platform,
    messageId: messageInfo.messageId,
    time: messageInfo.time,
  });
  console.log('转换后:', infoDict);

  // 验证转换结果
  const infoCorrect = infoDict.platform === 'test_platform' && infoDict.message_id === 'test_msg_123' && typeof infoDict.time === 'number';
  console.log('APIBaseMessageInfo转换结果:', infoCorrect ? '✓ 正确' : '✗ 错误');

  // 测试完整APIMessageBase
  console.log('\n3. APIMessageBase字段转换:');
  const apiMessage = new APIMessageBase(messageInfo, new Seg('text', 'Hello World'), messageDim);
  const messageDict = apiMessage.toDict();
  console.log('转换后消息结构:');
  console.log(JSON.stringify(messageDict, null, 2));

  // 验证嵌套结构的转换
  const messageCorrect =
    messageDict.message_info &&
    messageDict.message_info.platform === 'test_platform' &&
    messageDict.message_info.message_id === 'test_msg_123' &&
    messageDict.message_dim &&
    messageDict.message_dim.api_key === 'test_api_key' &&
    messageDict.message_dim.platform === 'test_platform' &&
    messageDict.message_segment &&
    messageDict.message_segment.type === 'text';
  console.log('APIMessageBase转换结果:', messageCorrect ? '✓ 正确' : '✗ 错误');

  // 测试反序列化
  console.log('\n4. 测试反序列化兼容性:');
  try {
    const deserializedMessage = APIMessageBase.fromDict(messageDict);
    const roundTripCorrect =
      deserializedMessage.getPlatform() === 'test_platform' &&
      deserializedMessage.getApiKey() === 'test_api_key' &&
      deserializedMessage.getMessageId() === 'test_msg_123';
    console.log('反序列化结果:', roundTripCorrect ? '✓ 正确' : '✗ 错误');
  } catch (error) {
    console.log('反序列化失败:', error);
  }

  return dimCorrect && infoCorrect && messageCorrect;
}

// 运行测试
if (require.main === module) {
  const success = testFieldConversion();
  console.log('\n=== 测试总结 ===');
  console.log('字段转换测试:', success ? '✓ 全部通过' : '✗ 部分失败');
  process.exit(success ? 0 : 1);
}

export { testFieldConversion };
