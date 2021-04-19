import * as singleLottery from "../api/singleLottery";
import { SingleLottery } from "../utils/lotteryUtils";

function instanceOfSingleLottery(object: any): object is SingleLottery {
  return "match2Ticket" in object;
}

describe("Lottery Function", () => {
  it("singleLottery V2", async () => {
    const lotteryResponse = await singleLottery.lottery(232);
    expect(lotteryResponse).toBeDefined();
    if (instanceOfSingleLottery(lotteryResponse)) {
      expect(lotteryResponse.match1Ticket).toBe(null);
      expect(lotteryResponse.match2Ticket).toBe(88);
      expect(lotteryResponse.match3Ticket).toBe(3);
      expect(lotteryResponse.poolJackpot).toBe(75947.11);
      expect(lotteryResponse.poolMatch3).toBe(30378.85);
      expect(lotteryResponse.poolMatch2).toBe(15189.43);
      expect(lotteryResponse.poolMatch1).toBe(null);
      expect(lotteryResponse.burned).toBe(30378.85);
      expect(lotteryResponse.poolSize).toBe(151894.22);
      expect(lotteryResponse.lotteryDate.toUTCString()).toBe(new Date("2020-12-16T02:00:00.000Z").toUTCString());
    } else {
      throw new Error("no error expected");
    }
  });

  it("singleLottery V1", async () => {
    const lotteryResponse = await singleLottery.lottery(199);
    expect(lotteryResponse).toBeDefined();
    if (instanceOfSingleLottery(lotteryResponse)) {
      expect(lotteryResponse.match1Ticket).toBe(null);
      expect(lotteryResponse.match2Ticket).toBe(124);
      expect(lotteryResponse.match3Ticket).toBe(6);
      expect(lotteryResponse.poolJackpot).toBe(38235.72);
      expect(lotteryResponse.poolMatch3).toBe(12745.24);
      expect(lotteryResponse.poolMatch2).toBe(6372.62);
      expect(lotteryResponse.poolMatch1).toBe(null);
      expect(lotteryResponse.burned).toBe(6372.62);
      expect(lotteryResponse.poolSize).toBe(63726.2);
      expect(lotteryResponse.lotteryDate.toUTCString()).toBe(new Date("2020-12-04T08:00:00.000Z").toUTCString());
    } else {
      throw new Error("no error expected");
    }
  });
});
