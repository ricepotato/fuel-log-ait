import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FuelLog } from "./types/fuelLog";

const storage = new Map<string, string>();
let serverLogs: FuelLog[] = [];

vi.mock("@apps-in-toss/web-framework", () => ({
  Environment: { environment: "sandbox" },
  User: { getAnonymousKey: async () => ({ hash: "test-user" }) },
  Storage: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: async (key: string) => {
      storage.delete(key);
    },
  },
}));

vi.mock("./api/fuellog", () => ({
  FuelLogApi: class {
    async getFuelLogs() {
      return serverLogs;
    }
    async addFuelLog() {
      return true;
    }
    async updateFuelLog() {
      return true;
    }
  },
}));

const { addFuelLog, getFuelLogs, syncFuelLog } = await import("./repository");

/** 서버는 ALL_FIELDS 에 없는 carId, kWh, pricePerkWh 를 버리고 돌려줘요. */
function stripUnsupported(log: FuelLog): FuelLog {
  const { carId, kWh, pricePerkWh, ...rest } = log;
  void carId;
  void kWh;
  void pricePerkWh;
  return rest;
}

describe("서버 동기화 후 로컬 전용 필드 유지", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("전기차 충전 기록의 kWh, pricePerkWh, carId 가 남아요", async () => {
    const log: FuelLog = {
      id: "1",
      date: "2026-10-04",
      totalPrice: 34720,
      kWh: 100,
      pricePerkWh: 347,
      carId: "ev-car",
    };
    await addFuelLog(log);
    serverLogs = [stripUnsupported(log)];

    await syncFuelLog({ type: "add", log });

    expect(await getFuelLogs()).toEqual([log]);
  });

  it("서버에 값이 있으면 서버 값을 써요", async () => {
    await addFuelLog({ id: "2", date: "2026-10-04", totalPrice: 50000 });
    serverLogs = [{ id: "2", date: "2026-10-04", totalPrice: 60000 }];

    await syncFuelLog();

    expect((await getFuelLogs())[0].totalPrice).toBe(60000);
  });
});
