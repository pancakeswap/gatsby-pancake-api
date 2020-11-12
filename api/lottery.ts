import { NowRequest, NowResponse } from "@now/node";
import Web3 from "web3";

const lotteryABI = require("../contracts/lottery");

const web3 = new Web3(
  new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org")
);

const lotteryContract = new web3.eth.Contract(
  lotteryABI,
  "0x3C3f2049cc17C136a604bE23cF7E42745edf3b91"
);

interface SingleLotteryReturn {
  numbers1: Promise<[string, string, string, string]>;
  numbers2: Promise<[string, string, string, string]>;
  index: number;
}
interface Lottery {
  numbers1: [string, string, string, string];
  numbers2: Array<number>;
  issueIndex: number;
}

/**
 * Request all Lottery Methods to get the Lottery Data
 * This Method is not async and is not waiting
 * This will improve the performance because all requests can be created at almost the same time
 * @param index
 */
const getSingleLottery = (index: number): SingleLotteryReturn => {
  const numbers1 = Promise.all([
    lotteryContract.methods.historyNumbers(index, 0).call(),
    lotteryContract.methods.historyNumbers(index, 1).call(),
    lotteryContract.methods.historyNumbers(index, 2).call(),
    lotteryContract.methods.historyNumbers(index, 3).call(),
  ]);
  const numbers2 = Promise.all([
    lotteryContract.methods.historyAmount(index, 0).call(),
    lotteryContract.methods.historyAmount(index, 1).call(),
    lotteryContract.methods.historyAmount(index, 2).call(),
    lotteryContract.methods.historyAmount(index, 3).call(),
  ]);

  return { numbers1, numbers2, index };
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
  numbers2Prom: Promise<[string, string, string, string]>,
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

/**
 * It happens that cloudfront rejects request.
 * To prevent missing lottery Items this retry function requests the lotteryItem again.
 * @param index
 * @param finalNumbers
 * @param retries number of retries
 */
const retry = async (
  index: number,
  finalNumbers: Array<Lottery>,
  retries: number
) => {
  let retrySuccess = false;
  let retryCount = 0;
  while (!retrySuccess && retryCount !== retries) {
    retryCount++;
    try {
      const {
        numbers1: numbers1Prom,
        numbers2: numbers2Prom,
      } = getSingleLottery(index);
      await createLotteryItem(numbers1Prom, numbers2Prom, index, finalNumbers);
      retrySuccess = true;
    } catch (err) {}
  }
};

export const lottery = async (
  pageSize?: number,
  page: number = 0
): Promise<{
  totalPage: number;
  totalItems: number;
  lotteries?: Array<Lottery>;
  currentPage?: number;
  error?: string;
  errorMessage?: string;
}> => {
  const issueIndex: number = Number(
    await lotteryContract.methods.issueIndex().call()
  );
  const finalNumbers: Array<Lottery> = [];
  const finalNumbersProm = [];
  const totalPage = pageSize ? Math.ceil(issueIndex / pageSize - 1) : 0;
  if (typeof pageSize !== "undefined") {
    if (pageSize * page > issueIndex) {
      return {
        error: "page out of range",
        errorMessage: `The requested page with the requested pageSize is out of range. The last page is: ${totalPage}`,
        totalPage,
        totalItems: issueIndex,
      };
    }

    const offset = page * pageSize;
    const start = issueIndex - (offset + 1);
    const end = start - pageSize;

    for (let i = start; i >= 0 && i > end; i--) {
      finalNumbersProm.push(getSingleLottery(i));
    }
  } else {
    for (let i = issueIndex - 1; i >= 0; i--) {
      finalNumbersProm.push(getSingleLottery(i));
    }
  }
  try {
    for (let i = 0; i < finalNumbersProm.length; i++) {
      const {
        numbers1: numbers1Prom,
        numbers2: numbers2Prom,
        index,
      } = finalNumbersProm[i];
      try {
        await createLotteryItem(
          numbers1Prom,
          numbers2Prom,
          index,
          finalNumbers
        );
      } catch (error) {
        await retry(index, finalNumbers, 3);
      }
    }
  } catch (error) {}

  return {
    totalPage: totalPage,
    totalItems: issueIndex - 1,
    lotteries: finalNumbers,
    currentPage: page,
  };
};

export default async (_req: NowRequest, res: NowResponse) => {
  const { pageSize, page } = _req.query;

  const data = await lottery(
    typeof pageSize !== "undefined" ? Number(pageSize) : undefined,
    typeof page !== "undefined" ? Number(page) : undefined
  );
  res.status(200).send(data);
};
