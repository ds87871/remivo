import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Extract the real client IP from Vercel/Next.js headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    let clientIp = "";
    if (forwardedFor) {
      clientIp = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      clientIp = realIp.trim();
    }

    // If we have the client IP, query that specific IP. 
    // Otherwise query the default (which will just be the server's datacenter IP).
    const url = clientIp ? `https://ipapi.co/${clientIp}/json/` : "https://ipapi.co/json/";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 
        "Accept": "application/json",
        "User-Agent": "Remivo-Server/1.0" 
      }
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: `ipapi.co returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    // Always return a graceful 500 if the network request completely fails
    return NextResponse.json(
      { error: "Internal server error fetching location" },
      { status: 500 }
    );
  }
}
