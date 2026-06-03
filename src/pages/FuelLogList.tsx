import { useState } from "react";
import { ListRow, Tab, Top } from "@toss/tds-mobile";
import type { FuelLog } from "../types/fuelLog";

interface Props {
  onNavigate: (page: string) => void;
}

const sampleFuelLogs: FuelLog[] = [
  {
    id: "1",
    date: "2026-06-01",
    location: "GS칼텍스 강남대로점",
    liters: 45.2,
    pricePerLiter: 1720,
    totalPrice: 77744,
    odometer: 52300,
    fuelLevel: 100,
  },
  {
    id: "2",
    date: "2026-05-18",
    location: "SK에너지 서초IC점",
    liters: 30.5,
    pricePerLiter: 1705,
    totalPrice: 52003,
    odometer: 51870,
    fuelLevel: 70,
  },
  {
    id: "3",
    date: "2026-05-03",
    location: "현대오일뱅크 잠실점",
    liters: 41.8,
    pricePerLiter: 1698,
    totalPrice: 70976,
    odometer: 51320,
    fuelLevel: 95,
  },
  {
    id: "4",
    date: "2026-04-20",
    location: "S-OIL 송파대로점",
    liters: 25.0,
    pricePerLiter: 1712,
    totalPrice: 42800,
    odometer: 50780,
    fuelLevel: 55,
  },
  {
    id: "5",
    date: "2026-04-06",
    location: "GS칼텍스 올림픽대로점",
    liters: 38.3,
    pricePerLiter: 1695,
    totalPrice: 64919,
    odometer: 50210,
    fuelLevel: 90,
  },
  {
    id: "6",
    date: "2026-03-22",
    location: "SK에너지 판교점",
    liters: 20.1,
    pricePerLiter: 1680,
    totalPrice: 33768,
    odometer: 49650,
    fuelLevel: 50,
  },
  {
    id: "7",
    date: "2026-03-09",
    location: "현대오일뱅크 분당점",
    liters: 44.7,
    pricePerLiter: 1675,
    totalPrice: 74873,
    odometer: 49100,
    fuelLevel: 100,
  },
  {
    id: "8",
    date: "2026-02-22",
    location: "S-OIL 동탄점",
    liters: 32.6,
    pricePerLiter: 1660,
    totalPrice: 54116,
    odometer: 48430,
    fuelLevel: 75,
  },
  {
    id: "9",
    date: "2026-02-08",
    location: "GS칼텍스 수원점",
    liters: 15.5,
    pricePerLiter: 1655,
    totalPrice: 25653,
    odometer: 47890,
    fuelLevel: 35,
  },
  {
    id: "10",
    date: "2026-01-25",
    location: "SK에너지 용인점",
    liters: 42.0,
    pricePerLiter: 1648,
    totalPrice: 69216,
    odometer: 47200,
    fuelLevel: 100,
  },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function FuelLogList({ onNavigate }: Props) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(5); // 0-indexed, 5 = 6월
  const selectedMonth = MONTHS[selectedMonthIndex];

  const filtered = sampleFuelLogs
    .filter((log) => {
      const d = new Date(log.date);
      return (
        d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpend = filtered.reduce((sum, log) => sum + log.totalPrice, 0);
  const totalLiters = filtered.reduce((sum, log) => sum + log.liters, 0);

  return (
    <main>
      <Top
        title={<Top.TitleParagraph size={22}>주유 기록</Top.TitleParagraph>}
        lowerGap={8}
      />

      {/* Year selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "0 0 12px",
        }}
      >
        <button
          onClick={() => setSelectedYear((y) => y - 1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 22,
            color: "#4E5968",
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: "#191F28" }}>
          {selectedYear}년
        </span>
        <button
          onClick={() => setSelectedYear((y) => y + 1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 22,
            color: "#4E5968",
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ›
        </button>
      </div>

      {/* Month tabs */}
      <Tab fluid onChange={(index) => setSelectedMonthIndex(index)}>
        {MONTHS.map((m, i) => (
          <Tab.Item key={m} selected={selectedMonthIndex === i}>
            {m}월
          </Tab.Item>
        ))}
      </Tab>

      {/* Monthly summary */}
      {filtered.length > 0 ? (
        <div
          style={{
            padding: "14px 24px",
            backgroundColor: "#F9FAFB",
            borderBottom: "1px solid #E5E8EB",
          }}
        >
          <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 4 }}>
            {selectedMonth}월 · {filtered.length}회 주유 · 총{" "}
            {totalLiters.toFixed(1)}L
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#191F28" }}>
            {totalSpend.toLocaleString()}원
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "64px 0",
            color: "#8B95A1",
            fontSize: 15,
          }}
        >
          이 달의 주유 기록이 없어요
        </div>
      )}

      {/* Fuel log list */}
      {filtered.map((log, index) => {
        const day = new Date(log.date).getDate();
        return (
          <ListRow
            key={log.id}
            border={index === 0 ? "none" : "indented"}
            left={
              <ListRow.AssetText shape="squircle" size="medium">
                {`${day}일`}
              </ListRow.AssetText>
            }
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={`${log.liters}L`}
                bottom={`${log.location} · 연료 ${log.fuelLevel}% · ${log.odometer.toLocaleString()}km`}
              />
            }
            right={
              <ListRow.Texts
                type="Right2RowTypeA"
                top={`${log.totalPrice.toLocaleString()}원`}
                bottom={`${log.pricePerLiter.toLocaleString()}원/L`}
              />
            }
          />
        );
      })}

      {/* Floating Action Button */}
      <button
        aria-label="새 주유 기록 추가"
        onClick={() => onNavigate("fuel-create")}
        style={{
          position: "fixed",
          bottom: 32,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#3182F6",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(49, 130, 246, 0.45)",
          zIndex: 100,
        }}
      >
        <span
          style={{ color: "white", fontSize: 32, lineHeight: 1, marginTop: -2 }}
        >
          +
        </span>
      </button>
    </main>
  );
}
