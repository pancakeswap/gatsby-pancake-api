import BigNumber from "bignumber.js";
import { getContract } from "./web3";
import { CAKE, DEAD, LOCKED_CAKE_POOL, VECAKE } from "./constants";
import bep20 from "./abis/bep20.json";
import lockedCakePool from "./abis/lockedCakePool.json";
import veCake from "./abis/veCake.json";

const cakeContract = getContract(bep20, CAKE);
const veCakeContract = getContract(veCake, VECAKE);
const lockedCakePoolContract = getContract(lockedCakePool, LOCKED_CAKE_POOL);

export const getTotalMint = async (): Promise<BigNumber> => {
  const supply = await cakeContract.methods.totalSupply().call();

  return new BigNumber(supply);
};

export const getDeadSupply = async (): Promise<BigNumber> => {
  const balance = await cakeContract.methods.balanceOf(DEAD).call();

  return new BigNumber(balance);
};

export const getLockedCake = async (): Promise<BigNumber> => {
  const lockedAmount = await lockedCakePoolContract.methods.totalLockedAmount().call();
  return new BigNumber(lockedAmount);
};

export const getVeCakeLocked = async (): Promise<BigNumber> => {
  const balance = await veCakeContract.methods.supply().call();
  return new BigNumber(balance);
};

/**
 * User (Planet Finance) built a contract on top of our original manual CAKE pool,
 * but the contract was written in such a way that when we performed the migration from Masterchef v1 to v2, the tokens were stuck.
 * These stuck tokens are forever gone (see their medium post) and can be considered out of circulation."
 * https://planetfinanceio.medium.com/pancakeswap-works-with-planet-to-help-cake-holders-f0d253b435af
 * https://twitter.com/PancakeSwap/status/1523913527626702849
 * https://bscscan.com/tx/0xd5ffea4d9925d2f79249a4ce05efd4459ed179152ea5072a2df73cd4b9e88ba7
 */
export const planetFinanceBurnedTokensWei = new BigNumber("637407922445268000000000");

/**
 * There are roughly 5.2 mil locked cake in CAKE pool that cannot be removed.
 * These locked cake happened duee to user delegating from cake pool to either stake dao or cake pie delegators. (staked dao and cakepie)
 *
 * Delegator:
 * - CakePie: 0xb47b790076050423888cde9EBB2D5Cb86544F327
 * - StakedDao: 0x1E6F87A9ddF744aF31157d8DaA1e3025648d042d
 *
 * veCAKE: 0x5692DB8177a81A6c6afc8084C2976C9933EC1bAB
 * event: DelegateFromCakePool
 *
 * @see https://dune.com/queries/4995421
 */
export const veCakeDelegatorsBurnedTokenWei = new BigNumber("5294001103223024000000000");

export const maxSupply = 400000000;
