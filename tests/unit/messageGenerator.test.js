const { expect } = require('chai');
const sinon = require('sinon');
const { generateMessage } = require('../../src/index');
const AIService = require('../../src/lib/AiService/Generation');
const VectorDB = require('../../src/lib/AiService/VectorDB');

describe('Message Generator Tests', () => {
  let aiService;
  let vectorDB;
  
  beforeEach(() => {
    aiService = new AIService();
    vectorDB = new VectorDB();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('generateMessage', () => {
    it('should generate message with default topic', async () => {
      const account = { id: 'test-id', topic: null };
      const searchStub = sinon.stub(vectorDB, 'searchRelatedMessages').resolves([]);
      const generateStub = sinon.stub(aiService, 'generateMessage').resolves('测试消息');

      const message = await generateMessage(account);
      
      expect(message).to.be.a('string');
      expect(searchStub.calledWith('日常聊天', 'test-id')).to.be.true;
      expect(generateStub.calledOnce).to.be.true;
    });

    it('should handle errors gracefully', async () => {
      const account = { id: 'test-id', topic: '测试' };
      sinon.stub(vectorDB, 'searchRelatedMessages').rejects(new Error('DB Error'));

      const message = await generateMessage(account);
      
      expect(message).to.include('抱歉');
    });

    it('should respect message length constraints', async () => {
      const account = { id: 'test-id', topic: '测试' };
      sinon.stub(vectorDB, 'searchRelatedMessages').resolves(['历史消息']);
      const message = await generateMessage(account);
      
      expect(message.length).to.be.within(50, 100);
    });
  });
});
