import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { getWeb3 } from "./eth";
import { HttpProvider as Web3HttpProvider } from "web3-providers-http";
const lotteryABI = require("../contracts/lottery");
let web3: Web3 | undefined;
let lotteryContract: Contract | undefined;
export const getContract = () => {
  if (
    !lotteryContract ||
    (web3 && !(web3.eth.currentProvider as Web3HttpProvider).connected)
  ) {
    web3 = getWeb3();
    lotteryContract = new web3.eth.Contract(
      lotteryABI,
      "0x3C3f2049cc17C136a604bE23cF7E42745edf3b91"
    );
  }

  return lotteryContract;
};
