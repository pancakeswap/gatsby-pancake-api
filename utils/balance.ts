import BigNumber from "bignumber.js";
import bep20ABI from "./abis/bep20.json";
import smartChefABI from "./abis/smartchef.json";
import { getContract } from "./web3";
import { CAKE, SYRUP } from "./constants";

interface ApiReturn {
  amount: number;
  rewardDebt: number;
}

const pools: string[] = [
  "0xF682D186168b4114ffDbF1291F19429310727151", // COS
  "0x47642101e8D8578C42765d7AbcFd0bA31868c523", // FOR
  "0x07F8217c68ed9b838b0b8B58C19c79bACE746e9A", // BUX
  "0x580DC9bB9260A922E3A4355b9119dB990F09410d", // NULS
  "0x6f0037d158eD1AeE395e1c12d21aE8583842F472", // BELT
  "0x423382f989C6C289c8D441000e1045e231bd7d90", // RAMP
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
  "0xcCD0b93cC6ce3dC6dFaA9DB68f70e5C8455aC5bd", // HGET
  "0x9cB24e9460351bC51d4066BC6AEd1F3809b02B78", // BDO
  "0x2dcf4cDFf4Dd954683Fe0a6123077f8a025b66cF", // EGLD
  "0x6EFa207ACdE6e1caB77c1322CbdE9628929ba88F", // UST
  "0xD0b738eC507571176D40f28bd56a0120E375f73a", // wSOTE
  "0xf7a31366732F08E8e6B88519dC3E827e04616Fc9", // FRONT
  "0x9F23658D5f4CEd69282395089B0f8E4dB85C6e79", // HELMET
  "0xB6fd2724cc9c90DD31DA35DbDf0300009dceF97d", // BTCST
  "0x108BFE84Ca8BCe0741998cb0F60d313823cEC143", // BSCX
  "0x4A26b082B432B060B1b00A84eE4E823F04a6f69a", // TEN
  "0x3cc08B7C6A31739CfEd9d8d38b484FDb245C79c8", // bALBT
  "0x624ef5C2C6080Af188AF96ee5B3160Bb28bb3E02", // DITTO
];

export const getTotalStaked = async (address: string, block: string): Promise<number> => {
  const blockNumber = block === undefined ? "latest" : block;
  let balance = new BigNumber(0);

  // Cake balance.
  const cakeContract = getContract(bep20ABI, CAKE, true);
  const cakeBalance = await cakeContract.methods.balanceOf(address).call(undefined, blockNumber);
  balance = balance.plus(cakeBalance);

  // Syrup balance (for main staking pool).
  const syrupContract = getContract(bep20ABI, SYRUP, true);
  const syrupBalance = await syrupContract.methods.balanceOf(address).call(undefined, blockNumber);
  balance = balance.plus(syrupBalance);

  // Pools balances.
  const promisesBalances = pools.map((pool) => {
    const contract = getContract(smartChefABI, pool, true);
    return contract.methods.userInfo(address).call(undefined, blockNumber);
  });
  const balances: ApiReturn[] = await Promise.all(promisesBalances);

  const balancesMapping = pools.reduce(
    (acc, pool, index) => new BigNumber(balances[index].amount).plus(new BigNumber(acc)),
    new BigNumber(0)
  );

  return balance.plus(balancesMapping).div(1e18).toNumber();
};
