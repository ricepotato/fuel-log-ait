const API_URL =
  "https://91p5i7lvpj.execute-api.ap-northeast-2.amazonaws.com/Prod";

export interface ReceiptAnalyzeResult {
  date: string;
  location: string;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
}

function base64ToBlob(base64: string, contentType: string = "image/jpeg"): Blob {
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
