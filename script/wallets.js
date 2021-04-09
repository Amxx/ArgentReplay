const hre = require('hardhat');
const ethers = hre.ethers;

const REGISTRY = require('./registry');


async function main() {
  const accounts = await ethers.getSigners();

  // Deploy wallets
  const walletfactory = new ethers.Contract(
    REGISTRY['WalletFactory'],
    ['function createWallet(address,address[],string)'],
    accounts[0],
  );

  const txs = await Promise.all(Array(100).fill().map(_ => walletfactory.createWallet(
    accounts[0].address,
    [REGISTRY['ModuleManager']],
    '',
    { gasLimit: 201316 },
  )));

  const receipts = await Promise.all(txs.map(tx => tx.wait()));
  const wallets = receipts.map(({ events }) => {
      const [ topic, wallet, owner ] = events.find(({ address }) => address == walletfactory.address).topics;
      return ethers.utils.getAddress(wallet.slice(-40));
  });

  console.log(wallets);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
