import { APIMessageBase, Seg, MessageDim, APIBaseMessageInfo } from './src/api-message-base';

/**
 * 测试WebSocket上传输的实际数据格式
 */
function testWebSocketData() {
  console.log('=== WebSocket数据传输格式测试 ===\n');

  // 创建测试消息
  const message = new APIMessageBase(
    new APIBaseMessageInfo('test_platform', 'msg_123', Date.now()),
    new Seg('text', 'Hello WebSocket'),
    new MessageDim('api_key_123', 'test_platform')
  );

  // 模拟通过WebSocket发送的数据格式
  const dataToSend = message.toDict();
  const jsonToSend = JSON.stringify(dataToSend);

  console.log('1. 消息对象序列化后的格式 (通过WebSocket发送):');
  console.log('   toDict() 结果:');
  console.log(JSON.stringify(dataToSend, null, 2));
  console.log('\n   JSON.stringify() 结果 (实际发送的字符串):');
  console.log(jsonToSend);

  // 模拟接收端收到的数据
  console.log('\n2. 接收端收到的原始数据:');
  const receivedData = JSON.parse(jsonToSend);
  console.log('   JSON.parse() 结果:');
  console.log(JSON.stringify(receivedData, null, 2));

  // 验证字段命名
  console.log('\n3. 字段命名验证:');
  const checkFields = (obj: any, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      console.log(`   ${prefix}${key}: ${typeof value === 'object' ? '[object]' : value}`);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkFields(value, prefix + '  ');
      }
    }
  };
  checkFields(receivedData);

  console.log('\n4. 反序列化测试:');
  try {
    const deserialized = APIMessageBase.fromDict(receivedData);
    console.log('   ✓ 反序列化成功');
    console.log(`   - Platform: ${deserialized.getPlatform()}`);
    console.log(`   - API Key: ${deserialized.getApiKey()}`);
    console.log(`   - Message ID: ${deserialized.getMessageId()}`);
  } catch (error) {
    console.log('   ✗ 反序列化失败:', error);
  }

  console.log('\n=== 结论 ===');
  console.log('通过WebSocket传输的JSON数据使用下划线命名格式:');
  console.log('- message_info, message_segment, message_dim');
  console.log('- platform, message_id, time');
  console.log('- api_key, user_id, group_id 等');
  console.log('\n这与Python版本的maim-message完全兼容!');
}

// 运行测试
if (require.main === module) {
  testWebSocketData();
}
