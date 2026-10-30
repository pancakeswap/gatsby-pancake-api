import { NowRequest, NowResponse } from "@vercel/node";
import {
  getDeadSupply,
  getCakePoolBalance,
  getTotalMint,
  planetFinanceBurnedTokensWei,
  veCakeDelegatorsBurnedTokenWei,
  maxSupply,
  getVeCakeLocked,
  getMasterChefV1Balance,
} from "../utils/supply";
import formatNumber from "../utils/formatNumber";

export default async (req: NowRequest, res: NowResponse): Promise<void> => {
  let totalMint = await getTotalMint();
  totalMint = totalMint.div(1e18);

  let deadSupply = await getDeadSupply();
  deadSupply = deadSupply.div(1e18);

  let cakePoolBalance = await getCakePoolBalance();
  cakePoolBalance = cakePoolBalance.div(1e18);

  let lockedVeCake = await getVeCakeLocked();
  lockedVeCake = lockedVeCake.div(1e18);

  let masterChefV1Balance = await getMasterChefV1Balance();
  masterChefV1Balance = masterChefV1Balance.div(1e18);

  const planetFinanceBurnedTokens = planetFinanceBurnedTokensWei.div(1e18);
  const veCakeDelegatorsBurnedToken = veCakeDelegatorsBurnedTokenWei.div(1e18);

  const totalBurnedTokens = deadSupply.plus(planetFinanceBurnedTokens).plus(veCakeDelegatorsBurnedToken);

  // Pool balances deducted from circulating supply (aligned with Dune methodology):
  // - CakePool: full CAKE balance (locked + flexible + stuck delegator tokens)
  // - veCAKE: total supply locked
  // - MasterChef V1: stuck CAKE (emissions stopped, effectively out of circulation)
  //
  // Note: veCakeDelegatorsBurnedTokenWei is NOT subtracted from cakePoolBalance here
  // because those tokens are already counted in totalBurnedTokens above. However, the
  // delegated CAKE physically remains in CakePool, so we subtract it to avoid double-counting.
  const totalPoolsBalance = cakePoolBalance
    .minus(veCakeDelegatorsBurnedToken)
    .plus(lockedVeCake)
    .plus(masterChefV1Balance);

  const burnedAndLockedTokens = totalBurnedTokens.plus(totalPoolsBalance);

  const totalSupply = totalMint.minus(totalBurnedTokens);

  const circulatingSupply = totalMint.minus(burnedAndLockedTokens);

  if (req.query?.q === "totalSupply") {
    res.json(totalSupply.toNumber());
  } else if (req.query?.q === "circulatingSupply") {
    res.json(circulatingSupply.toNumber());
  } else if (req.query?.verbose) {
    res.json({
      totalMinted: formatNumber(totalMint.toNumber()),
      totalSupply: formatNumber(totalSupply.toNumber()),
      burnedSupply: formatNumber(totalBurnedTokens.toNumber()),
      circulatingSupply: formatNumber(circulatingSupply.toNumber()),
      lockedCake: formatNumber(totalPoolsBalance.toNumber()),
      masterChefV1: formatNumber(masterChefV1Balance.toNumber()),
      maxSupply: formatNumber(maxSupply),
    });
  } else {
    res.json({
      totalSupply: totalSupply.toNumber(),
      burnedSupply: totalBurnedTokens.toNumber(),
      circulatingSupply: circulatingSupply.toNumber(),
    });
  }
};
