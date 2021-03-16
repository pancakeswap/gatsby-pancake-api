import BigNumber from "bignumber.js";
import bep20ABI from "./abis/bep20.json";
import masterChefABI from "./abis/masterchef.json";
import { getContract } from "./web3";
import { CAKE, MASTERCHEF_CONTRACT } from "./constants";

interface ApiReturn {
  amount: number;
  rewardDebt: number;
}

export const getTotalStaked = async (address: string, block: string): Promise<number> => {
  const blockNumber = block === undefined ? "latest" : block;
  let balance = new BigNumber(0);

  // Cake balance in wallet.
  const cakeContract = getContract(bep20ABI, CAKE, true);
  const cakeBalance = await cakeContract.methods.balanceOf(address).call(undefined, blockNumber);
  balance = balance.plus(cakeBalance);

  // MasterChef contract.
  const masterContract = getContract(masterChefABI, MASTERCHEF_CONTRACT, true);
  const poolLength = await masterContract.methods.poolLength().call(undefined, blockNumber);

  const promisesBalances = [...Array(poolLength)].map((_, index) => {
    return masterContract.methods.userInfo(index, address).call(undefined, blockNumber);
  });
  const balances: ApiReturn[] = await Promise.all(promisesBalances);

  const balancesMapping = balances.reduce(
    (acc, pool, index) => new BigNumber(balances[index].amount).plus(new BigNumber(acc)),
    new BigNumber(0)
  );

  return balance.plus(balancesMapping).div(1e18).toNumber();
};
