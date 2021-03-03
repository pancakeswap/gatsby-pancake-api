import Web3 from "web3";
import { BatchRequest } from "web3-core";

import { getWeb3 } from "../utils/web3";

export class PromisifyBatchRequest<R> {
  web3: Web3;
  batch: BatchRequest;
  requests: Array<Promise<R>> = [];
  constructor() {
    this.web3 = getWeb3();
    this.batch = new this.web3.BatchRequest();
  }

  add = (_request: any, ...params: any) => {
    let that = this;
    let request: Promise<R> = new Promise((resolve, reject) => {
      that.batch.add(
        _request.request(null, (err: any, data: R) => {
          if (err) return reject(err);
          resolve(data);
        })
      );
    });
    this.requests.push(request);
  };
  execute = async () => {
    this.batch.execute();
    return await Promise.all(this.requests);
  };
}
