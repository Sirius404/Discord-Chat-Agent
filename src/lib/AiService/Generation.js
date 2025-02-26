const request = require('request-promise-native');
const path = require('path');
const dotenv = require('dotenv');

// 配置 dotenv 加载项目根目录的 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class AIService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY;
    this.baseURL = process.env.AI_BASE_URL || 'https://api.gpt.ge/v1';
    this.model = 'gpt-4o';
    
    // 验证必要的配置
    if (!this.apiKey) {
      console.error('Environment variables:', process.env);
      throw new Error('AI_API_KEY not found in environment variables. Please check your .env file configuration.');
    }
  }

  async generateMessage(prompt, maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const options = {
          method: 'POST',
          url: `${this.baseURL}/chat/completions`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: {
            model: this.model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1688,
            temperature: 0.7,
            stream: false
          },
          json: true // 自动处理 JSON
        };

        const response = await request(options);
        
        if (response.choices && response.choices[0]) {
          return response.choices[0].message.content.trim();
        } else {
          throw new Error('Invalid API response format');
        }

      } catch (error) {
        console.error(`AI generation attempt ${retryCount + 1} failed:`, error.message);
        
        // 处理特定的错误类型
        if (error.statusCode === 429) {
          // 限流错误，等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        } else if (error.statusCode === 401) {
          // API key 无效
          throw new Error('Invalid API key');
        } else if (error.statusCode === 503) {
          // 服务暂时不可用
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        } else if (retryCount === maxRetries - 1) {
          // 最后一次重试失败
          throw new Error(`Failed to generate message after ${maxRetries} attempts: ${error.message}`);
        }
        
        retryCount++;
      }
    }
  }

  // 用于测试 API 连接
  async testConnection() {
    try {
      const testPrompt = 'gm';
      const response = await this.generateMessage(testPrompt);
      return {
        success: true,
        message: 'API connection test successful',
        response
      };
    } catch (error) {
      return {
        success: false,
        message: 'API connection test failed',
        error: error.message
      };
    }
  }
}

module.exports = AIService;
