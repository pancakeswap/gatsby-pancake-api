import * as lottery from "../api/lottery";
import { LOTTERY_CONTRACT } from "../utils/constants";
import { getContract } from "../utils/web3";
import lotteryABI from "../utils/abis/lottery.json";

describe("Lottery Function", () => {
  let maxLotteries: number;

  beforeAll(async () => {
    const lotteryContract = getContract(lotteryABI, LOTTERY_CONTRACT);

    maxLotteries = Number(await lotteryContract.methods.issueIndex().call());
  });

  it("lottery pagesize 2", async () => {
    const lotteryResponse = await lottery.lottery(2);
    expect(lotteryResponse.lotteries).toHaveLength(2);
  });

  it("lottery page default", async () => {
    const lotteryResponse = await lottery.lottery();
    expect(lotteryResponse.lotteries).toBeDefined();
    expect(lotteryResponse.lotteries?.length).toBe(maxLotteries - 1);
  });

  it("lottery page 3 pagesize 10", async () => {
    const lotteryResponse = await lottery.lottery(10, 3);
    expect(lotteryResponse.lotteries).toHaveLength(10);
  });
});

describe("Lottery Handler", () => {
  let maxLotteries: number;

  beforeAll(async () => {
    const lotteryContract = getContract(lotteryABI, LOTTERY_CONTRACT);

    maxLotteries = Number(await lotteryContract.methods.issueIndex().call());
  });

  it("request handler empty query", async () => {
    const lotteryResponse = await lottery.handleAPICall({
      pagesize: "10",
      page: "0",
    });
    expect(lotteryResponse.lotteries).toBeDefined();
    expect(lotteryResponse.lotteries).toHaveLength(maxLotteries - 1);
  });
});
