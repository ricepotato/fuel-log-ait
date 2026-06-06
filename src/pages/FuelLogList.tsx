import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListRow, Tab } from "@toss/tds-mobile";
import { useFuelLogFilter } from "../context/FuelLogFilterContext";
import type { FuelLog } from "../types/fuelLog";
import { getFuelLogs } from "../repository";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function FuelLogList() {
  const navigate = useNavigate();
  const {
    selectedYear,
    selectedMonthIndex,
    setSelectedYear,
    setSelectedMonthIndex,
  } = useFuelLogFilter();
  const [logs, setLogs] = useState<FuelLog[]>([]);

  useEffect(() => {
    getFuelLogs().then(setLogs);
  }, []);

  const selectedMonth = MONTHS[selectedMonthIndex];

  const filtered = logs
    .filter((log) => {
      const d = new Date(log.date);
      return (
        d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpend = filtered.reduce((sum, log) => sum + log.totalPrice, 0);
  const totalLiters = filtered.reduce((sum, log) => sum + (log.liters ?? 0), 0);
  const hasAnyLiters = filtered.some((log) => log.liters != null);

  return (
    <main>
      {/* Year selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "24px 0 12px",
        }}
      >
        <button
          onClick={() => setSelectedYear(selectedYear - 1)}
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
          onClick={() => setSelectedYear(selectedYear + 1)}
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
            {selectedMonth}월 · {filtered.length}회 주유
            {hasAnyLiters ? ` · 총 ${totalLiters.toFixed(1)}L` : ""}
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
          이 달의 주유 기록이 없어요!
        </div>
      )}

      {/* Fuel log list */}
      {filtered.map((log, index) => {
        const day = new Date(log.date).getDate();
        const contentsTop = log.liters != null ? `${log.liters}L` : "-";
        const bottomParts = [
          log.location,
          log.odometer != null ? `${log.odometer.toLocaleString()}km` : null,
        ].filter(Boolean);
        const contentsBottom =
          bottomParts.length > 0 ? bottomParts.join(" · ") : undefined;
        const rightBottom =
          log.pricePerLiter != null
            ? `${log.pricePerLiter.toLocaleString()}원/L`
            : undefined;
        return (
          <ListRow
            key={log.id}
            onClick={() => navigate(`/edit/${log.id}`)}
            border={index === 0 ? "none" : "indented"}
            left={
              <ListRow.AssetText shape="squircle" size="medium">
                {`${day}일`}
              </ListRow.AssetText>
            }
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={contentsTop}
                bottom={contentsBottom ? contentsBottom : ""}
              />
            }
            right={
              <ListRow.Texts
                type="Right2RowTypeA"
                top={`${log.totalPrice.toLocaleString()}원`}
                bottom={rightBottom ? rightBottom : ""}
              />
            }
          />
        );
      })}

      <AddFuelLogButton />
    </main>
  );
}

function AddFuelLogButton() {
  const navigate = useNavigate();
  return (
    <button
      aria-label="새 주유 기록 추가"
      onClick={() => navigate("/add")}
      style={{
        position: "fixed",
        bottom: 64,
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
  );
}
