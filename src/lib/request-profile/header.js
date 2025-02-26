const { v4: uuidv4 } = require('uuid');

module.exports.generateHeaders = () => ({
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  'x-request-id': uuidv4(),
  'x-client-timestamp': Date.now().toString(),
  // ...其他动态头...
});