import { Storage } from "@apps-in-toss/web-framework";
import { FuelLog } from "./types/fuelLog";
import {
  getAnonymousKey,
  getOperationalEnvironment,
} from "@apps-in-toss/web-framework";
import { FuelLogApi } from "./api/fuellog";

const KEY = "fuel-logs";

/**
 * 서버가 기록의 원본이고, Storage 는 화면을 바로 그리기 위한 캐시예요.
 * 캐시 함수(getFuelLogs, addFuelLog ...)는 로컬만 건드리고,
 * 서버 반영은 syncFuelLog / reloadFuelLogsFromServer 가 담당해요.
 */

async function writeCache(fuelLogs: FuelLog[]): Promise<void> {
  await Storage.setItem(KEY, JSON.stringify(fuelLogs));
}

/** 서버 클라이언트를 만들어요. 사용자 키를 얻지 못하면 null 이에요. */
async function createFuelLogApi(): Promise<FuelLogApi | null> {
  const anonymousKey = await getAnonymousKey();
  if (!anonymousKey || anonymousKey === "ERROR") {
    console.warn("createFuelLogApi: getAnonymousKey 를 얻지 못했어요.");
    return null;
  }
  return new FuelLogApi(anonymousKey.hash, getOperationalEnvironment());
}

/** 서버 기록을 받아 캐시를 통째로 교체해요. 실패하면 캐시를 건드리지 않아요. */
async function pullIntoCache(api: FuelLogApi): Promise<FuelLog[] | null> {
  try {
    const fuelLogs = await api.getFuelLogs();
    await writeCache(fuelLogs);
    return fuelLogs;
  } catch (error) {
    console.warn("서버 기록을 읽지 못했어요.", error);
    return null;
  }
}

/**
 * 로컬 캐시에만 있고 서버엔 없는 기록을 서버에 올려요.
 * 오프라인 상태로 기록을 추가했다가 서버 반영이 실패한 경우, 그 기록이
 * 캐시에만 남아 있다가 다음 pull 때 통째로 사라지는 걸 막기 위함이에요.
 * 다른 기기에서 지운 기록이 이 기기 캐시에 아직 남아 있다면 되살아날 수
 * 있는데, 이 앱은 삭제 여부를 서버에 기록해두지 않아서(tombstone 없음)
 * 지금 구조로는 구분할 방법이 없어요.
 */
async function pushLocalOnlyFuelLogs(
  api: FuelLogApi,
  serverFuelLogs: FuelLog[],
): Promise<void> {
  const localFuelLogs = await getFuelLogs();
  const serverIds = new Set(serverFuelLogs.map((log) => log.id));
  const localOnlyFuelLogs = localFuelLogs.filter(
    (log) => !serverIds.has(log.id),
  );

  for (const log of localOnlyFuelLogs) {
    if (!(await api.addFuelLog(log))) {
      console.warn(`로컬 전용 기록을 서버에 올리지 못했어요: ${log.id}`);
    }
  }
}

/**
 * 서버 기록을 받아오되, 그 전에 로컬에만 있는 기록을 먼저 서버로 올려요.
 * 앱을 시작할 때(변경 사항 없이 하는 동기화)만 필요한 처리라 별도 경로로 뒀어요.
 */
async function reconcileWithServer(api: FuelLogApi): Promise<FuelLog[] | null> {
  let serverFuelLogs: FuelLog[];
  try {
    serverFuelLogs = await api.getFuelLogs();
  } catch (error) {
    console.warn("서버 기록을 읽지 못했어요.", error);
    return null;
  }

  await pushLocalOnlyFuelLogs(api, serverFuelLogs);

  return pullIntoCache(api);
}

// --- 로컬 캐시 ---

export async function getFuelLogs(): Promise<FuelLog[]> {
  const raw = await Storage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw) as FuelLog[];
}

export async function addFuelLog(item: FuelLog): Promise<void> {
  const logs = await getFuelLogs();
  logs.push(item);
  await writeCache(logs);
}

export async function updateFuelLog(item: FuelLog): Promise<void> {
  const logs = await getFuelLogs();
  await writeCache(logs.map((log) => (log.id === item.id ? item : log)));
}

export async function getFuelLogById(id: string): Promise<FuelLog | undefined> {
  const logs = await getFuelLogs();
  return logs.find((log) => log.id === id);
}

export async function removeFuelLog(id: string): Promise<void> {
  const logs = await getFuelLogs();
  await writeCache(logs.filter((log) => log.id !== id));
}

/**
 * 로컬 캐시만 비웁니다(sandbox 전용 테스트 기능).
 * 서버 기록은 그대로라 다음 동기화 때 다시 내려옵니다.
 */
export async function clearFuelLogs(): Promise<void> {
  await Storage.removeItem(KEY);
}

// --- 서버 동기화 ---

export type FuelLogChange =
  | { type: "add"; log: FuelLog }
  | { type: "update"; log: FuelLog }
  | { type: "remove"; id: string };

async function applyChange(
  api: FuelLogApi,
  change: FuelLogChange,
): Promise<boolean> {
  switch (change.type) {
    case "add":
      return api.addFuelLog(change.log);
    case "update":
      return api.updateFuelLog(change.log);
    case "remove":
      return api.deleteFuelLog(change.id);
  }
}

/**
 * 변경 하나를 서버에 반영한 뒤, 서버 기준으로 캐시를 다시 맞춥니다.
 * change 를 생략하면 앱 시작 시 동기화로 간주해, 오프라인 등으로 서버에
 * 아직 반영되지 못한 채 캐시에만 남아 있는 기록을 먼저 서버로 올린 뒤 받아옵니다.
 *
 * 서버에 반영하지 못했으면 캐시를 건드리지 않고 null 을 반환합니다.
 * 이때 내려받아 덮어쓰면 방금 로컬에 저장한 변경이 사라지기 때문입니다.
 */
export async function syncFuelLog(
  change?: FuelLogChange,
): Promise<FuelLog[] | null> {
  const api = await createFuelLogApi();
  if (!api) return null;

  if (!change) {
    return reconcileWithServer(api);
  }

  if (!(await applyChange(api, change))) {
    return null;
  }

  return pullIntoCache(api);
}

/**
 * 서버 기록을 다시 받아 캐시를 갱신합니다(설정의 "데이터 가져오기").
 * 서버가 원본이므로 캐시를 서버 내용으로 교체합니다.
 */
export async function reloadFuelLogsFromServer(): Promise<FuelLog[] | null> {
  const api = await createFuelLogApi();
  if (!api) return null;
  return pullIntoCache(api);
}
