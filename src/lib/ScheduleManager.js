const schedule = require('node-schedule');

class ScheduleManager {
  constructor() {
    this.taskHandlers = new Map(); // scheduleId => handler
    this.nextExecutionTimes = new Map(); // scheduleId => timestamp
    this.checkInterval = null;
  }

  setTaskHandler(scheduleId, handler) {
    this.taskHandlers.set(scheduleId, handler);
  }

  updateNextExecutionTime(scheduleId, timestamp) {
    this.nextExecutionTimes.set(scheduleId, timestamp);
  }

  getNextExecutionTime(scheduleId) {
    return this.nextExecutionTimes.get(scheduleId) || 0;
  }

  async executeTask(scheduleId) {
    const handler = this.taskHandlers.get(scheduleId);
    if (handler) {
      try {
        await handler();
      } catch (error) {
        console.error(`[${scheduleId}] 任务执行失败:`, error);
      }
    }
  }

  start() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // 每秒检查一次是否有需要执行的任务
    this.checkInterval = setInterval(() => {
      const now = Date.now();
      
      this.nextExecutionTimes.forEach((timestamp, scheduleId) => {
        if (timestamp <= now) {
          // 执行任务
          this.executeTask(scheduleId);
          // 移除执行时间，等待任务处理器设置下次执行时间
          this.nextExecutionTimes.delete(scheduleId);
        }
      });
    }, 1000);

    console.log('调度管理器已启动');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.nextExecutionTimes.clear();
    console.log('调度管理器已停止');
  }

  // 获取所有活跃的调度信息
  getActiveSchedules() {
    const now = Date.now();
    const schedules = [];
    
    this.nextExecutionTimes.forEach((timestamp, scheduleId) => {
      schedules.push({
        scheduleId,
        nextExecution: timestamp,
        timeUntilExecution: timestamp - now,
        active: timestamp > now
      });
    });

    return schedules;
  }

  // 暂停特定的调度
  pauseSchedule(scheduleId) {
    this.nextExecutionTimes.delete(scheduleId);
    console.log(`已暂停调度: ${scheduleId}`);
  }

  // 恢复特定的调度
  resumeSchedule(scheduleId, delayMs = 0) {
    const nextExecution = Date.now() + delayMs;
    this.updateNextExecutionTime(scheduleId, nextExecution);
    console.log(`已恢复调度: ${scheduleId}, 将在 ${delayMs/1000} 秒后执行`);
  }
}

module.exports = ScheduleManager;
