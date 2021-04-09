const { ethers } = require('hardhat');

const NAMES = {
  '0xB1dD690Cc9AF7BB1a906A9B5A94F94191cc553Ce': 'BaseWallet',
  '0xc17D432Bd8e8850Fd7b32B0270f5AfAc65DB0105': 'ModuleRegistry',
  '0xDa1756Bb923Af5d1a05E277CB1E54f1D0A127890': 'ArgentENSResolver',
  '0x30B406DD3Cc461112bCD0DD2a2EaF0641c1a1d62': 'ArgentENSManager',
  '0x851cC731ce1613AE4FD8EC7F61F4B350F9CE1020': 'WalletFactory',
  '0x4DD68a6C27359E5640Fa6dCAF13631398C5613f1': 'ModuleManager'
}

module.exports = Object.entries(NAMES).reduce((acc, [ address, name ]) => ({
    ...acc,
    [name]: address,
    [address.toLowerCase()]: name,
    [ethers.utils.getAddress(address)]: name,
  }), {});
