import { Storage } from "@apps-in-toss/web-framework";
import type { Car } from "./types/car";

const CARS_KEY = "cars";
const SELECTED_CAR_KEY = "selected-car-id";

/**
 * 차 목록과 선택한 차는 이 기기 Storage 에 저장해요.
 */

export async function getCars(): Promise<Car[]> {
  const raw = await Storage.getItem(CARS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Car[];
}

export async function saveCars(cars: Car[]): Promise<void> {
  await Storage.setItem(CARS_KEY, JSON.stringify(cars));
}

export async function getSelectedCarId(): Promise<string | null> {
  return (await Storage.getItem(SELECTED_CAR_KEY)) ?? null;
}

export async function saveSelectedCarId(id: string): Promise<void> {
  await Storage.setItem(SELECTED_CAR_KEY, id);
}

export function createCarId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // randomUUID 가 없는 오래된 웹뷰용 RFC 4122 v4 대체 구현
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
