import BigNumber from "bignumber.js";
import bep20ABI from "./abis/bep20.json";
import masterChefABI from "./abis/masterchef.json";
import smartChefABI from "./abis/smartchef.json";
import { getContract } from "./web3";
import { CAKE, MASTERCHEF_CONTRACT } from "./constants";

interface UserInfoResult {
  amount: number;
  rewardDebt: number;
}

const pools: string[] = [
  "0x153e62257F1AAe05d5d253a670Ca7585c8D3F94F", // TXL
  "0xF682D186168b4114ffDbF1291F19429310727151", // COS
  "0xaDdAE5f4dB84847ac9d947AED1304A8e7D19f7cA", // BUNNY
  "0x4C32048628D0d32d4D6c52662FB4A92747782B56", // ALICE
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
  "0x212bb602418C399c29D52C55100fD6bBa12bea05", // LINA
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
  "0xd18E1AEb349ef0a6727eCe54597D98D263e05CAB", // ASR
  "0x68C7d180bD8F7086D91E65A422c59514e4aFD638", // ATM
  "0xbE65d7e42E05aD2c4ad28769dc9c5b4b6EAff2C7", // OG
  "0x1500fa1afbfe4f4277ed0345cdf12b2c9ca7e139", // REEF
  "0x624ef5C2C6080Af188AF96ee5B3160Bb28bb3E02", // DITTO
  "0x543467B17cA5De50c8BF7285107A36785Ab57E56", // JUV
  "0x65aFEAFaec49F23159e897EFBDCe19D94A86A1B6", // PSG
  "0x1AD34D8d4D79ddE88c9B6b8490F8fC67831f2CAe", // VAI
  "0x42Afc29b2dEa792974d1e9420696870f1Ca6d18b", // BLK
  "0xFb1088Dae0f03C5123587d2babb3F307831E6367", // UNFI
  "0x9c4EBADa591FFeC4124A7785CAbCfb7068fED2fb", // TWT
  "0x90F995b9d46b32c4a1908A8c6D0122e392B3Be97", // HARD
  "0xdc8c45b7F3747Ca9CaAEB3fa5e0b5FCE9430646b", // bROOBEE
  "0xFF02241a2A1d2a7088A344309400E9fE74772815", // STAX
  "0xDc938BA1967b06d666dA79A7B1E31a8697D1565E", // NAR
  "0x07a0A5B67136d40F4d7d95Bc8e0583bafD7A81b9", // NYA
  "0x21A9A53936E812Da06B7623802DEc9A1f94ED23a", // CTK
  "0xcec2671C81a0Ecf7F8Ee796EFa6DBDc5Cb062693", // INJ
  "0xD32B30b151a6aDB2e0Fa573a37510C097DaBD2F3", // SXP
  "0x73c83bd1646991cBca3e6b83ca905542FE07C57A", // ALPHA
  "0x6ab8463a4185b80905e05a9ff80a2d6b714b9e95", // XVS
];

export const getTotalStaked = async (address: string, block: string): Promise<number> => {
  const blockNumber = block === undefined ? "latest" : block;
  let balance = new BigNumber(0);

  // Cake balance in wallet.
  const cakeContract = getContract(bep20ABI, CAKE, true);
  const cakeBalance = await cakeContract.methods.balanceOf(address).call(undefined, blockNumber);
  balance = balance.plus(cakeBalance);

  // MasterChef contract.
  const masterContract = getContract(masterChefABI, MASTERCHEF_CONTRACT, true);
  const cakeMainStaking: UserInfoResult = await masterContract.methods
    .userInfo(0, address)
    .call(undefined, blockNumber);
  balance = balance.plus(cakeMainStaking.amount);

  // Pools balances.
  const promises = pools.map((pool) => {
    const contract = getContract(smartChefABI, pool, true);
    return contract.methods.userInfo(address).call(undefined, blockNumber);
  });
  const results = await Promise.all(promises.map((p) => p.catch((e: Error) => e)));
  const validResults = results.filter((result) => !(result instanceof Error));

  const balancesMapping = validResults.reduce(
    (acc, result: UserInfoResult) => acc.plus(new BigNumber(result.amount)),
    new BigNumber(0)
  );

  return balance.plus(balancesMapping).div(1e18).toNumber();
};
