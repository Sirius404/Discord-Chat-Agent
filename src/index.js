const ScheduleManager = require('./lib/ScheduleManager');
const AccountManager = require('./lib/AccountManager');
const MessageManager = require('./lib/MessageManager');
const AIService = require('./lib/AiService/Generation');
const VectorDB = require('./lib/AiService/VectorDB');

class DiscordBot {
  constructor() {
    this.accountManager = new AccountManager();
    this.scheduleManager = new ScheduleManager();
    this.messageManager = new MessageManager();
    this.aiService = new AIService();
    this.vectorDB = new VectorDB();
    this.channelSchedules = new Map(); // 用于存储每个频道的调度信息
  }

  async initialize() {
    await this.accountManager.loadAccounts();
    await this.setupSchedules();
  }

  getRandomDelay(min = 300000, max = 600000) { // 5-10分钟的随机延迟
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async generateMessage(account, channelId) {
    try {
      // 获取频道特定的主题，如果没有则使用账号默认主题
      const channelConfig = account.channels?.find(c => c.id === channelId);
      const topic = channelConfig?.topic || account.topic || '日常聊天';
      
      // 使用频道ID和主题获取相关历史消息
      const history = await this.vectorDB.searchRelatedMessages(topic, `${account.id}_${channelId}`);
      
      const prompt = `作为一个资深的加密社区原生用户，请基于以下历史聊天记录自然地加入对话：
主题：${topic}
频道：${channelId}

要求：
1. 语气要像真实的加密社区用户：
   - 使用加密社区常见的术语和缩写(例如: gm/wagmi/lfg等)
   - 态度积极但不过分热情
   - 偶尔使用一些俚语或梗
   
2. 回复特点：
   - 长度要随机自然(10-100字之间)
   - 有时简短随意，有时稍微详细
   - 口语化表达，避免太过正式
   
3. 互动方式：
   - 自然地接上他人的话题
   - 偶尔提出相关的问题
   - 适当使用表情符号，但不要过度
   - 可以表达不同意见，但保持友好
   
4. 禁止事项：
   - 不要重复已说过的内容
   - 避免过于专业或学术的语气
   - 不要过分认同或附和
   - 不要暴露是AI的身份`;
      
      console.log(`准备为账号 ${account.id} 在频道 ${channelId} 生成消息`);
      const message = await this.aiService.generateMessage(prompt);
      console.log(`[${account.id}][${channelId}] 生成的消息:`, message);
      return message;
    } catch (error) {
      console.error(`[${account.id}][${channelId}] 消息生成失败:`, error);
      console.error('错误堆栈:', error.stack);
      return `抱歉，我现在有点累了，稍后再和你聊天吧~ 😊`;
    }
  }

  async setupSchedules() {
    const accounts = this.accountManager.getAllAccounts();
    
    // 为每个账号创建消息队列
    accounts.forEach(account => {
      this.messageManager.createQueue(account.id);
      
      // 获取账号的所有频道配置
      const channels = account.channels || [{ id: account.defaultChannelId || '945575912404049986' }];
      
      // 为每个频道创建独立的调度
      channels.forEach(channel => {
        const scheduleId = `${account.id}_${channel.id}`;
        
        // 设置调度处理器
        this.scheduleManager.setTaskHandler(scheduleId, async () => {
          try {
            // 生成随机延迟（5-10分钟）
            const delay = this.getRandomDelay();
            console.log(`[${account.id}][${channel.id}] 延迟 ${Math.floor(delay/1000)} 秒后开始发送消息`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // 生成并发送消息
            const message = await this.generateMessage(account, channel.id);
            
            await this.messageManager.getQueue(account.id).add(async () => {
              await this.messageManager.sendMessage(account, channel.id, message);
            });

            // 生成下一次发送的随机延迟（15-30分钟）
            const nextDelay = this.getRandomDelay(15 * 60 * 1000, 30 * 60 * 1000);
            console.log(`[${account.id}][${channel.id}] 下次发送将在 ${Math.floor(nextDelay/1000)} 秒后`);
            
            // 更新下次执行时间
            this.scheduleManager.updateNextExecutionTime(scheduleId, Date.now() + nextDelay);

          } catch (error) {
            console.error(`[${account.id}][${channel.id}] 任务执行失败:`, error);
          }
        });

        // 设置初始延迟
        const baseDelay = Math.random() * 60 * 1000; // 0-60秒的随机初始延迟
        const initialDelay = Date.now() + baseDelay;
        
        console.log(`[${account.id}][${channel.id}] 首次任务将在 ${Math.floor(baseDelay/1000)} 秒后开始`);
        this.scheduleManager.updateNextExecutionTime(scheduleId, initialDelay);
      });
    });
  }

  start() {
    this.scheduleManager.start();
    console.log('智能调度系统已启动，开始监控计划任务...');
  }
}

// 启动机器人
const bot = new DiscordBot();
bot.initialize().then(() => {
  bot.start();
}).catch(error => {
  console.error('启动失败:', error);
});

// 保持进程运行
setInterval(() => {}, 1 << 30);