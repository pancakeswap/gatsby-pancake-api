import { NowRequest, NowResponse } from "@vercel/node";
import { getTotalStaked } from "../../utils/balance";

export default async (req: NowRequest, res: NowResponse): Promise<void> => {
  const { address } = req.query;

  const staked = await getTotalStaked(address as string);

  res.json({ staked });
};
