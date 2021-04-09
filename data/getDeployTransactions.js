const csv = require('csv-parser');
const fs = require('fs');
const hre = require('hardhat');
const ethers = hre.ethers;

function readCSV(path) {
  return new Promise(async (resolve, reject) => {
    const buffer = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on('data', (row) => buffer.push(row))
      .on('end', () => resolve(buffer));
  });
}

async function main() {
  const data      = await readCSV('./data/csv/export-0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11.csv');
  const receipt   = await Promise.all(data.map(async ({ Txhash: txhash }) => ({ ...(await ethers.provider.getTransactionReceipt(txhash)), txhash })));
  const contracts = receipt.filter(({ contractAddress }) => contractAddress).reduce((acc, { contractAddress, txhash }) => ({ ...acc, [contractAddress]: txhash }), {});
  const txs = await Promise.all(Object.values(contracts).map(txhash => ethers.provider.getTransaction(txhash)));
  const summary = txs.reduce((acc, tx) => ({ ...acc, [tx.creates]: {
    value: tx.value.toNumber(),
    data:  tx.data,
    nonce: tx.nonce,
  }}), {});
  
  console.log(summary)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
