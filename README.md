# Ethgate

**Ethgate** is a library for automatically batching calls made to Ethereum compatible chains.

This library is experimental, feedback is appreciated.

API Reference: https://cardpunks.github.io/ethgate/

Used in production by [Cardpunks](https://twitter.com/cardpunks).

Used in [Ethereum Social Club (pre-release)](https://twitter.com/AlicanC/status/1427425010910736386).

## Usage

```ts
import { Contract as EthersContract } from '@ethersproject/contracts';
import { InfuraProvider as EthersInfuraProvider } from '@ethersproject/providers';
import { EthgateChain } from 'ethgate';

const ethersMainnetProvider = new EthersInfuraProvider('homestead');

const ensRegistryContract = new EthersContract(
  '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  ensRegistryContractInterface,
);

const names = ['resolver.eth', 'cardpunks.eth', 'alicanc.eth'];

// Initialize an EthgateChain
const mainnet = new EthgateChain(ethersMainnetProvider, 1);

// Getting results would normally make 9 eth_calls, but with EthgateChain it's just 1!
const results = await Promise.all(
  names.map(async (name) => {
    const namehash = hashEnsName(name);

    const [recordExists, owner, resolver] = await Promise.all([
      mainnet.call(ensRegistryContract, 'recordExists(bytes32)', [namehash]),
      mainnet.call(ensRegistryContract, 'owner(bytes32)', [namehash]),
      mainnet.call(ensRegistryContract, 'resolver(bytes32)', [namehash]),
    ]);

    return { recordExists, owner, resolver };
  }),
);
```
