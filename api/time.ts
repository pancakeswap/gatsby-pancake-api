import { NowRequest, NowResponse } from "@vercel/node";

export default (_req: NowRequest, res: NowResponse) => {
  const time = new Date().getTime();

  res.json({ time });
};
