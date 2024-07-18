import { NowRequest, NowResponse } from "@vercel/node";
import {
  getDeadSupply,
  getLockedCake,
  getTotalMint,
  planetFinanceBurnedTokensWei,
  maxSupply,
  getVeCakeLocked,
} from "../utils/supply";
import formatNumber from "../utils/formatNumber";

export default async (req: NowRequest, res: NowResponse): Promise<void> => {
  let totalMint = await getTotalMint();
  totalMint = totalMint.div(1e18);

  let deadSupply = await getDeadSupply();
  deadSupply = deadSupply.div(1e18);

  let lockedCakePool = await getLockedCake();
  lockedCakePool = lockedCakePool.div(1e18);

  let lockedVeCake = await getVeCakeLocked();
  lockedVeCake = lockedVeCake.div(1e18);

  let totalLockedCake = lockedCakePool.plus(lockedVeCake);

  const planetFinanceBurnedTokens = planetFinanceBurnedTokensWei.div(1e18);

  const totalBurnedTokens = deadSupply.plus(planetFinanceBurnedTokens);

  const burnedAndLockedTokens = totalBurnedTokens.plus(totalLockedCake);

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
      lockedCake: formatNumber(totalLockedCake.toNumber()),
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
