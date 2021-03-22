import { Interface } from "@ethersproject/abi";
import { getContract } from "./web3";
import { MULTICALL_CONTRACT } from "./constants";
import MultiCallAbi from "./abis/multicall.json";

// Multicall interface for Calls.
export interface Call {
  address: string; // Address of the contract
  name: string; // Function name on the contract (example: balanceOf)
  params?: any[]; // Function params
}

export const multicall = async (abi: any[], calls: Call[], blockNumber?: number) => {
  const contract = getContract(MultiCallAbi, MULTICALL_CONTRACT, true);
  const itf = new Interface(abi);

  const calldata = calls.map((call: Call) => [
    call.address?.toLowerCase(),
    itf.encodeFunctionData(call.name, call.params),
  ]);
  const { returnData } = await contract.methods.aggregate(calldata).call(undefined, blockNumber);
  return returnData.map((call: any, index: number) => itf.decodeFunctionResult(calls[index].name, call));
};
