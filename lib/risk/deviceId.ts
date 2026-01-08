// lib/risk/deviceId.ts
// Device ID generation for anti-abuse tracking

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  
  const key = "device_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}
