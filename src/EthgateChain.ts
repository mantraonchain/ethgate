import type { FunctionFragment, Interface as EthersInterace } from '@ethersproject/abi';
import type { BlockTag, Provider } from '@ethersproject/providers';

import MakerMulticallDataLoader from './MakerMulticallDataLoader';

const makerMulticallContractAddresses: { [chainId: number]: string } = {
  1: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  3: '0xF24b01476a55d635118ca848fbc7Dab69d403be3',
  4: '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
  5: '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  42: '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  56: '0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb',
  100: '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a',
  137: '0xc4f1501f337079077842343Ce02665D8960150B0',
  1337: '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  80001: '0x5a0439824F4c0275faa88F2a7C5037F9833E29f1',
};

export type EthgateChainBlockIdentifier = 'latest' | number;

export class EthgateChainCall {
  readonly address: string;
  readonly data: string;
  readonly block: EthgateChainBlockIdentifier;

  constructor(address: string, data: string, block: EthgateChainBlockIdentifier = 'latest') {
    this.address = address;
    this.data = data;
    this.block = block;
  }

  // getCacheKey(): string {
  //   return `${this.address}-${this.data}-${this.block}`;
  // }
}

export type EthgateChainCallLike = {
  readonly address: string;
  readonly data: string;
  readonly block: EthgateChainBlockIdentifier;
};

export type EthgateChainContractLike = {
  readonly address: string;
  readonly interface: EthersInterace;
};

export class EthgateChain {
  static async fromProvider(provider: Provider) {
    const network = await provider.getNetwork();
    const chain = new EthgateChain(provider, network.chainId);
    return chain;
  }

  makerMulticallDataLoader: MakerMulticallDataLoader;

  constructor(public provider: Provider, public chainId: number) {
    this.makerMulticallDataLoader = new MakerMulticallDataLoader(
      makerMulticallContractAddresses[chainId],
      this.provider,
    );
  }

  async rawCall(call: EthgateChainCallLike): Promise<any> {
    const callResult = this.provider.call(
      {
        to: call.address,
        data: call.data,
      },
      call.block,
    );
    return callResult;
  }

  async call(
    contract: EthgateChainContractLike,
    fn: string | FunctionFragment,
    params: any[],
    block: EthgateChainBlockIdentifier = 'latest',
  ) {
    const functionFragment = typeof fn === 'string' ? contract.interface.getFunction(fn) : fn;

    const data = contract.interface.encodeFunctionData(functionFragment, params);
    const call = new EthgateChainCall(contract.address, data, block);
    const encodedResult = await this.makerMulticallDataLoader.load(call);

    const result = contract.interface.decodeFunctionResult(functionFragment, encodedResult);
    return functionFragment.outputs!.length === 1 ? result[0] : result;
  }

  async callMany(calls: Parameters<EthgateChain['call']>[]) {
    return await Promise.all(calls.map((call) => this.call(...call)));
  }
}
