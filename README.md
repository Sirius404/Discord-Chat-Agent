# Discord Bot

一个基于 AI 的 Discord 机器人，支持多账号和多频道管理。

## 特性

- 多账号支持
- 多频道管理
- 基于 AI 的自然对话
- 灵活的活动时间配置
- 自定义消息调度
- TLS 安全配置
- 指纹模拟

## 免责声明
本项目仅供学习和分享之用，旨在促进技术交流与知识传播。项目开发者不对因使用本项目而造成的任何直接或间接损失承担责任，包括但不限于经济损失、数据丢失、系统故障等。用户在使用本项目时应自行评估风险，并采取必要的防护措施。开发者不对因用户未能采取适当措施而导致的任何损失负责。

**特别提示：用户复制或下载本项目代码的行为，视为已阅读并同意本免责声明的全部内容。**

## 配置说明

### 账号配置 (accounts.json)

```json
{
  "accounts": [
    {
      "id": "account1",
      "token": "your-discord-token",
      "activityPattern": {
        "hours": "11-19",
        "daysOfWeek": "1-5",
        "timezone": "Asia/Shanghai"
      },
      "tls": {
        "ciphers": ["TLS_AES_128_GCM_SHA256"]
      },
      "channels": [
        {
          "id": "channel-id",
          "name": "general",
          "topic": "日常聊天",
          "schedule": {
            "messageDelay": {
              "min": 300000,
              "max": 600000
            },
            "nextExecutionDelay": {
              "min": 900000,
              "max": 1800000
            }
          }
        }
      ],
      "fingerprint": "chrome_macos_advanced"
    }
  ]
}
```

配置项说明：
- `id`: 账号唯一标识
- `token`: Discord 账号令牌
- `activityPattern`: 活动时间配置
  - `hours`: 活动时间段 (24小时制)
  - `daysOfWeek`: 活动日期 (1-7, 1为周一)
  - `timezone`: 时区
- `tls`: TLS 配置
  - `ciphers`: 加密套件列表
- `channels`: 频道配置列表
  - `id`: 频道 ID
  - `name`: 频道名称
  - `topic`: 频道主题
  - `schedule`: 消息调度配置
    - `messageDelay`: 消息间隔
    - `nextExecutionDelay`: 下一轮延迟
- `fingerprint`: 浏览器指纹配置

### AI 服务配置 (.env)

#### 配置指南

1. **环境变量设置**
   - `AI_API_KEY`: 填写你的 AI 服务 API 密钥
   - `AI_BASE_URL`: 配置 AI 服务的基础请求地址

3. **高级定制**
在src/lib/AiService中实现了向量数据库以及embedding方法，可自行使用供优化性能。 


## 安装

1. 克隆仓库
```bash
git clone <repository-url>
cd discord-bot
```

2. 安装依赖
```bash
npm install
```

3. 配置文件
- cp .env.example .env 并填写
- 创建 `accounts.json` 并配置账号信息

4. 启动服务
```bash
npm start
```

## 注意事项

1. 活动时间配置
   - 根据目标时区设置活动时间
   - 避免固定的发送间隔

2. 安全性
   - 妥善保管 Discord Token
   - 使用安全的 TLS 配置

3. 性能优化
   - 合理设置消息延迟
   - 避免过于频繁的 API 调用
