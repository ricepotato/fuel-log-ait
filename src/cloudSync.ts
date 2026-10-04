import { Storage } from "@apps-in-toss/web-framework";
import { getCars } from "./carRepository";
import { getFuelLogs } from "./repository";
import type { Car } from "./types/car";
import type { FuelLog } from "./types/fuelLog";

const SYNC_ENABLED_KEY = "cloud-sync-enabled";

/**
 * 클라우드에 올리는 데이터 묶음이에요. 사용자를 특정할 수 있는 정보는 넣지 않아요.
 */
export interface SyncSnapshot {
  cars: Car[];
  fuelLogs: FuelLog[];
  savedAt: string; // ISO 8601
}

export async function getCloudSyncEnabled(): Promise<boolean> {
  return (await Storage.getItem(SYNC_ENABLED_KEY)) === "true";
}

export async function saveCloudSyncEnabled(enabled: boolean): Promise<void> {
  await Storage.setItem(SYNC_ENABLED_KEY, String(enabled));
}

/** 이 기기 Storage 에 있는 차와 주유 기록을 한 묶음으로 모아요. */
export async function buildSyncSnapshot(): Promise<SyncSnapshot> {
  const [cars, fuelLogs] = await Promise.all([getCars(), getFuelLogs()]);
  return { cars, fuelLogs, savedAt: new Date().toISOString() };
}

/**
 * 현재 데이터를 클라우드에 저장해요.
 * 서버가 아직 없어서 묶음만 만들고 실제 업로드는 하지 않아요.
 */
export async function saveToCloud(): Promise<SyncSnapshot> {
  const snapshot = await buildSyncSnapshot();
  // TODO: 서버가 생기면 snapshot 을 업로드해요.
  console.log(
    `[cloudSync] 차 ${snapshot.cars.length}대, 기록 ${snapshot.fuelLogs.length}개를 저장할 준비가 됐어요`,
  );
  return snapshot;
}
