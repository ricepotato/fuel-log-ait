import { Storage } from "@apps-in-toss/web-framework";
import { FuelLog } from "./types/fuelLog";

const KEY = "fuel-logs";

export async function getFuelLogs(): Promise<FuelLog[]> {
  const raw = await Storage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw) as FuelLog[];
}

export async function addFuelLog(item: FuelLog): Promise<void> {
  const logs = await getFuelLogs();
  logs.push(item);
  await Storage.setItem(KEY, JSON.stringify(logs));
}

export async function updateFuelLog(item: FuelLog): Promise<void> {
  const logs = await getFuelLogs();
  const updated = logs.map((log) => (log.id === item.id ? item : log));
  await Storage.setItem(KEY, JSON.stringify(updated));
}

export async function removeFuelLog(id: string): Promise<void> {
  const logs = await getFuelLogs();
  const filtered = logs.filter((log) => log.id !== id);
  await Storage.setItem(KEY, JSON.stringify(filtered));
}
