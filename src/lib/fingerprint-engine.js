const https = require('https');
const tls = require('tls');
const path = require('path');
const FingerprintManager = require('./FingerprintManager');
const CookieManager = require('./CookieManager');
const DynamicParams = require('./DynamicParams');

class FingerprintEngine {
  constructor(account) {
    this.account = account;
    this.configPath = path.resolve(__dirname, '../../config/fingerprint_profiles.json');
    this.token = account.token;
    console.log('初始化指纹引擎:', this.account.id);
    this.fingerprintManager = new FingerprintManager();
    this.initialize();
  }

  initialize() {
    this.validateEnvironment();
    this.fingerprintManager.loadProfiles(this.configPath);
    this.fingerprintManager.activateRandomProfile();
  }

  validateEnvironment() {
    if (!this.token) {
      throw new Error('必须设置token');
    }
  }

  async sendMessage(channelId, content) {
    try {
      const headers = {
        ...this.fingerprintManager.getHeaders(),
        'Host': 'discord.com',
        'Authorization': this.token,
        'Cookie': CookieManager.getHeader(this.token),
        'Content-Type': 'application/json'
      };

      const payload = JSON.stringify({
        content,
        nonce: Date.now().toString(),
        tts: false
      });

      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'discord.com',
          port: 443,
          path: `/api/v9/channels/${channelId}/messages`,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(payload)
          },
          createConnection: () => {
            return tls.connect({
              host: 'discord.com',
              port: 443,
              servername: 'discord.com',
              ...this.fingerprintManager.createSecureContext()
            });
          }
        };

        const req = https.request(options, (res) => {
          const status = res.statusCode;
          this.fingerprintManager.updateMetrics(status < 400);
          
          if (status >= 400) {
            reject(new Error(`HTTP ${status}: ${res.headers['x-ratelimit-reset-after'] || 'Unknown error'}`));
            return;
          }

          let data = '';
          res.on('data', chunk => data += chunk);
          
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (e) {
              reject(new Error('无效的响应数据'));
            }
          });
        });

        req.on('error', (error) => {
          console.error(`[${this.account.id}] 请求错误:`, error);
          reject(error);
        });

        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.error(`[${this.account.id}] 发送消息失败:`, error);
      throw error;
    }
  }
}

module.exports = FingerprintEngine;