import { describe, expect, it } from "vitest";
import { FuelLogApi, fetchRemoteFuelLogs } from "./fuellog";
import { FuelLog } from "../types/fuelLog";

// 실제 배포된 API 서버를 호출하는 통합 테스트. 네트워크가 필요하다.
// 운영(toss) 데이터를 건드리지 않도록 sandbox 환경에만 기록한다.
const TEST_USER_ID =
  process.env.INTEGRATION_TEST_USER_ID ?? "integration-test-user";
const TEST_ENV = "sandbox" as const;

const api = new FuelLogApi(TEST_USER_ID, TEST_ENV);

function makeFuelLog(): FuelLog {
  return {
    id: `integration-test-${Date.now()}`,
    date: "2026-08-16",
    location: "통합테스트 주유소",
    liters: 40.5,
    pricePerLiter: 1650,
    totalPrice: 66825,
    odometer: 12345,
    fuelLevel: 100,
  };
}

describe("FuelLogApi", () => {
  it("기록을 저장하고 조회, 수정, 삭제할 수 있다", async () => {
    const fuelLog = makeFuelLog();

    expect(await api.addFuelLog(fuelLog)).toBe(true);
    expect(
      (await api.getFuelLogs()).find((log) => log.id === fuelLog.id),
    ).toEqual(fuelLog);

    expect(await api.updateFuelLog({ ...fuelLog, totalPrice: 70000 })).toBe(
      true,
    );
    expect(
      (await api.getFuelLogs()).find((log) => log.id === fuelLog.id)
        ?.totalPrice,
    ).toBe(70000);

    expect(await api.deleteFuelLog(fuelLog.id)).toBe(true);
    expect(
      (await api.getFuelLogs()).find((log) => log.id === fuelLog.id),
    ).toBeUndefined();
  }, 30000);

  it("없는 기록을 수정하거나 삭제하면 false를 반환한다", async () => {
    const missing = { ...makeFuelLog(), id: "integration-test-missing-id" };

    expect(await api.updateFuelLog(missing)).toBe(false);
    expect(await api.deleteFuelLog(missing.id)).toBe(false);
  }, 30000);

  it("env가 다르면 서로 다른 테이블이라 기록이 보이지 않는다", async () => {
    const fuelLog = makeFuelLog();
    const tossApi = new FuelLogApi(TEST_USER_ID, "toss");

    expect(await api.addFuelLog(fuelLog)).toBe(true);
    try {
      expect(await tossApi.updateFuelLog(fuelLog)).toBe(false);
      expect(await tossApi.deleteFuelLog(fuelLog.id)).toBe(false);
    } finally {
      await api.deleteFuelLog(fuelLog.id);
    }
  }, 30000);
});

describe("fetchRemoteFuelLogs", () => {
  it("FuelLogApi.getFuelLogs와 같은 결과를 돌려준다", async () => {
    const fuelLog = makeFuelLog();

    expect(await api.addFuelLog(fuelLog)).toBe(true);
    try {
      const fetched = await fetchRemoteFuelLogs(TEST_USER_ID, TEST_ENV);
      expect(fetched.find((log) => log.id === fuelLog.id)).toEqual(fuelLog);
    } finally {
      await api.deleteFuelLog(fuelLog.id);
    }
  }, 30000);
});
