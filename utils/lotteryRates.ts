export interface Rates {
  burn: number;
  jackpot: number;
  match3: number;
  match2: number;
  match1?: number;
}

// Rates since 348
export const rates: Rates = {
  burn: 15,
  jackpot: 50,
  match3: 20,
  match2: 10,
  match1: 5,
};

// Rates between 206 and 347
export const ratesV2: Rates = {
  burn: 20,
  jackpot: 50,
  match3: 20,
  match2: 10,
};

// Rates between 0 and 205
export const ratesV1: Rates = {
  burn: 10,
  jackpot: 60,
  match3: 20,
  match2: 10,
};
