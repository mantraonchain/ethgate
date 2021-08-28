import { Interface } from '@ethersproject/abi';

import MakerMulticallAbi from './MakerMulticall.abi.json';

const makerMulticallInterface = new Interface(MakerMulticallAbi);

export default makerMulticallInterface;
