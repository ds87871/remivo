import { NextResponse } from 'next/server'
import { fetchLiveRates } from '../../../lib/exchange-rates'

export const dynamic = 'force-dynamic';

export async function GET() {
  const rates = await fetchLiveRates()
  return NextResponse.json(rates)
}
