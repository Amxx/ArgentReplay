const hre = require('hardhat');
const ethers = hre.ethers;


const DEPLOYED = require('../data/all-0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11.json');
const REGISTRY = require('./registry');


async function impersonateAccount(address) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });
  const signer = await ethers.provider.getSigner(address);
  signer.address = address;
  return signer;
}

async function signerFastForward(signer, to) {
  const currentNonce = await signer.getTransactionCount()

  if (to < currentNonce) { throw new Error('SignerFastForward cannot go back to previous nonce'); }

  const txs = await Promise.all(Array(to - currentNonce).fill().map((_, i) => {
    return signer.sendTransaction({ to: ethers.constants.AddressZero, nonce: currentNonce + i });
  }));

  const receipts = await Promise.all(txs.map(tx => tx.wait()));
}

async function main() {
  const [ admin ] = await ethers.getSigners();

  const signers = await Object.values(DEPLOYED)
    .map(({ from }) => from)
    .filter((value, index, self) => self.indexOf(value) === index)
    .reduce(async (accPromise, address) => {
      const acc    = await accPromise;
      const signer = await impersonateAccount(address);
      return {
        ...acc,
        [ethers.utils.getAddress(address)]: signer,
        [address.toLowerCase()]: signer,
      };
    }, Promise.resolve({}));

  await Promise.all((
    await Promise.all(Object.values(signers).map(({ address }) => admin.sendTransaction({ to: address, value: ethers.utils.parseEther('1.0') })))
  ).map(tx => tx.wait()));

  // ##########################################################################
  // #                              LETS DANCE !                              #
  // ##########################################################################

  // First 66 txs (this is enough for now)
  txs = DEPLOYED.slice(0, 66);
  // this is a duplicate one, so we can use that to inject one more manager
  txs[45].data = txs[45].data.slice(0, -40) + admin.address.toLowerCase().slice(2)

  // might want to remove some of these
  // txs[somenumber] = undefined

  // Replay deployment
  for (const tx of txs) {
    // skip deleted txs
    if (!tx) continue;

    // replace the multisig with out admin
    tx.data = tx.data.replace('a5c603e1c27a96171487aea0649b01c56248d2e8', admin.address.slice(2).toLowerCase());

    // replay tx
    process.stdout.write(`Replaying tx ${tx.from}:${tx.nonce} ... `);
    if (tx.nonce) {
      await signerFastForward(signers[tx.from], tx.nonce);
    }
    const txpromise = await signers[tx.from].sendTransaction(tx);
    const receipt   = await txpromise.wait();
    process.stdout.write(`success\n`);
  }

  // Module registration
  const moduleregistry = new ethers.Contract(
    REGISTRY['ModuleRegistry'],
    ['function registerModule(address,bytes32) public'],
    admin,
  );

  // only one module for now
  for (const module of ['ModuleManager']) {
    await moduleregistry.registerModule(REGISTRY[module], ethers.constants.HashZero);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
