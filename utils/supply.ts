import { getContract } from "../lib/web3";
import { CAKE, DEAD } from "./constants";
import bep20 from "../contracts/bep20.json";
import BigNumber from "bignumber.js";

const contract = getContract(bep20, CAKE);

export const getTotalSupply = async (): Promise<BigNumber> => {
  const supply = await contract.methods.totalSupply().call();

  return new BigNumber(supply);
};

export const getBurnedSupply = async (): Promise<BigNumber> => {
  const balance = await contract.methods.balanceOf(DEAD).call();

  return new BigNumber(balance);
};
