const hre = require('hardhat');
const ethers = hre.ethers;

const REPLAY = require('./replay.json');

async function main() {
  const accounts = await ethers.getSigners();

  // Metadata
  const NameToAddress = REPLAY.reduce((acc, step) => ({
    ...acc, [step.name]: ethers.utils.getAddress(step.address), [ethers.utils.getAddress(step.address)]: step.name
  }), {});

  // Deploy wallets
  const walletfactory = new ethers.Contract(
    NameToAddress['WalletFactory'],
    [ 'function createWallet(address,address[],string) public' ],
    accounts[0],
  );

  const txs = await Promise.all(Array(100).fill().map(_ => walletfactory.createWallet(
    accounts[0].address,
    [ NameToAddress['ModuleManager'] ],
    ''
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
