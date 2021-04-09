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

This script only replays the nonces 33, 36, 38, 39, 40 and 58 of this particular wallet. Dummy transactions are incerted between them. Before doing this on a live network, one should make sure that none of this is critical and would ever have to be replayed.
