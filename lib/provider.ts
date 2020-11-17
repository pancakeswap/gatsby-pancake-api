import Web3 from "web3";
import { HttpProvider } from "web3-core";

let provider: HttpProvider | undefined;
export const getProvider = () => {
  if (!provider || (provider && !provider.connected)) {
    provider = new Web3.providers.HttpProvider(
      "https://bsc-dataseed.binance.org"
    );
  }
  return provider;
};
