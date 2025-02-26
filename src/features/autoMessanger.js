const FingerprintManager = require('../../lib/FingerprintManager');
const http2 = require('http2');

class AutoMessenger {
  constructor() {
    this.fpManager = new FingerprintManager();
    this.client = http2.connect(
      'https://discord.com', 
      this.fpManager.getRequestOptions()
    );
  }

  async sendMessage(channelId, content) {
    const req = this.client.request({
      ':method': 'POST',
      ':path': `/api/v9/channels/${channelId}/messages`,
      ...this.fpManager.currentProfile.headers
    });

    req.setEncoding('utf8');
    req.write(JSON.stringify({
      content: content,
      nonce: crypto.randomBytes(16).toString('hex'),
      tts: false
    }));

    return new Promise((resolve, reject) => {
      req.on('response', (headers) => {
        if (headers[':status'] === 200) {
          this.fpManager.rotate();
          resolve(true);
        } else {
          reject(new Error(`HTTP ${headers[':status']}`));
        }
      });
    });
  }
}