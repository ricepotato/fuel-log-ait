import { Storage } from "@apps-in-toss/web-framework";
import { FuelLog } from "./types/fuelLog";
import { getAnonymousKey } from "@apps-in-toss/web-framework";
import { saveRemoteFuelLogs } from "./api/fuellog";

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

export async function getFuelLogById(id: string): Promise<FuelLog | undefined> {
  const logs = await getFuelLogs();
  return logs.find((log) => log.id === id);
}

export async function removeFuelLog(id: string): Promise<void> {
  const logs = await getFuelLogs();
  const filtered = logs.filter((log) => log.id !== id);
  await Storage.setItem(KEY, JSON.stringify(filtered));
}

export async function clearFuelLogs(): Promise<void> {
  await Storage.removeItem(KEY);
}

export async function saveFuelLogRemote() {
  const anonymousKey = await getAnonymousKey();
  const fuelLogs = await getFuelLogs();
  if (!anonymousKey || anonymousKey === "ERROR") {
    return;
  }

  await saveRemoteFuelLogs(anonymousKey.hash, fuelLogs);
}

export async function mergeRemoteFuelLogs(remoteFuelLogs: FuelLog[]) {
  /**
   * remote 에서 가져온 데이터와 local 데이터를 병합합니다.
   * ID 를 기준으로 중복을 제거하고 최종적으로 local 과 remote 에 데이터를 저장하여 동기화 합니다.
   **/
  const localFuelLogs = await getFuelLogs();

  const mergedById = new Map<string, FuelLog>();
  for (const log of remoteFuelLogs) {
    mergedById.set(log.id, log);
  }
  // local 데이터는 삭제되지 않아야 하므로, 같은 ID 가 있으면 local 로 덮어써 우선한다.
  for (const log of localFuelLogs) {
    mergedById.set(log.id, log);
  }
  const mergedFuelLogs = Array.from(mergedById.values());

  await Storage.setItem(KEY, JSON.stringify(mergedFuelLogs));

  const anonymousKey = await getAnonymousKey();
  if (!anonymousKey || anonymousKey === "ERROR") {
    return;
  }
  await saveRemoteFuelLogs(anonymousKey.hash, mergedFuelLogs);
}
