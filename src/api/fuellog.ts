import { FuelLog } from "../types/fuelLog";

const API_URL =
  "https://91p5i7lvpj.execute-api.ap-northeast-2.amazonaws.com/Prod";

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

export interface FuelLogUploadUrlResult {
  upload_url: string;
}

export async function getFuelLogsUploadUrl(
  userId: string,
): Promise<FuelLogUploadUrlResult> {
  /**
   * 클라우드에 데이터를 업로드 하기 위한 s3 presigned url 을 얻습니다.
   */
  const response = await fetch(`${API_URL}/receipt/data`, {
    method: "POST",
    headers: { "x-user-id": userId, "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`upload-url 요청 실패: ${response.status}`);
  }
  return await response.json();
}

export async function uploadFuelLogs(
  uploadUrl: string,
  fuelLogs: FuelLog[],
): Promise<boolean> {
  /**
   * 발급받은 presigned url 로 데이터를 업로드합니다.
   */

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fuelLogs),
  });
  if (!response.ok) {
    console.warn(
      `uploadFuelLogs failed. body: ${await response.text()} status: ${response.status}`,
    );
    return false;
  }

  return true;
}

export async function saveRemoteFuelLogs(
  userId: string,
  fuelLogs: FuelLog[],
): Promise<boolean> {
  /**
   * 클라우드에 데이터를 저장합니다.
   * presigned url 발급부터 업로드까지 처리하며, 실패하면 false 를 반환합니다.
   */
  let uploadUrl: string;
  try {
    ({ upload_url: uploadUrl } = await getFuelLogsUploadUrl(userId));
  } catch (error) {
    console.warn(`saveRemoteFuelLogs failed. upload-url 발급 실패:`, error);
    return false;
  }

  return uploadFuelLogs(uploadUrl, fuelLogs);
}

export async function fetchRemoteFuelLogs(userId: string): Promise<FuelLog[]> {
  /**
   * 클라우드로부터 데이터를 읽음.
   * 데이터가 존재하지 않으면 빈 배열 반환.
   * 버킷에 ListBucket 권한이 없어 없는 키는 404 가 아닌 403 으로 내려온다.
   * CDN URL = https://<CloudFrontDomain>/<BucketName>/<key>
    예: https://d1ec5umvf9gnq4.cloudfront.net/fuel-log-receipt-sam-receipts/data/test-user-001.json
   */
  const url = `https://d1ec5umvf9gnq4.cloudfront.net/fuel-log-receipt-sam-receipts/data/${userId}.json`;
  const response = await fetch(url);
  if (response.status === 404 || response.status === 403) {
    return [];
  }
  return await response.json();
}
