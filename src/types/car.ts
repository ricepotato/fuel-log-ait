export type FuelType = "gasoline" | "diesel" | "electric";

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  gasoline: "휘발유",
  diesel: "경유",
  electric: "전기",
};

export interface Car {
  id: string; // uuid
  name: string; // 닉네임 (필수, 기본값 "내 차")
  fuelType: FuelType; // 기본값 "gasoline"
  model?: string; // 차종 (예: "아반떼 CN7")
  memo?: string;
  createdAt: string; // ISO 8601. 가장 먼저 만든 차가 기본 차예요.
}
