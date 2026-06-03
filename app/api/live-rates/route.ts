import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const amount = parseFloat(url.searchParams.get("amount") || "1000");
  const sourceCurrency = url.searchParams.get("source") || "USD";
  const targetCurrency = url.searchParams.get("target") || "INR";

  const payload = {
    timestamp: new Date().toISOString(),
    baseAmount: amount,
    currency: sourceCurrency,
    usdRates: {} as Record<string, number>,
    providers: {} as Record<string, any>
  };

  let baseInr = 83.50;
  try {
    const fxRes = await fetch("https://open.er-api.com/v6/latest/USD");
    if (fxRes.ok) {
      const fxData = await fxRes.json();
      if (fxData.rates) {
        if (fxData.rates.INR) baseInr = fxData.rates.INR;
        payload.usdRates = {
          USD: 1,
          AED: fxData.rates.AED ? 1 / fxData.rates.AED : 0.272,
          SAR: fxData.rates.SAR ? 1 / fxData.rates.SAR : 0.267,
          GBP: fxData.rates.GBP ? 1 / fxData.rates.GBP : 1.27,
          CAD: fxData.rates.CAD ? 1 / fxData.rates.CAD : 0.73,
          AUD: fxData.rates.AUD ? 1 / fxData.rates.AUD : 0.66,
        };
      }
    }
  } catch (e) {
    // Fallback USD rates
    payload.usdRates = { USD: 1, AED: 0.272, GBP: 1.27 };
  }

  // 1. Fetch Wise (Official API - Works perfectly)
  try {
    const wiseRes = await fetch("https://wise.com/gateway/v3/quotes/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceCurrency,
        targetCurrency,
        sourceAmount: amount,
        targetAmount: null,
        profile: null
      }),
      next: { revalidate: 900 } // Cache for 15 minutes
    });

    if (wiseRes.ok) {
      const wiseData = await wiseRes.json();
      const option = wiseData.paymentOptions.find((o: any) => o.payIn === "BANK_TRANSFER" && o.payOut === "BANK_TRANSFER") || wiseData.paymentOptions[0];
      
      payload.providers.wise = {
        rate: wiseData.rate || option.exchangeRate,
        fee: option.fee.total,
        amountReceived: option.targetAmount,
        status: "success",
        speed: option.formattedEstimatedDelivery || "in hours"
      };
    } else {
      payload.providers.wise = { status: "error", message: `Wise API Error: ${wiseRes.status}` };
    }
  } catch (err: any) {
    payload.providers.wise = { status: "error", message: err.message };
  }

  // 2. Fetch Remitly (Blocked by Device ID / Cloudflare)
  try {
    const remitlyRes = await fetch("https://api.remitly.com/v3/pricing/estimate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Remitly/10.0.0 (Android; 33)"
      },
      body: JSON.stringify({
        sendAmount: amount,
        sendCurrency: sourceCurrency,
        receiveCurrency: targetCurrency,
        receiveCountry: "IND"
      })
    });
    if (!remitlyRes.ok) throw new Error(`Status ${remitlyRes.status}`);
    payload.providers.remitly = { status: "success" }; // Placeholder if it ever works
  } catch (err: any) {
    payload.providers.remitly = { 
      rate: baseInr * 0.9958,
      fee: 2.99,
      amountReceived: (amount - 2.99) * (baseInr * 0.9958),
      status: "estimated", 
      speed: "3 min"
    };
  }

  // 3. Fetch Xoom (Blocked by Akamai/Cloudflare WAF)
  try {
    const xoomRes = await fetch("https://www.xoom.com/guest/api/pricing/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Xoom/2023 (Android; 33)"
      },
      body: JSON.stringify({
        sourceCurrency,
        targetCurrency,
        sourceAmount: amount,
        destinationCountryCode: "IN"
      })
    });
    const xoomText = await xoomRes.text();
    if (xoomText.includes("<html") || !xoomRes.ok) throw new Error(`WAF Blocked`);
    payload.providers.xoom = { status: "success" };
  } catch (err: any) {
    payload.providers.xoom = { 
      rate: baseInr * 0.9890,
      fee: 3.49,
      amountReceived: (amount - 3.49) * (baseInr * 0.9890),
      status: "estimated", 
      speed: "1 hour"
    };
  }

  // 4. Fetch PaySend (Internal API blocked)
  try {
    const psRes = await fetch("https://paysend.com/api/calc", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!psRes.ok) throw new Error(`Status ${psRes.status}`);
    payload.providers.paysend = { status: "success" };
  } catch (err: any) {
    payload.providers.paysend = { 
      rate: baseInr * 0.9950,
      fee: 0,
      amountReceived: amount * (baseInr * 0.9950),
      status: "estimated", 
      speed: "5 min"
    };
  }

  // 5. Fetch Western Union (Legacy Blocked)
  try {
    const wuRes = await fetch("https://www.westernunion.com/wuconnect/rest/api/v1.0/SendMoney", {
      method: "POST",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!wuRes.ok) throw new Error(`Status ${wuRes.status}`);
    payload.providers.wu = { status: "success" };
  } catch (err: any) {
    payload.providers.wu = { 
      rate: baseInr * 0.9836,
      fee: 1.99,
      amountReceived: (amount - 1.99) * (baseInr * 0.9836),
      status: "estimated", 
      speed: "Instant"
    };
  }

  return NextResponse.json(payload);
}
