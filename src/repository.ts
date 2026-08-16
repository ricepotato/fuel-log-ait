import { Storage } from "@apps-in-toss/web-framework";
import { FuelLog } from "./types/fuelLog";
import { getAnonymousKey } from "@apps-in-toss/web-framework";
import { fetchRemoteFuelLogs, saveRemoteFuelLogs } from "./api/fuellog";

const KEY = "fuel-logs";

/**
 * 두 목록을 ID 기준으로 합쳐 중복을 제거합니다.
 * 같은 ID 가 양쪽에 있으면 방금 편집한 값인 local 을 우선합니다.
 */
function mergeFuelLogsById(
  remoteFuelLogs: FuelLog[],
  localFuelLogs: FuelLog[],
): FuelLog[] {
  const mergedById = new Map<string, FuelLog>();
  for (const log of remoteFuelLogs) {
    mergedById.set(log.id, log);
  }
  for (const log of localFuelLogs) {
    mergedById.set(log.id, log);
  }
  return Array.from(mergedById.values());
}

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

export async function saveFuelLogRemote(
  removedIds: string[] = [],
): Promise<void> {
  /**
   * local 데이터를 remote 와 병합해 동기화합니다.
   * remote 를 그대로 덮어쓰면 다른 기기에서 저장한 기록이 사라지므로,
   * mergeRemoteFuelLogs 와 같은 방식으로 ID 기준 병합한 뒤 양쪽에 저장합니다.
   * removedIds 는 이번에 삭제한 기록이라, remote 에 남아 있어도 되살리지 않습니다.
   */
  const anonymousKey = await getAnonymousKey();
  if (!anonymousKey || anonymousKey === "ERROR") {
    return;
  }

  const localFuelLogs = await getFuelLogs();

  let remoteFuelLogs: FuelLog[];
  try {
    remoteFuelLogs = await fetchRemoteFuelLogs(anonymousKey.hash);
  } catch (error) {
    // remote 를 못 읽은 채로 올리면 다른 기기 기록을 지우게 되므로 건너뜁니다.
    // local 저장은 이미 끝난 상태라 다음 동기화 때 다시 시도됩니다.
    console.warn("saveFuelLogRemote: remote 데이터를 읽지 못했어요.", error);
    return;
  }

  const mergedFuelLogs = mergeFuelLogsById(
    remoteFuelLogs,
    localFuelLogs,
  ).filter((log) => !removedIds.includes(log.id));

  await Storage.setItem(KEY, JSON.stringify(mergedFuelLogs));
  await saveRemoteFuelLogs(anonymousKey.hash, mergedFuelLogs);
}

export async function mergeRemoteFuelLogs(remoteFuelLogs: FuelLog[]) {
  /**
   * remote 에서 가져온 데이터와 local 데이터를 병합합니다.
   * ID 를 기준으로 중복을 제거하고 최종적으로 local 과 remote 에 데이터를 저장하여 동기화 합니다.
   **/
  const localFuelLogs = await getFuelLogs();
  const mergedFuelLogs = mergeFuelLogsById(remoteFuelLogs, localFuelLogs);

  await Storage.setItem(KEY, JSON.stringify(mergedFuelLogs));

  const anonymousKey = await getAnonymousKey();
  if (!anonymousKey || anonymousKey === "ERROR") {
    return;
  }
  await saveRemoteFuelLogs(anonymousKey.hash, mergedFuelLogs);
}
