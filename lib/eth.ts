import Web3 from "web3";
import { getProvider } from "./provider";
import { HttpProvider as Web3HttpProvider } from "web3-core";

let web3: Web3 | undefined;

export const getWeb3 = () => {
  if (!web3 || !(web3.eth.currentProvider as Web3HttpProvider).connected) web3 = new Web3(getProvider());

  return web3;
};
