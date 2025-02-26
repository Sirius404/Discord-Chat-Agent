const fs = require("fs");
const path = require("path");

class AccountManager {
  constructor() {
    this.accounts = new Map();
    this.loadAccounts();
  }

  loadAccounts() {
    try {
      const data = fs.readFileSync(path.join(__dirname, '../..', 'config','accounts.json'));
      const { accounts } = JSON.parse(data);
      if (!Array.isArray(accounts)) {
        throw new Error('Invalid accounts configuration: accounts must be an array');
      }
      accounts.forEach(account => {
        this.addAccount({
          ...account,
          metrics: {
            successCount: 0,
            failureCount: 0
          }
        });
      });
      console.log(`成功加载 ${accounts.length} 个账号配置`);
    } catch (error) {
      console.error('加载账号配置失败:', error);
      throw error;
    }
  }

  createAccount(data) {
    const account = {
      id: data.id,
      channels: data.channels || [],
      topic: data.topic || '日常聊天',
      token: data.token,
      metrics: {
        successCount: 0,
        failureCount: 0
      }
    };
    this.addAccount(account);
    return account;
  }

  addAccount(account) {
    if (!account.metrics) {
      account.metrics = {
        successCount: 0,
        failureCount: 0
      };
    }
    this.accounts.set(account.id, account);
  }

  getAccount(id) {
    return this.accounts.get(id);
  }

  getAllAccounts() {
    return Array.from(this.accounts.values());
  }
}

module.exports = AccountManager;
