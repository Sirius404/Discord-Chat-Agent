const { performance } = require('perf_hooks');
const { expect } = require('chai');
const AccountManager = require('../../src/lib/AccountManager');
const MessageManager = require('../../src/lib/MessageManager');

describe('Concurrency Performance Tests', () => {
  let accountManager;
  let messageManager;

  before(() => {
    accountManager = new AccountManager();
    messageManager = new MessageManager();
  });

  it('should handle multiple concurrent message generations', async () => {
    const CONCURRENT_REQUESTS = 10;
    const accounts = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => ({
      id: `perf-test-${i}`,
      channels: [`channel-${i}`],
      topic: '性能测试'
    }));

    const startTime = performance.now();
    
    const results = await Promise.all(
      accounts.map(account => generateMessage(account))
    );

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`处理 ${CONCURRENT_REQUESTS} 个并发请求耗时: ${totalTime}ms`);
    console.log(`平均每个请求耗时: ${totalTime / CONCURRENT_REQUESTS}ms`);

    // 性能指标验证
    expect(totalTime).to.be.below(5000); // 5秒内完成所有请求
    expect(totalTime / CONCURRENT_REQUESTS).to.be.below(500); // 每个请求平均不超过500ms
    
    results.forEach(result => {
      expect(result).to.be.a('string');
      expect(result.length).to.be.within(50, 100);
    });
  });

  it('should maintain message queue performance under load', async () => {
    const QUEUE_SIZE = 100;
    const messages = Array.from({ length: QUEUE_SIZE }, (_, i) => ({
      account: { id: `perf-${i}` },
      channelId: `channel-${i}`,
      content: `测试消息 ${i}`
    }));

    const startTime = performance.now();
    
    await Promise.all(
      messages.map(msg => messageManager.add(msg))
    );

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`消息队列处理 ${QUEUE_SIZE} 条消息耗时: ${totalTime}ms`);
    expect(totalTime).to.be.below(2000); // 2秒内完成所有队列操作
  });
});
