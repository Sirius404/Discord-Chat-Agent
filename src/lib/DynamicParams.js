// DynamicParams.js
const crypto = require('crypto');

class DynamicParams {
  static generateXSuperProperties() {
    const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36`;
    const properties = {
      os: "Mac OS X",
      browser: "Chrome",
      device: "",
      system_locale: "en-US",
      browser_user_agent: userAgent,
      browser_version: "132.0.0.0",
      os_version: "10.15.7",
      referrer: "",
      referring_domain: "",
      referrer_current: "",
      referring_domain_current: "",
      release_channel: "stable",
      client_build_number: 364791,
      client_event_source: null
    };

    return this.encodeProperties(properties);
  }

  static encodeProperties(obj) {
    const jsonStr = JSON.stringify(obj);
    return Buffer.from(jsonStr).toString('base64');
  }
}

module.exports = DynamicParams;