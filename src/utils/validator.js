const { decodeXSuperProperties } = require('../lib/DynamicParams');
const tls = require('tls');
const https = require('https');

class Validator {
  static async testFingerprint(profile) {
    const socket = tls.connect({
      host: 'discord.com',
      port: 443,
      ciphers: profile.tls.ciphers.join(':'),
      servername: 'discord.com',
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
      sigalgs: 'ecdsa_secp256r1_sha256',
      curves: 'X25519:secp256r1'
    });

    return new Promise((resolve) => {
      socket.on('secureConnect', () => {
        resolve(socket.getProtocol() === 'TLSv1.3');
      });
    });
  }
  static validateTLSFingerprint(ja3) {
    const parts = ja3.split(',');
    return parts.length === 5 && 
      parts[0] === '771' &&
      parts[4] === '0';
  }
  static checkGREASEFrames(session) {
    return session.remoteSettings.greaseFrames !== undefined;
  }
  static async checkHTTP2(profile) {
    const session = http2.connect('https://discord.com', {
      settings: profile.http2.settings
    });
    
    return session.settings(profile.http2.settings)
      .then(() => true)
      .catch(() => false);
  }
}
module.exports = {
    Validator
  };