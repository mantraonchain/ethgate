# Ethgate

Ethgate is a library for making batched calls to Ethereum compatible chains.

API Reference: https://cardpunks.github.io/ethgate/

This library is very experimental. Even documented features might not work.

## Usage

```ts
import { Contract as EthersContract } from '@ethersproject/contracts';
import { InfuraProvider as EthersInfuraProvider } from '@ethersproject/providers';
import { EthgateChain } from 'ethgate';

const ethersMainnetProvider = new EthersInfuraProvider('homestead');

const mainnet = new EthgateChain(ethersMainnetProvider, 1);

const ensRegistryContract = new EthersContract(
  '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  ensRegistryContractInterface,
);

const names = ['resolver.eth', 'cardpunks.eth', 'alicanc.eth'];

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

// You now have the results and only one RPC call has been made!
```
