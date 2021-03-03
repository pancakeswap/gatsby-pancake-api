import { PromisifyBatchRequest } from "../lib/PromiseBatchRequest";
import { ratesV2, ratesV1, rates, Rates } from "./lotteryRates";
import { LOTTERY_CONTRACT } from "./constants";
import { getContract } from "./web3";
import lotteryABI from "./abis/lottery.json";

export interface SingleLotteryReturn {
  numbers1: Promise<[string, string, string, string]>;
  numbers2: Promise<Array<string>>;
  index: number;
}

export interface Lottery {
  numbers1: [string, string, string, string];
  numbers2: Array<number>;
  issueIndex: number;
}

export interface SingleLottery {
  lotteryNumber: number;
  lotteryDate: Date;
  poolSize: number;
  lotteryNumbers: number[];
  jackpotTicket: number;
  match3Ticket: number;
  match2Ticket: number;
  match1Ticket: number | null;
  poolJackpot: number;
  poolMatch3: number;
  poolMatch2: number;
  poolMatch1: number | null;
  burned: number;
  contractLink: string;
}

export interface LotteryHistory {
  lotteryNumber: number;
  poolSize: number;
  burned: number;
}

/**
 * Request all Lottery Methods to get the Lottery Data
 * This Method is not async and is not waiting
 * This will improve the performance because all requests can be created at almost the same time
 * This is the Batch version of the function. This means the web3 batchrequest functionality is used to batch the requests to the bsc network
 * This Batch functionality prevent the api from crashing because of too many requests against the contract.
 * @param index
 */
export const getSingleLotteryBatch = (index: number): SingleLotteryReturn => {
  const lotteryContract = getContract(lotteryABI, LOTTERY_CONTRACT);
  const batch = new PromisifyBatchRequest<string>();
  const batch2 = new PromisifyBatchRequest<string>();
  [
    lotteryContract.methods.historyNumbers(index, 0).call,
    lotteryContract.methods.historyNumbers(index, 1).call,
    lotteryContract.methods.historyNumbers(index, 2).call,
    lotteryContract.methods.historyNumbers(index, 3).call,
  ].map((x) => batch.add(x));
  if (index >= 349 && index <= 355) {
    [
      lotteryContract.methods.historyAmount(index, 0).call,
      lotteryContract.methods.historyAmount(index, 1).call,
      lotteryContract.methods.historyAmount(index, 2).call,
      lotteryContract.methods.historyAmount(index, 3).call,
      lotteryContract.methods.historyAmount(index, 4).call,
    ].map((x) => batch2.add(x));
  } else {
    [
      lotteryContract.methods.historyAmount(index, 0).call,
      lotteryContract.methods.historyAmount(index, 1).call,
      lotteryContract.methods.historyAmount(index, 2).call,
      lotteryContract.methods.historyAmount(index, 3).call,
    ].map((x) => batch2.add(x));
  }

  return {
    numbers1: batch.execute() as Promise<[string, string, string, string]>,
    numbers2: batch2.execute() as Promise<Array<string>>,
    index,
  };
};

/**
 * This function will create the LotteryItem and will resolve the promises
 * At the time the promises are awaited the request should already be done
 * @param numbers1Prom Promise with all numbers1 numbers
 * @param numbers2Prom Promise with all numbers2 numbers
 * @param index
 * @param finalNumbers
 */
const createLotteryItem = async (
  numbers1Prom: Promise<[string, string, string, string]>,
  numbers2Prom: Promise<Array<string>>,
  index: number,
  finalNumbers: Array<Lottery>
) => {
  const numbers1 = await numbers1Prom;
  const numbers2Res = await numbers2Prom;
  const numbers2: Array<number> = numbers2Res.map((n) => parseInt(n) / 1e18);

  finalNumbers.push({
    issueIndex: index,
    numbers1,
    numbers2,
  });
};

export const getIssueIndex = async (): Promise<number | { error: string; errorMessage: string }> => {
  const lotteryContract = getContract(lotteryABI, LOTTERY_CONTRACT);
  let issueIndex: number | undefined = undefined;
  let retryIsseIndex = 0;
  while (typeof issueIndex === "undefined" && retryIsseIndex <= 3) {
    try {
      issueIndex = Number(await lotteryContract.methods.issueIndex().call());
    } catch (error) {
      retryIsseIndex++;
    }
  }
  if (typeof issueIndex === "undefined") {
    return {
      error: "Internal Server Error",
      errorMessage: `Internal Server Error try again later`,
    };
  }
  return issueIndex;
};

export const getTicketPrice = (index: number): number => {
  if (index <= 348) {
    return 10;
  }

  return 1;
};

/**
 * @param index
 */
export const getRates = (index: number): Rates => {
  if (index >= 0 && index <= 205) {
    return ratesV1;
  } else if ((index >= 206 && index <= 348) || index >= 356) {
    return ratesV2;
  }

  return rates;
};

export const getAllLotteries = (issueIndex: number): Promise<Array<Lottery>> => {
  const finalNumbersProm: Array<SingleLotteryReturn> = [];
  for (let i = issueIndex; i >= 0; i--) {
    if (i !== 349) {
      finalNumbersProm.push(getSingleLotteryBatch(i));
    }
  }
  return computeLotteries(finalNumbersProm);
};

/**
 * It happens that cloudfront rejects request.
 * To prevent missing lottery Items this retry function requests the lotteryItem again.
 * @param index
 * @param finalNumbers
 * @param retries number of retries
 */
const retry = async (index: number, finalNumbers: Array<Lottery>, retries: number) => {
  let retrySuccess = false;
  let retryCount = 0;
  while (!retrySuccess && retryCount !== retries) {
    retryCount++;
    try {
      const { numbers1: numbers1Prom, numbers2: numbers2Prom } = getSingleLotteryBatch(index);
      await createLotteryItem(numbers1Prom, numbers2Prom, index, finalNumbers);
      retrySuccess = true;
    } catch (err) {
      console.log("retry err:", err);
      console.log("retry count:", retryCount);
    }
  }
};

export const computeLotteries = async (finalNumbersProm: Array<SingleLotteryReturn>): Promise<Array<Lottery>> => {
  const finalNumbers: Array<Lottery> = [];
  try {
    for (let i = 0; i < finalNumbersProm.length; i++) {
      const { numbers1: numbers1Prom, numbers2: numbers2Prom, index } = finalNumbersProm[i];
      try {
        await createLotteryItem(numbers1Prom, numbers2Prom, index, finalNumbers);
      } catch (error) {
        await retry(index, finalNumbers, 3);
      }
    }
  } catch (error) {
    console.error(error);
  }
  return finalNumbers;
};
