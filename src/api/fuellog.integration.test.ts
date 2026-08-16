import { describe, expect, it } from "vitest";
import {
  fetchRemoteFuelLogs,
  getFuelLogsUploadUrl,
  saveRemoteFuelLogs,
} from "./fuellog";
import { FuelLog } from "../types/fuelLog";

// 실제 배포된 API 서버를 호출하는 통합 테스트.
// 네트워크가 필요하며, presigned url 발급만 수행하고 실제 업로드는 하지 않는다.
const TEST_USER_ID =
  process.env.INTEGRATION_TEST_USER_ID ?? "integration-test-user";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("getFuelLogsUploadUrl", () => {
  it("userId로 S3 presigned upload url을 발급받는다", async () => {
    const result = await getFuelLogsUploadUrl(TEST_USER_ID);

    expect(typeof result.upload_url).toBe("string");
    expect(result.upload_url.startsWith("https://")).toBe(true);
  }, 15000);
});

describe("saveRemoteFuelLogs", () => {
  it("fuelLogs를 업로드하면 fetchRemoteFuelLogs로 동일한 데이터를 조회할 수 있다", async () => {
    const fuelLogs: FuelLog[] = [
      {
        id: "integration-test-1",
        date: "2026-08-16",
        location: "통합테스트 주유소",
        liters: 40.5,
        pricePerLiter: 1650,
        totalPrice: 66825,
        odometer: 12345,
        fuelLevel: 100,
      },
    ];

    const saved = await saveRemoteFuelLogs(TEST_USER_ID, fuelLogs);
    expect(saved).toBe(true);

    // CloudFront가 S3 원본을 반영할 때까지 짧게 재시도한다.
    let fetched: FuelLog[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      fetched = await fetchRemoteFuelLogs(TEST_USER_ID);
      if (fetched.length > 0) break;
      await sleep(1000);
    }

    expect(fetched).toEqual(fuelLogs);
  }, 30000);
});
