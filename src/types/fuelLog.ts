export interface FuelLog {
  id: string;
  date: string; // ISO 8601 형식 (예: "2026-06-03")
  location?: string; // 주유 장소명
  liters?: number; // 주유량 (리터)
  pricePerLiter?: number; // 리터당 금액 (원)
  totalPrice: number; // 총 주유 금액 (원)
  odometer?: number; // 누적 주행거리 (km)
  fuelLevel?: number; // 주유한 양 (0~100, 100=가득, 50=절반)
}
