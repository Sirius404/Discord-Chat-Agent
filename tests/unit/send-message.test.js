const MessageQueue = require('../src/lib/MessageManager');
const AccountManager = require('../src/lib/AccountManager');

jest.mock('../src/lib/fingerprint-engine');

describe.only('消息发送全流程测试', () => {
  let messageQueue;
  let testAccount;

  beforeAll(() => {
    // 初始化测试账号 
    const am = new AccountManager();
    [testAccount] = am.accounts;
    console.log(testAccount)
    testAccount.channels = ['945575912404049986'];
  });

  beforeEach(() => {
    messageQueue = new MessageQueue();
    jest.clearAllMocks();
  });

  test('成功发送消息', async () => {
    const mockSend = jest.fn().mockResolvedValue({ status: 'sent' });
    require('../src/lib/fingerprint-engine').prototype.sendMessage = mockSend;

    const result = await messageQueue.add({
      account: testAccount,
      channelId: testAccount.channels[0],
      content: '测试消息内容'
    });

    expect(result.status).toBe('sent');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test('消息队列积压处理', async () => {
    const mockSend = jest.fn()
      .mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ status: 'sent' }), 100))
      );

    require('../src/lib/fingerprint-engine').prototype.sendMessage = mockSend;

    // 快速添加5条消息
    const promises = Array(5).fill(0).map((_, i) => 
      messageQueue.add({
        account: testAccount,
        channelId: testAccount.channels[0],
        content: `消息${i}`
      })
    );

    const results = await Promise.all(promises);
    
    expect(results.filter(r => r.status === 'queued')).toHaveLength(4);
    expect(results.filter(r => r.status === 'sent')).toHaveLength(1);
  });

  test('发送失败重试机制', async () => {
    const mockSend = jest.fn()
      .mockRejectedValueOnce(new Error('速率限制'))
      .mockResolvedValue({ status: 'sent' });

    require('../src/lib/fingerprint-engine').prototype.sendMessage = mockSend;

    const result = await messageQueue.add({
      account: testAccount,
      channelId: testAccount.channels[0],
      content: '测试重试消息'
    });

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('sent');
  });

  test('跨频道消息分发', async () => {
    testAccount.channels = ['CHANNEL_A', 'CHANNEL_B'];
    const mockSend = jest.fn().mockResolvedValue({ status: 'sent' });
    require('../src/lib/fingerprint-engine').prototype.sendMessage = mockSend;

    await Promise.all(testAccount.channels.map(channelId =>
      messageQueue.add({
        account: testAccount,
        channelId,
        content: '多频道测试'
      })
    ));

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend.mock.calls[0][0]).toBe('CHANNEL_A');
    expect(mockSend.mock.calls[1][0]).toBe('CHANNEL_B');
  });

  afterAll(async () => {
    await messageQueue.closeAllSessions();
  });
});
