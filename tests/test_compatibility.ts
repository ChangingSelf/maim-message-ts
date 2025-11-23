/**
 * 兼容性测试：验证消息序列化反序列化的一致性
 */

import { APIMessageBase, Seg, MessageDim, APIBaseMessageInfo } from '../src/api-message-base';
import { MessageBase, BaseMessageInfo } from '../src/message-base';

// 测试API-Server版本消息的序列化反序列化
function testAPIServerCompatibility() {
  console.log('=== 测试 API-Server 版本兼容性 ===');

  // 创建消息
  const messageInfo = new APIBaseMessageInfo('test_platform', 'test_msg_123', Date.now());
  const messageSegment = new Seg('text', 'Hello World');
  const messageDim = new MessageDim('test_api_key', 'test_platform');
  const originalMessage = new APIMessageBase(messageInfo, messageSegment, messageDim);

  // 序列化
  const serialized = originalMessage.toDict();
  console.log('序列化后的消息:', JSON.stringify(serialized, null, 2));

  // 反序列化
  const deserializedMessage = APIMessageBase.fromDict(serialized);
  console.log('反序列化后的消息:');
  console.log('  Platform:', deserializedMessage.getPlatform());
  console.log('  API Key:', deserializedMessage.getApiKey());
  console.log('  Message ID:', deserializedMessage.getMessageId());
  console.log('  Content:', deserializedMessage.messageSegment);

  // 验证一致性
  const isConsistent =
    deserializedMessage.getPlatform() === originalMessage.getPlatform() &&
    deserializedMessage.getApiKey() === originalMessage.getApiKey() &&
    deserializedMessage.getMessageId() === originalMessage.getMessageId() &&
    deserializedMessage.messageSegment.type === originalMessage.messageSegment.type &&
    deserializedMessage.messageSegment.data === originalMessage.messageSegment.data;

  console.log('兼容性测试结果:', isConsistent ? '✓ 通过' : '✗ 失败');
  return isConsistent;
}

// 测试Legacy版本消息的序列化反序列化
function testLegacyCompatibility() {
  console.log('\n=== 测试 Legacy 版本兼容性 ===');

  // 创建消息
  const messageInfo = new BaseMessageInfo('test_platform', 'test_msg_456', Date.now());
  const messageSegment = new Seg('text', 'Hello Legacy');
  const originalMessage = new MessageBase(messageInfo, messageSegment);

  // 序列化
  const serialized = originalMessage.toDict();
  console.log('序列化后的消息:', JSON.stringify(serialized, null, 2));

  // 反序列化
  const deserializedMessage = MessageBase.fromDict(serialized);
  console.log('反序列化后的消息:');
  console.log('  Platform:', deserializedMessage.messageInfo.platform);
  console.log('  Message ID:', deserializedMessage.messageInfo.messageId);
  console.log('  Content:', deserializedMessage.messageSegment);

  // 验证一致性
  const isConsistent =
    deserializedMessage.messageInfo.platform === originalMessage.messageInfo.platform &&
    deserializedMessage.messageInfo.messageId === originalMessage.messageInfo.messageId &&
    deserializedMessage.messageSegment.type === originalMessage.messageSegment.type &&
    deserializedMessage.messageSegment.data === originalMessage.messageSegment.data;

  console.log('兼容性测试结果:', isConsistent ? '✓ 通过' : '✗ 失败');
  return isConsistent;
}

// 测试跨版本兼容性（API-Server toDict输出是否与Legacy一致）
function testCrossVersionCompatibility() {
  console.log('\n=== 测试跨版本兼容性 ===');

  // 创建API-Server版本消息
  const apiMessageInfo = new APIBaseMessageInfo('test_platform', 'test_msg_789', 1234567890);
  const apiMessageSegment = new Seg('text', 'Cross Version Test');
  const apiMessageDim = new MessageDim('test_api_key', 'test_platform');
  const apiMessage = new APIMessageBase(apiMessageInfo, apiMessageSegment, apiMessageDim);

  // 创建Legacy版本消息（用于对比）
  const legacyMessageInfo = new BaseMessageInfo('test_platform', 'test_msg_789', 1234567890);
  const legacyMessageSegment = new Seg('text', 'Cross Version Test');
  const legacyMessage = new MessageBase(legacyMessageInfo, legacyMessageSegment);

  // 序列化两者
  const apiSerialized = apiMessage.toDict();
  const legacySerialized = legacyMessage.toDict();

  console.log('API-Server版本序列化:', JSON.stringify(apiSerialized, null, 2));
  console.log('Legacy版本序列化:', JSON.stringify(legacySerialized, null, 2));

  // 比较message_info部分（API-Server版本没有group_info和user_info）
  const apiMessageInfoSerialized = apiSerialized.message_info;
  const legacyMessageInfoSerialized = legacySerialized.message_info;

  const isMessageInfoCompatible =
    apiMessageInfoSerialized.platform === legacyMessageInfoSerialized.platform &&
    apiMessageInfoSerialized.message_id === legacyMessageInfoSerialized.message_id &&
    apiMessageInfoSerialized.time === legacyMessageInfoSerialized.time;

  // 比较message_segment部分
  const isMessageSegmentCompatible =
    apiSerialized.message_segment.type === legacySerialized.message_segment.type &&
    apiSerialized.message_segment.data === legacySerialized.message_segment.data;

  console.log('消息信息兼容性:', isMessageInfoCompatible ? '✓ 通过' : '✗ 失败');
  console.log('消息内容兼容性:', isMessageSegmentCompatible ? '✓ 通过' : '✗ 失败');

  return isMessageInfoCompatible && isMessageSegmentCompatible;
}

// 运行所有测试
function runAllTests() {
  const apiTest = testAPIServerCompatibility();
  const legacyTest = testLegacyCompatibility();
  const crossTest = testCrossVersionCompatibility();

  console.log('\n=== 测试总结 ===');
  console.log('API-Server版本测试:', apiTest ? '✓ 通过' : '✗ 失败');
  console.log('Legacy版本测试:', legacyTest ? '✓ 通过' : '✗ 失败');
  console.log('跨版本兼容性测试:', crossTest ? '✓ 通过' : '✗ 失败');

  const allPassed = apiTest && legacyTest && crossTest;
  console.log('总体结果:', allPassed ? '✓ 所有测试通过' : '✗ 部分测试失败');

  return allPassed;
}

// 执行测试
if (require.main === module) {
  runAllTests();
}

export { runAllTests };
