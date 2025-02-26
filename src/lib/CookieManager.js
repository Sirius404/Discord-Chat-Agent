const { CookieJar } = require('tough-cookie');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CookieManager {
  constructor() {
    // 修改存储路径到项目根目录的 cache/cookies
    this.storagePath = path.resolve(__dirname, '../../cache/cookies');
    this.jars = new Map(); // tokenHash => CookieJar
    
    // 确保目录存在
    try {
      fs.mkdirSync(this.storagePath, { recursive: true });
      console.log('Cookie存储目录:', this.storagePath);
    } catch (error) {
      console.error('创建Cookie存储目录失败:', error);
    }
    
    this.loadAll();
  }

  // 根据token生成唯一hash作为标识符
  #tokenToHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // 获取指定token的CookieJar
  #getJar(token) {
    const tokenHash = this.#tokenToHash(token);
    if (!this.jars.has(tokenHash)) {
      this.jars.set(tokenHash, new CookieJar());
    }
    return this.jars.get(tokenHash);
  }

  // 存储Cookie到指定账号
  store(token, response) {
    const jar = this.#getJar(token);
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      setCookie.forEach(cookieStr => {
        jar.setCookieSync(cookieStr, 'https://discord.com');
      });
      this.save(token);
    }
  }

  // 获取指定账号的Cookie头
  getHeader(token) {
    return this.#getJar(token).getCookieStringSync('https://discord.com');
  }

  // 保存指定账号的Cookie
  save(token) {
    const tokenHash = this.#tokenToHash(token);
    const jar = this.#getJar(token);
    const dataPath = path.join(this.storagePath, `${tokenHash}.json`);
    
    try {
      fs.writeFileSync(dataPath, JSON.stringify(jar.toJSON()));
    } catch (error) {
      console.error(`保存Cookie失败:`, error);
    }
  }

  // 加载所有已存储的Cookie
  loadAll() {
    try {
      if (!fs.existsSync(this.storagePath)) {
        console.warn('未找到Cookie存储目录，初始化空缓存');
        return;
      }

      const files = fs.readdirSync(this.storagePath);
      console.log(`找到 ${files.length} 个Cookie文件`);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.storagePath, file);
            const data = fs.readFileSync(filePath, 'utf8');
            const jar = CookieJar.fromJSON(data);
            const tokenHash = file.replace('.json', '');
            this.jars.set(tokenHash, jar);
          } catch (error) {
            console.error(`加载Cookie文件 ${file} 失败:`, error);
          }
        }
      });
    } catch (error) {
      console.error('加载Cookie失败:', error);
    }
  }

  // 清除指定账号的Cookie
  clear(token) {
    const tokenHash = this.#tokenToHash(token);
    this.jars.delete(tokenHash);
    try {
      fs.unlinkSync(path.join(this.storagePath, `${tokenHash}.json`));
    } catch (error) {
      console.error('清除Cookie失败:', error.message);
    }
  }
}

module.exports = new CookieManager();