const { expect } = require('chai');
const sinon = require('sinon');
const ScheduleManager = require('../../src/lib/ScheduleManager');

describe('ScheduleManager', () => {
  let scheduleManager;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    scheduleManager = new ScheduleManager();
  });

  afterEach(() => {
    clock.restore();
    scheduleManager.stop();
  });

  describe('基本功能', () => {
    it('应该能够设置任务处理器', () => {
      const handler = () => {};
      scheduleManager.setTaskHandler('test_schedule', handler);
      expect(scheduleManager.taskHandlers.get('test_schedule')).to.equal(handler);
    });

    it('应该能够更新下次执行时间', () => {
      const timestamp = Date.now() + 1000;
      scheduleManager.updateNextExecutionTime('test_schedule', timestamp);
      expect(scheduleManager.getNextExecutionTime('test_schedule')).to.equal(timestamp);
    });
  });

  describe('任务执行', () => {
    it('应该在指定时间执行任务', async () => {
      const handler = sinon.spy();
      const scheduleId = 'test_schedule';
      const delay = 5000;

      scheduleManager.setTaskHandler(scheduleId, handler);
      scheduleManager.updateNextExecutionTime(scheduleId, Date.now() + delay);
      scheduleManager.start();

      // 验证任务还未执行
      expect(handler.called).to.be.false;

      // 前进时间
      await clock.tickAsync(delay + 1000);

      // 验证任务已执行
      expect(handler.calledOnce).to.be.true;
    });

    it('应该处理多个调度', async () => {
      const handler1 = sinon.spy();
      const handler2 = sinon.spy();
      
      scheduleManager.setTaskHandler('schedule1', handler1);
      scheduleManager.setTaskHandler('schedule2', handler2);
      
      scheduleManager.updateNextExecutionTime('schedule1', Date.now() + 3000);
      scheduleManager.updateNextExecutionTime('schedule2', Date.now() + 5000);
      
      scheduleManager.start();

      // 前进3秒，第一个任务应该执行
      await clock.tickAsync(3500);
      expect(handler1.calledOnce).to.be.true;
      expect(handler2.called).to.be.false;

      // 再前进2秒，第二个任务应该执行
      await clock.tickAsync(2000);
      expect(handler2.calledOnce).to.be.true;
    });
  });

  describe('错误处理', () => {
    it('应该优雅地处理任务执行错误', async () => {
      const errorHandler = sinon.spy();
      const failingHandler = async () => {
        throw new Error('测试错误');
      };

      // 捕获控制台错误
      sinon.stub(console, 'error').callsFake(errorHandler);

      scheduleManager.setTaskHandler('failing_schedule', failingHandler);
      scheduleManager.updateNextExecutionTime('failing_schedule', Date.now() + 1000);
      scheduleManager.start();

      await clock.tickAsync(1500);

      expect(errorHandler.called).to.be.true;
      expect(errorHandler.args[0][1].message).to.equal('测试错误');

      console.error.restore();
    });
  });

  describe('调度管理', () => {
    it('应该能够获取所有活跃的调度', () => {
      const now = Date.now();
      scheduleManager.updateNextExecutionTime('schedule1', now + 1000);
      scheduleManager.updateNextExecutionTime('schedule2', now + 2000);

      const activeSchedules = scheduleManager.getActiveSchedules();
      expect(activeSchedules).to.have.length(2);
      expect(activeSchedules[0].scheduleId).to.equal('schedule1');
      expect(activeSchedules[1].scheduleId).to.equal('schedule2');
    });

    it('应该能够暂停和恢复调度', () => {
      const scheduleId = 'test_schedule';
      const handler = sinon.spy();

      scheduleManager.setTaskHandler(scheduleId, handler);
      scheduleManager.updateNextExecutionTime(scheduleId, Date.now() + 1000);

      // 暂停调度
      scheduleManager.pauseSchedule(scheduleId);
      expect(scheduleManager.getNextExecutionTime(scheduleId)).to.equal(0);

      // 恢复调度
      scheduleManager.resumeSchedule(scheduleId, 2000);
      expect(scheduleManager.getNextExecutionTime(scheduleId)).to.be.above(Date.now());
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量并发调度', async () => {
      const scheduleCount = 1000;
      const handlers = new Array(scheduleCount).fill(null).map(() => sinon.spy());
      
      // 创建大量调度
      for (let i = 0; i < scheduleCount; i++) {
        const scheduleId = `schedule_${i}`;
        scheduleManager.setTaskHandler(scheduleId, handlers[i]);
        scheduleManager.updateNextExecutionTime(scheduleId, Date.now() + Math.random() * 5000);
      }

      scheduleManager.start();
      
      // 等待所有任务执行完成
      await clock.tickAsync(6000);

      // 验证所有任务都已执行
      handlers.forEach(handler => {
        expect(handler.calledOnce).to.be.true;
      });
    });
  });
});
