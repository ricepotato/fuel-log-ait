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
 * change 를 생략하면 서버에서 받아오기만 합니다(앱 시작 시 동기화).
 *
 * 서버에 반영하지 못했으면 캐시를 건드리지 않고 null 을 반환합니다.
 * 이때 내려받아 덮어쓰면 방금 로컬에 저장한 변경이 사라지기 때문입니다.
 */
export async function syncFuelLog(
  change?: FuelLogChange,
): Promise<FuelLog[] | null> {
  const api = await createFuelLogApi();
  if (!api) return null;

  if (change && !(await applyChange(api, change))) {
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
