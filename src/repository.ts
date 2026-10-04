import { Storage } from "@apps-in-toss/web-framework";
import { FuelLog } from "./types/fuelLog";

const KEY = "fuel-logs";

/**
 * 주유 기록은 이 기기 Storage 에만 저장해요. 서버 연동은 재설계 중이라 없어요.
 */

async function writeFuelLogs(fuelLogs: FuelLog[]): Promise<void> {
  await Storage.setItem(KEY, JSON.stringify(fuelLogs));
}

export async function getFuelLogs(): Promise<FuelLog[]> {
  const raw = await Storage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw) as FuelLog[];
}

export async function addFuelLog(item: FuelLog): Promise<void> {
  const logs = await getFuelLogs();
  logs.push(item);
  await writeFuelLogs(logs);
}

export async function addFuelLogs(items: FuelLog[]): Promise<void> {
  const logs = await getFuelLogs();
  await writeFuelLogs([...logs, ...items]);
}

/** 차가 지정되지 않은 기록을 모두 carId 차에 연결하고, 바뀐 기록을 반환해요. */
export async function linkUnassignedFuelLogs(
  carId: string,
): Promise<FuelLog[]> {
  const logs = await getFuelLogs();
  const linked: FuelLog[] = [];
  const next = logs.map((log) => {
    if (log.carId) return log;
    const updated = { ...log, carId };
    linked.push(updated);
    return updated;
  });
  if (linked.length > 0) await writeFuelLogs(next);
  return linked;
}

/**
 * carId 차의 기록을 모두 지워요(차 삭제 시).
 * carId 가 없는 기록은 기본 차 소속이라, 기본 차를 지울 때는 함께 지워요.
 */
export async function removeFuelLogsOfCar(
  carId: string,
  isDefaultCar: boolean,
): Promise<void> {
  const logs = await getFuelLogs();
  const belongsToCar = (log: FuelLog) =>
    log.carId === carId || (isDefaultCar && !log.carId);
  if (!logs.some(belongsToCar)) return;
  await writeFuelLogs(logs.filter((log) => !belongsToCar(log)));
}

export async function updateFuelLog(item: FuelLog): Promise<void> {
  const logs = await getFuelLogs();
  await writeFuelLogs(logs.map((log) => (log.id === item.id ? item : log)));
}

export async function getFuelLogById(id: string): Promise<FuelLog | undefined> {
  const logs = await getFuelLogs();
  return logs.find((log) => log.id === id);
}

export async function removeFuelLog(id: string): Promise<void> {
  const logs = await getFuelLogs();
  await writeFuelLogs(logs.filter((log) => log.id !== id));
}

/** 이 기기의 기록을 모두 지워요(sandbox 전용 테스트 기능). */
export async function clearFuelLogs(): Promise<void> {
  await Storage.removeItem(KEY);
}
