const FingerprintEngine = require('./fingerprint-engine');

class MessageQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.lastMessageTime = new Map();
    this.consecutiveMessages = new Map();
    this.globalLastMessageTime = new Date(0);
  }

  async add(task) {
    try {
      return await task();
    } catch (error) {
      console.error('消息处理过程中发生错误:', error);
      return {
        status: 'error',
        error: error
      };
    }
  }

  isWithinActiveHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // 周末
    if (day === 0 || day === 6) {
      return hour >= 10 && hour <= 23;
    }

    // 工作日
    if (hour >= 0 && hour < 3) return true;   // 早上通勤
    if (hour >= 11 && hour < 16) return true; // 午休
    if (hour >= 18 && hour <= 23) return true; // 晚上
    
    return false;
  }

  getNextMessageDelay(account) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const lastTime = this.lastMessageTime.get(account.id) || new Date(0);
    const minutesSinceLastMessage = Math.floor((now - lastTime) / (1000 * 60));
    const consecutive = this.consecutiveMessages.get(account.id) || 0;

    let baseDelay;
    
    if (day === 0 || day === 6) {
      if (hour >= 10 && hour < 23) {
        baseDelay = Math.floor(Math.random() * 31) + 15; // 15-45分钟
      } else {
        baseDelay = Math.floor(Math.random() * 61) + 30; // 30-90分钟
      }
    } else {
      if (hour >= 7 && hour < 9) {
        baseDelay = Math.floor(Math.random() * 16) + 5; // 5-20分钟
      } else if (hour >= 12 && hour < 14) {
        baseDelay = Math.floor(Math.random() * 21) + 10; // 10-30分钟
      } else if (hour >= 18 && hour <= 23) {
        baseDelay = Math.floor(Math.random() * 31) + 15; // 15-45分钟
      } else {
        baseDelay = Math.floor(Math.random() * 61) + 30; // 30-90分钟
      }
    }

    if (consecutive > 0) {
      if (Math.random() < 0.3 * consecutive) {
        baseDelay *= 2;
      }
    }

    if (minutesSinceLastMessage > 30) {
      if (Math.random() < 0.1) {
        return Math.floor(Math.random() * 3) + 1; // 1-3分钟
      }
      
      if (Math.random() < 0.05) {
        return Math.floor(Math.random() * 91) + 90; // 90-180分钟
      }
    }

    return baseDelay;
  }
}

class MessageManager {
  constructor() {
    this.queues = new Map();
    this.successCount = new Map();
  }

  createQueue(accountId) {
    if (!this.queues.has(accountId)) {
      this.queues.set(accountId, new MessageQueue());
      this.successCount.set(accountId, 0);
    }
    return this.queues.get(accountId);
  }

  getQueue(accountId) {
    return this.queues.get(accountId) || this.createQueue(accountId);
  }

  async sendMessage(account, channelId, content) {
    if (!account || !account.token) {
      console.error('账号配置无效:', account);
      throw new Error('无效的账号配置');
    }

    const engine = new FingerprintEngine(account);
    try {
      await engine.sendMessage(channelId, content);
      
      // 更新成功计数
      const currentCount = (this.successCount.get(account.id) || 0) + 1;
      this.successCount.set(account.id, currentCount);
      
      // 格式化当前时间
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-CN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      
      // 打印成功消息
      console.log(`✅ [${account.id}] ${timeStr} 消息发送成功 (今日第${currentCount}条)`);
      
      // 每10条消息打印一个统计
      if (currentCount % 10 === 0) {
        console.log(`🎉 [${account.id}] 已成功发送 ${currentCount} 条消息`);
      }
      
    } catch (error) {
      console.error(`[${account.id}] 发送失败:`, error);
      throw error;
    }
  }

  // 获取账号的发送统计
  getStats(accountId) {
    return {
      successCount: this.successCount.get(accountId) || 0
    };
  }
}

module.exports = MessageManager;
