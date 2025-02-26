const { expect } = require('chai');
const AccountManager = require('../../src/lib/AccountManager');
const MessageManager = require('../../src/lib/MessageManager');
const AIService = require('../../src/lib/AiService/Generation');
const VectorDB = require('../../src/lib/AiService/VectorDB');

describe('Message Flow Integration Tests', () => {
  let accountManager;
  let messageManager;
  let aiService;
  let vectorDB;

  before(async () => {
    accountManager = new AccountManager();
    messageManager = new MessageManager();
    aiService = new AIService();
    vectorDB = new VectorDB();
  });

  describe('End-to-end message generation and queuing', () => {
    it('should successfully generate and queue message', async () => {
      // 准备测试账号
      const testAccount = await accountManager.createAccount({
        id: 'test-integration',
        channels: ['test-channel'],
        topic: '测试话题'
      });

      // 生成消息
      const message = await generateMessage(testAccount);
      expect(message).to.be.a('string');

      // 添加到消息队列
      const result = await messageManager.add({
        account: testAccount,
        channelId: 'test-channel',
        content: message
      });

      expect(result.status).to.be.oneOf(['queued', 'sent']);
    });

    it('should handle concurrent message generation', async () => {
      const accounts = await Promise.all([
        accountManager.createAccount({ id: 'test1', channels: ['ch1'] }),
        accountManager.createAccount({ id: 'test2', channels: ['ch2'] })
      ]);

      const results = await Promise.all(
        accounts.map(account => generateMessage(account))
      );

      expect(results).to.have.lengthOf(2);
      results.forEach(msg => expect(msg).to.be.a('string'));
    });
  });
});
