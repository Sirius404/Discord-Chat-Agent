const forge = require('node-forge');
const fs = require('fs');

module.exports = class TLSGenerator {
  constructor() {
    this.certPool = JSON.parse(fs.readFileSync('./src/lib/tls-fingerprint/pool.json'));
  }

  getRandomCert() {
    return this.certPool[Math.floor(Math.random() * this.certPool.length)];
  }

  createSecureContext() {
    const { key, cert, ...config } = this.getRandomCert();
    return tls.createSecureContext({
      key,
      cert,
      ciphers: config.cipherSuites,
      sigalgs: config.signatureAlgorithms,
      curves: config.ellipticCurves,
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3'
    });
  }
}