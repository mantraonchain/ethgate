import type { BytesLike } from '@ethersproject/bytes';
import type { Provider } from '@ethersproject/providers';
import DataLoader from 'dataloader';
import groupBy from 'lodash/groupBy';

import type { EthgateChainBlockIdentifier, EthgateChainCall } from './EthgateChain';
import makerMulticallInterface from './interfaces/makerMulticallInterface';

type MakerMulticallCall = {
  readonly target: string;
  readonly callData: string;
};

const aggregateFunctionFragment = makerMulticallInterface.getFunction('aggregate');

export default class MakerMulticallDataLoader extends DataLoader<EthgateChainCall, BytesLike> {
  readonly provider: Provider;
  readonly address: string;

  constructor(provider: Provider, address: string) {
    const batchLoadFn = async (calls: readonly EthgateChainCall[]) => {
      // We only want batching and no caching so clear the cache
      this.clearAll();

      const blockGroups = Object.values(groupBy(Object.entries(calls), ([, call]) => call.block));

      const results: any = [];

      await Promise.all(
        blockGroups.map(async (blockGroup) => {
          const block = blockGroup[0][1].block;
          const makerMulticallCalls: readonly MakerMulticallCall[] = blockGroup.map(([, call]) => ({
            target: call.address,
            callData: call.data,
          }));

          const groupResults: any[] = await this.multicall(makerMulticallCalls, block);

          groupResults.forEach((result, index) => {
            results[blockGroup[index][0]] = result;
          });
        }),
      );

      return results;
    };

    super(batchLoadFn);

    this.provider = provider;
    this.address = address;
  }

  async multicall(
    calls: readonly MakerMulticallCall[],
    block: EthgateChainBlockIdentifier = 'latest',
  ) {
    const data = makerMulticallInterface.encodeFunctionData(aggregateFunctionFragment, [calls]);

    const encodedResult = await this.provider.call(
      {
        to: this.address,
        data,
      },
      block,
    );

    const result = makerMulticallInterface.decodeFunctionResult(
      aggregateFunctionFragment,
      encodedResult,
    );

    const {
      // blockNumber,
      returnData,
    } = result;

    return returnData;
  }
}
