import { NowRequest, NowResponse } from "@vercel/node";
import {
  getBurnedSupply,
  getLockedCake,
  getTotalSupply,
  planetFinanceBurnedTokensWei,
  maxSupply,
  getVeCakeLocked,
} from "../utils/supply";
import formatNumber from "../utils/formatNumber";
import BigNumber from "bignumber.js";

export default async (req: NowRequest, res: NowResponse): Promise<void> => {
  let totalSupply = await getTotalSupply();
  totalSupply = totalSupply.div(1e18);

  let burnedSupply = await getBurnedSupply();
  burnedSupply = burnedSupply.div(1e18);

  let lockedCakePool = await getLockedCake();
  lockedCakePool = lockedCakePool.div(1e18);

  let lockedVeCake = await getVeCakeLocked();
  lockedVeCake = lockedVeCake.div(1e18);

  let lockedCake = lockedCakePool.plus(lockedVeCake);

  const planetFinanceBurnedTokens = planetFinanceBurnedTokensWei.div(1e18);

  const totalBurnedTokens = burnedSupply.plus(planetFinanceBurnedTokens);

  const burnedAndLockedTokens = totalBurnedTokens.plus(lockedCake);

  const unburntCake = totalSupply.minus(totalBurnedTokens);

  const circulatingSupply = totalSupply.minus(burnedAndLockedTokens);

  if (req.query?.q === "totalSupply") {
    res.json(unburntCake.toNumber());
  } else if (req.query?.q === "circulatingSupply") {
    res.json(circulatingSupply.toNumber());
  } else if (req.query?.verbose) {
    res.json({
      totalMinted: formatNumber(totalSupply.toNumber()),
      totalSupply: formatNumber(unburntCake.toNumber()),
      burnedSupply: formatNumber(burnedSupply.toNumber()),
      circulatingSupply: formatNumber(circulatingSupply.toNumber()),
      lockedCake: formatNumber(lockedCake.toNumber()),
      maxSupply: formatNumber(maxSupply),
    });
  } else {
    res.json({
      totalSupply: unburntCake.toNumber(),
      burnedSupply: totalBurnedTokens.toNumber(),
      circulatingSupply: circulatingSupply.toNumber(),
    });
  }
};
