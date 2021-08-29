import type { Interface as EthersInterace } from '@ethersproject/abi';
import type { Provider as EthersProvider } from '@ethersproject/providers';
import invariant from 'invariant';

import type { EthgateChain, EthgateChainBlockIdentifier } from './EthgateChain';
export * from './EthgateChain';

export class EthgateError extends Error {}

export class EthgateContract<TChainId extends number = number> {
  readonly chainId: TChainId;
  readonly address: string;
  readonly interface: EthersInterace;

  constructor(chainId: TChainId, address: string, contractInterface: EthersInterace) {
    this.chainId = chainId;
    this.address = address;
    this.interface = contractInterface;
  }
}

export type EthgateContractLike<TChainId extends number = number> = {
  readonly chainId: TChainId;
  readonly address: string;
  readonly interface: EthersInterace;
};

export class EthgateCall<TChainId extends number = number> {
  readonly chainId: TChainId;
  readonly address: string;
  readonly data: string;
  readonly block: EthgateChainBlockIdentifier;

  constructor(
    chainId: TChainId,
    address: string,
    data: string,
    block: EthgateChainBlockIdentifier = 'latest',
  ) {
    this.chainId = chainId;
    this.address = address;
    this.data = data;
    this.block = block;
  }

  // getCacheKey(): string {
  //   return `${this.chainId}-${this.address}-${this.data}-${this.block}`;
  // }
}

// type  EthgateCallOptions = {}

export class Ethgate<TChainId extends number = number> {
  readonly chains: Record<TChainId, EthgateChain>;

  constructor(chains: Record<TChainId, EthgateChain>) {
    this.chains = chains;
  }

  getChain(chainId: TChainId): EthgateChain {
    const chain = this.chains[chainId];
    return chain;
  }

  async rawCall(call: EthgateCall<TChainId>): Promise<any> {
    const chain = this.getChain(call.chainId);
    invariant(chain, `Chain with ID "${call.chainId}" was not found`);
    return chain.rawCall(call);
  }

  async call(
    contract: EthgateContractLike<TChainId>,
    functionName: string,
    params: any[],
    block: EthgateChainBlockIdentifier = 'latest',
  ): Promise<any> {
    const functionFragment = contract.interface.getFunction(functionName);

    const data = contract.interface.encodeFunctionData(functionFragment, params);
    const call = new EthgateCall(contract.chainId, contract.address, data, block);

    const encodedResult = await this.rawCall(call);

    const result = contract.interface.decodeFunctionResult(functionFragment, encodedResult);

    return functionFragment.outputs!.length === 1 ? result[0] : result;
  }

  async callMany(calls: readonly Parameters<Ethgate<TChainId>['call']>[]): Promise<readonly any[]> {
    return Promise.all(calls.map((call) => this.call(...call)));
  }
}

// type EthgateCacheKey = string;
// type EthgateCacheRecord = {};

// class EthgateCache {
//   private records: Map<EthgateCacheKey, EthgateCacheRecord> = new Map();
// }
