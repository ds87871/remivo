const encoder = new TextEncoder();

export async function signToken(username: string, secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const data = `${username}.${timestamp}`;
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return `${data}.${signatureHex}`;
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [username, timestamp, signatureHex] = parts;
    
    // Check expiration (24 hours)
    const time = parseInt(timestamp, 10);
    if (isNaN(time) || Date.now() - time > 24 * 60 * 60 * 1000) {
      return false;
    }
    
    const data = `${username}.${timestamp}`;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    // Convert signatureHex to Uint8Array
    const matches = signatureHex.match(/.{1,2}/g);
    if (!matches) return false;
    const sigBytes = new Uint8Array(
      matches.map(byte => parseInt(byte, 16))
    );
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(data)
    );
    
    return isValid;
  } catch (e) {
    return false;
  }
}
