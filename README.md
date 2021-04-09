Argent Replay
===

Introduction
---

This is a prototype to demonstrate how to redeploy old argent wallets, from the early days, to an EVM chain like xDAI.


Testing
---

1. Start a node

  ```npx hardhat node```

2. Deploy a minimal Argent infrastructure:

  ```npx hardhat run script/deploy.js --network --localhost```

3. Create a batch of 100 wallets

  ```npx hardhat run script/wallets.js --network --localhost```

How does it work ?
---

This script deploys a minimal argent factory, by impersonating the argent deployment wallet (`0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11`). This is possible in test environment but NOT on live chains. Thus, only Argent could eventually do that live.

Once the factory is deployed, the `wallets.js` will create a batch of wallets that match the address of the old one. The wallet created are minimal, with just the `ModuleManager` module enabled, and are owned by the deployment wallet.

Since the wallet addresses are sequentials, you have no shortcut possible. If I am the older of the 5000th wallet created, there is no other option then to recreate the 5000 first wallets, until the "correct" one is recreated.

How it that usefull ?
---

If argent was to use the private key associated with `0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11` to do this deployment on xDAI, and would then create batch of wallets with one of their key as the owner, they would have a pool of wallets that they could reconfigure (enable more modules + transfer ownership) to their legitimate owner.

This attribution process itself would not be decentralized, but once given back to the users, the wallets would have the same security model as they have on mainnet.

Warning / disclaimer
---

This script replays the 66 first transaction by `0x46cf7ddb8bc751f666f691a4f96aa45e88d55d11`. This should be enough to setup a minimal platform. Some of these are to contract that might not exist on other chains (ENS related). They should probably me replace or deleted (in which case a dummy transaction will be inserted to ensure nonce are synched).
In addition, the multisig at `0xa5c603e1c27a96171487aea0649b01c56248d2e8` is replaced by an EOA to simplify operations. Activity of this multisig should be analysed and replayed using the EOA. If in doubt, don't do anything on a live network and raise an issue! 
