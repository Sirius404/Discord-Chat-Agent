const { crossChainToken } = require('./crossChain');
const { performance } = require('perf_hooks');

async function runPerformanceTest() {
  const start = performance.now();
  const promises = [];

  for (let i = 0; i < 100; i++) {
    promises.push(crossChainToken('0xTokenAddress', 1, '100'));
  }

  await Promise.all(promises);
  const end = performance.now();
  console.log(`100次跨链操作耗时: ${end - start}ms`);
}

runPerformanceTest();
