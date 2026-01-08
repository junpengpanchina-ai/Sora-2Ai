export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "device_id_v1";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

