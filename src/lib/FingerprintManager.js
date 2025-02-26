const tls = require('tls');
const http2 = require('http2');
const crypto = require('crypto');
const path = require('path');
const DynamicParams = require('./DynamicParams');

class FingerprintManager {
    constructor() {
      this.profiles = [];
      this.currentProfile = null;
      this.metrics = {
        totalRequests: 0,
        successRate: 1.0
      };
    }
  
    loadProfiles(configPath) {
      try {
        // 使用path.resolve来确保正确的路径
        const configFilePath = path.resolve(__dirname, '../../config/fingerprint_profiles.json');
        this.profiles = require(configFilePath);
        
        if (!Array.isArray(this.profiles) || this.profiles.length === 0) {
          throw new Error('无效的指纹配置文件');
        }
        console.log(`成功加载了 ${this.profiles.length} 个指纹配置`);
      } catch (error) {
        throw new Error(`加载指纹配置失败: ${error.message}`);
      }
    }
  
    activateRandomProfile() {
      const index = Math.floor(Math.random() * this.profiles.length);
      this.currentProfile = this.profiles[index];
      this.validateProfile(this.currentProfile);
      console.log(`激活指纹配置: ${this.currentProfile.name}`);
    }
  
    validateProfile(profile) {
      const required = ['http2', 'tls', 'headers'];
      required.forEach(field => {
        if (!profile[field]) {
          throw new Error(`配置文件缺少${field}字段`);
        }
      });
    }

    getHTTPSettings() {
        if (!this.currentProfile?.http2?.settings) {
          throw new Error('当前指纹配置缺少HTTP/2设置');
        }
        return this.currentProfile.http2.settings;
    }

    createSecureContext() {
      if (!this.currentProfile?.tls) {
        throw new Error('当前指纹配置缺少TLS设置');
      }

      const { ciphers, extensions } = this.currentProfile.tls;
      return tls.createSecureContext({
        ciphers: ciphers.join(':'),
        sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256',
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3'
      });
    }

    getHeaders() {
      if (!this.currentProfile?.headers) {
        throw new Error('当前指纹配置缺少Headers设置');
      }
      return {
        ...this.currentProfile.headers,
        'x-super-properties': DynamicParams.generateXSuperProperties(),
        'x-fingerprint': this.generateFingerprint()
      };
    }

    getHeaderOrder() {
      return this.currentProfile?.http2?.headerOrder || [];
    }

    generateFingerprint() {
      if (!this.currentProfile) {
        throw new Error('未激活任何指纹配置');
      }
      // 使用配置的关键信息生成指纹
      const fingerprintData = {
        headers: this.currentProfile.headers,
        tls: this.currentProfile.tls,
        http2: this.currentProfile.http2
      };
      return crypto.createHash('sha256')
        .update(JSON.stringify(fingerprintData))
        .digest('hex')
        .substring(0, 32);
    }

    updateMetrics(success) {
      this.metrics.totalRequests++;
      const weight = 1 / Math.min(this.metrics.totalRequests, 100); // 使用移动平均
      this.metrics.successRate = (this.metrics.successRate * (1 - weight)) + (success ? weight : 0);
    }

    shouldRotateProfile() {
      return this.metrics.successRate < 0.5 && this.metrics.totalRequests > 10;
    }
}

module.exports = FingerprintManager;