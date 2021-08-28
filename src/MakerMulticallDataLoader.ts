import type { BytesLike } from '@ethersproject/bytes';
import type { Provider } from '@ethersproject/providers';
import DataLoader from 'dataloader';

import type { EthgateChainCall } from './EthgateChain';
import makerMulticallInterface from './interfaces/makerMulticallInterface';

type MakerMulticallCall = {
  readonly target: string;
  readonly callData: string;
};

const aggregateFunctionFragment = makerMulticallInterface.getFunction('aggregate');

export default class MakerMulticallDataLoader extends DataLoader<EthgateChainCall, BytesLike> {
  constructor(contractAddress: string, provider: Provider) {
    const batchLoadFn = async (calls: readonly EthgateChainCall[]) => {
      // We only want batching and no caching so clear the cache
      this.clearAll();

      const makerMulticallCalls: readonly MakerMulticallCall[] = calls.map((call) => ({
        target: call.address,
        callData: call.data,
      }));
      const data = makerMulticallInterface.encodeFunctionData(aggregateFunctionFragment, [
        makerMulticallCalls,
      ]);

      const encodedResult = await provider.call({
        to: contractAddress,
        data,
      });

      const result = makerMulticallInterface.decodeFunctionResult(
        aggregateFunctionFragment,
        encodedResult,
      );

      const {
        // blockNumber,
        returnData,
      } = result;

      return returnData;
    };

    super(batchLoadFn);
  }
}
