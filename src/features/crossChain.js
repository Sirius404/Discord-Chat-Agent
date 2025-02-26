const { ethers } = require('ethers');
const { OFT } = require('kayerzero-oft');

// 初始化跨链操作
async function crossChainToken(tokenAddress, destinationChainId, amount) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const oft = new OFT(tokenAddress, signer);

  try {
    const tx = await oft.crossChainTransfer(destinationChainId, amount);
    await tx.wait();
    console.log(`跨链成功，交易哈希: ${tx.hash}`);
  } catch (error) {
    console.error('跨链失败:', error);
  }
}

module.exports = { crossChainToken };
