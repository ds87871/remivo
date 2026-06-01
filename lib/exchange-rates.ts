export interface LiveRates {
  USD_to_INR: number;
  USD_RATES: Record<string, number>;
  lastUpdated: string;
}

const FALLBACK_RATES: LiveRates = {
  USD_to_INR: 83.47,
  USD_RATES: {
    USD: 1,
    AED: 0.272,
    SAR: 0.267,
    QAR: 0.275,
    KWD: 3.25,
    OMR: 2.60,
    GBP: 1.27,
    CAD: 0.73,
    AUD: 0.66,
  },
  lastUpdated: new Date().toISOString(),
};

export async function fetchLiveRates(): Promise<LiveRates> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 }, // Cache in Next.js for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch exchange rates: ${res.statusText}`);
    }

    const data = await res.json();
    const rates = data.rates;

    if (!rates || !rates.INR) {
      throw new Error("Invalid response format from exchange rate API");
    }

    const usdToInr = rates.INR;

    // We calculate USD_RATES (native currency value in USD, i.e., 1 / rate)
    const usdRates: Record<string, number> = {
      USD: 1,
      AED: rates.AED ? 1 / rates.AED : FALLBACK_RATES.USD_RATES.AED,
      SAR: rates.SAR ? 1 / rates.SAR : FALLBACK_RATES.USD_RATES.SAR,
      QAR: rates.QAR ? 1 / rates.QAR : FALLBACK_RATES.USD_RATES.QAR,
      KWD: rates.KWD ? 1 / rates.KWD : FALLBACK_RATES.USD_RATES.KWD,
      OMR: rates.OMR ? 1 / rates.OMR : FALLBACK_RATES.USD_RATES.OMR,
      GBP: rates.GBP ? 1 / rates.GBP : FALLBACK_RATES.USD_RATES.GBP,
      CAD: rates.CAD ? 1 / rates.CAD : FALLBACK_RATES.USD_RATES.CAD,
      AUD: rates.AUD ? 1 / rates.AUD : FALLBACK_RATES.USD_RATES.AUD,
    };

    return {
      USD_to_INR: usdToInr,
      USD_RATES: usdRates,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching live exchange rates, using fallbacks:", error);
    return FALLBACK_RATES;
  }
}
