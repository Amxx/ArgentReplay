const hre = require('hardhat');
const ethers = hre.ethers;

const REPLAY = require('./replay.json');

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

  const signers = await REPLAY
    .map(({ from}) => from)
    .filter((value, index, self) => self.indexOf(value) === index)
    .reduce(async (acc, address) => ({ ...(await acc), [address]: await impersonateAccount(address) }), Promise.resolve({}));

  {
    const txs = await Promise.all(Object.values(signers).map(({ address }) => accounts[0].sendTransaction({ to: address, value: ethers.utils.parseEther('1.0') })));
    const receipts = await Promise.all(txs.map(tx => tx.wait()));
  }

  // ##########################################################################
  // #                              LETS DANCE !                              #
  // ##########################################################################

  // Metadata
  const NameToAddress = REPLAY.reduce((acc, step) => ({
    ...acc, [step.name]: ethers.utils.getAddress(step.address), [ethers.utils.getAddress(step.address)]: step.name
  }), {});


  // initial deployment
  for (const step of REPLAY) {
    process.stdout.write(`Executing ${step.name} ...`);
    if (step.tx.nonce) {
      await signerFastForward(signers[step.from], step.tx.nonce);
    }
    const tx      = await signers[step.from].sendTransaction(step.tx);
    const receipt = await tx.wait();
    if (step.address && receipt.contractAddress !== ethers.utils.getAddress(step.address)) {
      throw new Error('Error during deployment');
    }
    process.stdout.write(`success\n`);
  }

  // Module registration
  const moduleregistry = new ethers.Contract(
    NameToAddress['ModuleRegistry'],
    [ 'function registerModule(address,bytes32) public' ],
    signers['0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11'],
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
    await moduleregistry.registerModule(NameToAddress[module], ethers.constants.HashZero);
  }

  // Set as manager
  await signers['0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11'].sendTransaction({
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
