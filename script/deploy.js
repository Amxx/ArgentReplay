const hre = require('hardhat');
const ethers = hre.ethers;


const DEPLOYED = require('../data/deployed-0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11.json');
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
  const accounts = await ethers.getSigners();

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

  {
    const txs = await Promise.all(Object.values(signers).map(({ address }) => accounts[0].sendTransaction({ to: address, value: ethers.utils.parseEther('1.0') })));
    const receipts = await Promise.all(txs.map(tx => tx.wait()));
  }

  // ##########################################################################
  // #                              LETS DANCE !                              #
  // ##########################################################################

  // initial deployment
  for (const [ address, tx ] of Object.entries(DEPLOYED)) {
    const name = REGISTRY[address] ?? ethers.utils.getAddress(address);

    // beyound that, we need more initialisation
    if (tx.nonce == 94) break;

    process.stdout.write(`Deploying ${name} ... `);
    if (tx.nonce) {
      await signerFastForward(signers[tx.from], tx.nonce);
    }
    const txpromise = await signers[tx.from].sendTransaction(tx);
    const receipt   = await txpromise.wait();
    if (tx.address && receipt.contractAddress !== ethers.utils.getAddress(tx.address)) {
      throw new Error('Error during deployment');
    }
    process.stdout.write(`success\n`);
  }

  // Module registration
  const moduleregistry = new ethers.Contract(
    REGISTRY['ModuleRegistry'],
    [ 'function registerModule(address,bytes32) public' ],
    signers['0x46cf7ddb8bc751F666f691a4F96Aa45E88D55D11'],
  );

  for (const module of [
    'ModuleManager',
    // 'ApprovedTransfer',
    // 'DappManager',
    // 'GuardianManager',
    // 'LockManager',
    // 'RecoveryManager',
    // 'TokenTransfer',
    // 'TokenExchanger',
  ])
  {
    await moduleregistry.registerModule(REGISTRY[module], ethers.constants.HashZero);
  }

  // Set as manager
  await signers['0x46cf7ddb8bc751F666f691a4F96Aa45E88D55D11'].sendTransaction({
    to: '0x851cc731ce1613ae4fd8ec7f61f4b350f9ce1020',
    data: '0x2d06177a000000000000000000000000' + accounts[0].address.slice(2),
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
