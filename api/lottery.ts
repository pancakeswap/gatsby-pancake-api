import { NowRequest, NowResponse, NowRequestQuery } from "@vercel/node";
import { getContract } from "../lib/contract";
import { PromisifyBatchRequest } from "../lib/PromiseBatchRequest";
const lotteryABI = require("../contracts/lottery");
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
 * This is the Batch version of the function. This means the web3 batchrequest functionality is used to batch the requests to the bsc network
 * This Batch functionality prevent the api from crashing because of too many requests against the contract.
 * @param index
 */
const getSingleLotteryBatch = (index: number): SingleLotteryReturn => {
  const lotteryContract = getContract(
    lotteryABI,
    "0x3C3f2049cc17C136a604bE23cF7E42745edf3b91"
  );
  const batch = new PromisifyBatchRequest<string>();
  const batch2 = new PromisifyBatchRequest<string>();
  [
    lotteryContract.methods.historyNumbers(index, 0).call,
    lotteryContract.methods.historyNumbers(index, 1).call,
    lotteryContract.methods.historyNumbers(index, 2).call,
    lotteryContract.methods.historyNumbers(index, 3).call,
  ].map((x) => batch.add(x));
  [
    lotteryContract.methods.historyAmount(index, 0).call,
    lotteryContract.methods.historyAmount(index, 1).call,
    lotteryContract.methods.historyAmount(index, 2).call,
    lotteryContract.methods.historyAmount(index, 3).call,
  ].map((x) => batch2.add(x));

  return {
    numbers1: batch.execute() as Promise<[string, string, string, string]>,
    numbers2: batch2.execute() as Promise<[string, string, string, string]>,
    index,
  };
};

/**
 * Request all Lottery Methods to get the Lottery Data
 * This Method is not async and is not waiting
 * This will improve the performance because all requests can be created at almost the same time
 * @param index
 */
const getSingleLottery = (index: number): SingleLotteryReturn => {
  const lotteryContract = getContract(
    lotteryABI,
    "0x3C3f2049cc17C136a604bE23cF7E42745edf3b91"
  );

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
      } = getSingleLotteryBatch(index);
      await createLotteryItem(numbers1Prom, numbers2Prom, index, finalNumbers);
      retrySuccess = true;
    } catch (err) {
      console.log("retry err:", err);
      console.log("retry count:", retryCount);
    }
  }
};
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export const lottery = async (
  pageSize?: number,
  page: number = 0
): Promise<{
  totalPage?: number;
  totalItems?: number;
  lotteries?: Array<Lottery>;
  currentPage?: number;
  error?: string;
  errorMessage?: string;
}> => {
  const lotteryContract = getContract(
    lotteryABI,
    "0x3C3f2049cc17C136a604bE23cF7E42745edf3b91"
  );
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
      finalNumbersProm.push(getSingleLotteryBatch(i));
    }
  } else {
    for (let i = issueIndex - 1; i >= 0; i--) {
      finalNumbersProm.push(getSingleLotteryBatch(i));
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
  } catch (error) {
    console.error(error);
  }

  return {
    totalPage: totalPage,
    totalItems: issueIndex - 1,
    lotteries: finalNumbers,
    currentPage: page,
  };
};

export const handleAPICall = async (query: NowRequestQuery) => {
  const { pageSize, page } = query;

  const data = await lottery(
    typeof pageSize !== "undefined" ? Number(pageSize) : undefined,
    typeof page !== "undefined" ? Number(page) : undefined
  );
  return data;
};

export default async (_req: NowRequest, res: NowResponse) => {
  const data = await handleAPICall(_req.query);
  res.status(200).send(data);
};
