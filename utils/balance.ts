import BigNumber from "bignumber.js";
import { multicall } from "./multicall";
import bep20ABI from "./abis/bep20.json";
import smartChefABI from "./abis/smartchef.json";
import { getContract } from "./web3";
import { SYRUP } from "./constants";

// TODO:  Fetch from config API.
const pools: string[] = [
  "0x0A595623b58dFDe6eB468b613C11A7A8E84F09b9", // BFI
  "0x9E6dA246d369a41DC44673ce658966cAf487f7b2", // DEXE
  "0x2C0f449387b15793B9da27c2d945dBed83ab1B07", // BEL
  "0x75C91844c5383A68b7d3A427A44C32E3ba66Fe45", // TPT
  "0xC58954199E268505fa3D3Cb0A00b7207af8C2D1d", // WATCH
  "0xA5137e08C48167E363Be8Ec42A68f4F54330964E", // xMARK
  "0x6F31B87f51654424Ce57E9F8243E27ed13846CDB", // bMXX
  "0xCE54BA909d23B9d4BE0Ff0d84e5aE83F0ADD8D9a", // IOTX
  "0x3e677dC00668d69c2A7724b9AFA7363e8A56994e", // BOR
  "0x5Ac8406498dC1921735d559CeC271bEd23B294A7", // bOPEN
  "0xae3001ddb18A6A57BEC2C19D71680437CA87bA1D", // DODO
  "0x02aa767e855b8e80506fb47176202aA58A95315a", // SWINGBY
  "0x1c736F4FB20C7742Ee83a4099fE92abA61dFca41", // BRY
  "0x02861B607a5E87daf3FD6ec19DFB715F1b371379", // ZEE
  "0x73e4E8d010289267dEe3d1Fc48974B60363963CE", // SWGb
  "0x2B02d43967765b18E31a9621da640588f3550EFD", // SFP
  "0x1714bAAE9DD4738CDEA07756427FA8d4F08D9479", // LIT
  "0x6EFa207ACdE6e1caB77c1322CbdE9628929ba88F", // UST
  "0x624ef5C2C6080Af188AF96ee5B3160Bb28bb3E02", // DITTO
];

export const getTotalStaked = async (address: string): Promise<number> => {
  const calls = pools.map((pool: string) => ({
    address: pool,
    name: "userInfo",
    params: [address],
  }));

  const userInfo = await multicall(smartChefABI, calls);

  const masterChefContract = getContract(bep20ABI, SYRUP);
  const stakedMasterChef = await masterChefContract.methods.balanceOf(address).call();

  const stakedSmartChef = userInfo.reduce(
    (acc, pool, index) => new BigNumber(userInfo[index].amount._hex).plus(new BigNumber(acc)),
    0
  );

  return new BigNumber(stakedMasterChef).plus(new BigNumber(stakedSmartChef)).div(1e18).toNumber();
};
