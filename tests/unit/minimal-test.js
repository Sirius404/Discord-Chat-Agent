require('dotenv').config();
const FingerprintEngine = require('../src/lib/fingerprint-engine');
const engine = new FingerprintEngine('/home/ubuntu/eliza/discord/src/config/fingerprint_profiles.json');

async function testSendMessage() {
  try {
    const response = await engine.sendMessage(
      '945575912404049986', // 替换为真实频道ID
      '111'
    );
    console.log('✅ 发送成功:', {
      status: response.status,
      content: response.data.content
    });
    console.log(response)
  } catch (error) {
    console.error('❌ 发送失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  } finally {
    process.exit();
  }
}

testSendMessage();