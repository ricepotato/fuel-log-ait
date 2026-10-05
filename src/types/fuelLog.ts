export interface FuelLog {
  id: string;
  date: string; // ISO 8601 형식 (예: "2026-06-03")
  location?: string; // 주유 장소명
  liters?: number; // 주유량 (리터)
  pricePerLiter?: number; // 리터당 금액 (원)
  kWh?: number; // 충전량 (kWh, 전기차)
  pricePerkWh?: number; // kWh당 충전 단가 (원, 전기차)
  totalPrice: number; // 총 주유 금액 (원)
  odometer?: number; // 누적 주행거리 (km)
  fuelLevel?: number; // 주유한 양 (0~100, 100=가득, 50=절반)
  carId?: string; // 기록이 속한 차(Car.id). 없으면 기본 차(가장 먼저 만든 차)의 기록이에요.
}
