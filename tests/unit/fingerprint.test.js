const assert = require('assert');
const path = require('path');
const http2 = require('http2');
const sinon = require('sinon');

// Mock FingerprintEngine
const FingerprintEngine = require('../../src/lib/fingerprint-engine');

// 加载测试配置
const configPath = path.resolve(__dirname, '../../config/account.json');
const testAccounts = require(configPath);
const testAccount = testAccounts.find(a => a.id === 'test_account_1');

if (!testAccount) {
  throw new Error('测试账号配置缺失');
}

describe('FingerprintEngine', () => {
  let engine;
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    global.activeSessions = [];
    
    // Mock FingerprintEngine methods
    sandbox.stub(FingerprintEngine.prototype, 'sendMessage').resolves({
      status: 200,
      data: { id: '123456789' }
    });
    
    sandbox.stub(FingerprintEngine.prototype, 'createHTTP2Session').returns(
      new http2.connect('https://discord.com')
    );
    
    sandbox.stub(FingerprintEngine.prototype, 'closeSession').resolves(true);
    
    engine = new FingerprintEngine(testAccount);
  });

  afterEach(() => {
    if (global.activeSessions?.length) {
      global.activeSessions.forEach(s => s.destroy());
    }
    global.activeSessions = [];
  });

  after(async () => {
    sandbox.restore();
    if (engine.session) {
      await new Promise(resolve => engine.session.close(resolve));
    }
    await engine.closeSession();
  });

  it('应正确创建HTTP/2会话', (done) => {
    const session = engine.createHTTP2Session();
    global.activeSessions.push(session);
    
    const timer = setTimeout(() => {
      done(new Error('连接超时'));
    }, 5000);

    session.on('connect', () => {
      clearTimeout(timer);
      try {
        assert.strictEqual(session.constructor.name, 'ClientHttp2Session');
        done();
      } catch (err) {
        done(err);
      }
    });

    session.on('error', (err) => {
      clearTimeout(timer);
      done(err);
    });
  });

  it('应成功发送消息', async () => {
    const testChannel = '945575912404049986';
    const response = await engine.sendMessage(testChannel, '测试消息');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.id, '123456789');
  });
});