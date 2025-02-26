const fs = require('fs');
const FingerprintEngine = require('../src/lib/fingerprint-engine');
const AccountManager = require('../src/lib/AccountManager');
const manager = new AccountManager(config);
(async () => {
  try {
    const config = JSON.parse(fs.readFileSync('/home/ubuntu/eliza/discord/src/config/account.json'));
    manager.loadAccounts();
    
    for (const account of config.accounts) {
    const delay = Math.floor(Math.random() * 3000) + 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`正在使用账户 ${account.id} 发送消息...`);
      
      const engine = new FingerprintEngine(account);
      for (const channelId of account.channels) {
        try {
          const response = await engine.sendMessage(
            channelId,
            `来自 ${account.id} 的测试消息`
          );
          console.log(`[${account.id}] 发送成功到频道 ${channelId}:`, response.status);
        } catch (error) {
          console.error(`[${account.id}] 发送失败到 ${channelId}:`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒间隔
      }
    }
    
  } catch (error) {
    console.error('配置加载失败:', error.message);
  }
})();

