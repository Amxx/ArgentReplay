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
  const data   = await readCSV('./data/csv/export-0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11.csv');
  const txs    = await Promise.all(data.map(({ Txhash }) => ethers.provider.getTransaction(Txhash)));
  const replay = txs
  .filter(({ from }) => from === '0x46cf7ddb8bc751F666f691a4F96Aa45E88D55D11')
  .map(tx => ({
    from:  tx.from,
    to:    tx.to,
    value: tx.value.toHexString(),
    data:  tx.data,
    nonce: tx.nonce,
  }));

  console.log(JSON.stringify(replay));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
