import { FuelLog } from "../types/fuelLog";

const API_URL =
  "https://91p5i7lvpj.execute-api.ap-northeast-2.amazonaws.com/Prod";

/** 운영 환경. getOperationalEnvironment() 의 반환값과 같아요. */
export type OperationalEnv = "toss" | "sandbox";

export interface ReceiptAnalyzeResult {
  date: string;
  location: string;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
}

function base64ToBlob(
  base64: string,
  contentType: string = "image/jpeg",
): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

export async function analyzeReceipt(
  userId: string,
  base64: string,
  contentType: string = "image/jpeg",
): Promise<ReceiptAnalyzeResult> {
  // S3 presigned URL은 image/jpeg로 서명되므로 업로드 타입을 맞춤
  const uploadContentType = "image/jpeg";
  const blob = base64ToBlob(base64, uploadContentType);

  const uploadUrlResp = await fetch(`${API_URL}/receipt/upload-url`, {
    method: "POST",
    headers: { "x-user-id": userId, "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: uploadContentType }),
  });
  if (!uploadUrlResp.ok) {
    throw new Error(`upload-url 요청 실패: ${uploadUrlResp.status}`);
  }
  const { upload_url, key } = await uploadUrlResp.json();

  const uploadResp = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": uploadContentType },
    body: blob,
  });
  if (!uploadResp.ok) {
    throw new Error(`S3 업로드 실패: ${uploadResp.status}`);
  }

  const analyzeResp = await fetch(`${API_URL}/receipt/analyze`, {
    method: "POST",
    headers: { "x-user-id": userId, "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!analyzeResp.ok) {
    throw new Error(`analyze 요청 실패: ${analyzeResp.status}`);
  }

  return analyzeResp.json();
}

export async function fetchRemoteFuelLogs(
  userId: string,
  env: OperationalEnv,
): Promise<FuelLog[]> {
  /**
   * 서버에 저장된 주유 기록을 읽어옵니다.
   * 예전에는 S3/CDN 의 JSON blob 을 읽었지만, 지금은 기록 단위 CRUD API 를 씁니다.
   */
  return new FuelLogApi(userId, env).getFuelLogs();
}

interface FuelLogListResponse {
  items: FuelLog[];
}

/**
 * 주유 기록 CRUD API 클라이언트.
 *
 * 모든 요청에 x-user-id, x-env 헤더가 필요해서 인스턴스가 들고 있어요.
 * env 는 DynamoDB 테이블 자체를 나눠요(toss=운영, sandbox=개발/테스트).
 * 같은 id 라도 env 가 다르면 완전히 별개의 레코드라, sandbox 에서 만든 기록을
 * toss 로 수정/삭제하면 404 가 반환돼요.
 */
export class FuelLogApi {
  constructor(
    private readonly userId: string,
    private readonly env: OperationalEnv,
  ) {}

  private headers(): HeadersInit {
    return {
      "x-user-id": this.userId,
      "x-env": this.env,
      "Content-Type": "application/json",
    };
  }

  /** 실패 응답 body 의 { error } 메시지까지 붙여 원인을 알 수 있게 해요. */
  private async describeError(
    response: Response,
    action: string,
  ): Promise<string> {
    let detail = "";
    try {
      const body = await response.json();
      if (typeof body?.error === "string") {
        detail = `: ${body.error}`;
      }
    } catch {
      // body 가 JSON 이 아니면 상태 코드만 남겨요.
    }
    return `${action} 실패: ${response.status}${detail}`;
  }

  async getFuelLogs(): Promise<FuelLog[]> {
    /**
     * 사용자의 주유 기록 전체를 조회합니다. 서버가 date 내림차순으로 정렬해 줍니다.
     * 호출 한도(429) 같은 실패를 빈 목록으로 오인하면 데이터를 덮어쓸 수 있어
     * 실패 시에는 예외를 던집니다.
     */
    const response = await fetch(`${API_URL}/fuel-logs`, {
      method: "GET",
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new Error(await this.describeError(response, "주유 기록 조회"));
    }

    const { items }: FuelLogListResponse = await response.json();
    return items ?? [];
  }

  async addFuelLog(fuelLog: FuelLog): Promise<boolean> {
    /**
     * 주유 기록을 새로 저장합니다. id 는 클라이언트가 만들어 보냅니다.
     */
    const response = await fetch(`${API_URL}/fuel-logs`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(fuelLog),
    });
    if (!response.ok) {
      console.warn(await this.describeError(response, "주유 기록 저장"));
      return false;
    }

    return true;
  }

  async updateFuelLog(fuelLog: FuelLog): Promise<boolean> {
    /**
     * 주유 기록을 수정합니다. 전체 교체 방식이라 FuelLog 전체를 보내야 하며,
     * 경로의 id 와 body 의 id 가 다르면 400, 없는 기록이면 404 가 반환됩니다.
     */
    const response = await fetch(
      `${API_URL}/fuel-logs/${encodeURIComponent(fuelLog.id)}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(fuelLog),
      },
    );
    if (!response.ok) {
      console.warn(await this.describeError(response, "주유 기록 수정"));
      return false;
    }

    return true;
  }

  async deleteFuelLog(id: string): Promise<boolean> {
    /**
     * 주유 기록을 삭제합니다. 없는 기록이면 404 가 반환됩니다.
     */
    const response = await fetch(
      `${API_URL}/fuel-logs/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: this.headers(),
      },
    );
    if (!response.ok) {
      console.warn(await this.describeError(response, "주유 기록 삭제"));
      return false;
    }

    return true;
  }
}
