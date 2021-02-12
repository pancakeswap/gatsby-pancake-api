import Web3 from "web3";
import * as lottery from "../api/lottery";
import { LOTTERY_CONTRACT } from "../utils/constants";

const lotteryABI = require("../contracts/lottery");

describe("Lottery Function", () => {
  let maxLotteries: number;
  beforeAll(async () => {
    const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org"));

    const lotteryContract = new web3.eth.Contract(lotteryABI, LOTTERY_CONTRACT);

    maxLotteries = Number(await lotteryContract.methods.issueIndex().call());
  });
  it("lottery pagesize 2", async () => {
    const lotteryResponse = await lottery.lottery(2);
    expect(lotteryResponse.lotteries).toHaveLength(2);
  });
  it("lottery no pagesize defined", async () => {
    const lotteryResponse = await lottery.lottery();
    expect(lotteryResponse.lotteries).toBeDefined();
    expect(lotteryResponse.lotteries?.length).toBe(maxLotteries);
  });

  it("lottery page default", async () => {
    const lotteryResponse = await lottery.lottery();
    expect(lotteryResponse.lotteries).toBeDefined();
    expect(lotteryResponse.lotteries?.length).toBe(maxLotteries);
  });

  it("lottery page 3 pagesize 10", async () => {
    const lotteryResponse = await lottery.lottery(10, 3);
    expect(lotteryResponse.lotteries).toHaveLength(10);
  });

  it("lottery page 200 pagesize 10", async () => {
    const lotteryResponse = await lottery.lottery(10, 200);
    expect(lotteryResponse.error).toBeDefined();
    expect(lotteryResponse.errorMessage).toBeDefined();
  });
});

describe("Lottery Handler", () => {
  let maxLotteries: number;
  beforeAll(async () => {
    const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org"));

    const lotteryContract = new web3.eth.Contract(lotteryABI, LOTTERY_CONTRACT);

    maxLotteries = Number(await lotteryContract.methods.issueIndex().call());
  });
  it("request handler empty query", async () => {
    const lotteryResponse = await lottery.handleAPICall({
      pagesize: "150",
      page: "0",
    });
    expect(lotteryResponse.lotteries).toBeDefined();
    expect(lotteryResponse.lotteries).toHaveLength(maxLotteries);
  });
});
