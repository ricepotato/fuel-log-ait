import { ListRow, Tab } from "@toss/tds-mobile";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CarSwitchBottomSheet from "../components/CarSwitchBottomSheet";
import ReceiptScanBottomSheet from "../components/ReceiptScanBottomSheet";
import { useCars, useSelectedCarLogs } from "../context/CarContext";
import { useFuelLogFilter } from "../context/FuelLogFilterContext";
import type { FuelLog } from "../types/fuelLog";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function FuelLogList() {
  const navigate = useNavigate();
  const {
    selectedYear,
    selectedMonthIndex,
    setSelectedYear,
    setSelectedMonthIndex,
  } = useFuelLogFilter();
  const logs = useSelectedCarLogs();
  const { selectedCar } = useCars();
  const isElectric = selectedCar?.fuelType === "electric";

  const selectedMonth = MONTHS[selectedMonthIndex];

  const filtered = logs
    .filter((log) => {
      const d = new Date(log.date);
      return (
        d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth
      );
    })
    .sort((a, b) => (Number(a.id) > Number(b.id) ? -1 : 1)); // 최신순 정렬

  return (
    // 아래 floating button 공간 확보를 위한 padding-bottom
    <main style={{ paddingBottom: 90 }}>
      {/* Year selector */}
      <YearSelector
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        onToday={() => {
          const today = new Date();
          setSelectedYear(today.getFullYear());
          setSelectedMonthIndex(today.getMonth());
        }}
      />
      {/* Month tabs */}
      <Tab fluid onChange={(index) => setSelectedMonthIndex(index)}>
        {MONTHS.map((m, i) => (
          <Tab.Item key={m} selected={selectedMonthIndex === i}>
            {m}월
          </Tab.Item>
        ))}
      </Tab>

      {/* Monthly summary */}
      <MonthlySummary
        selectedMonth={selectedMonth}
        logs={filtered}
        isElectric={isElectric}
      />

      {/* Fuel log list */}
      {filtered.map((log, index) => {
        const day = new Date(log.date).getDate();
        const bottomParts = [
          log.location,
          log.odometer != null ? `${log.odometer.toLocaleString()}km` : null,
        ].filter(Boolean);
        const contentsBottom =
          bottomParts.length > 0 ? bottomParts.join(" · ") : undefined;
        // 전기차는 충전량(kWh)과 kWh당 단가, 그 외에는 주유량(L)과 리터당 금액을 보여줘요.
        const rightTop = isElectric
          ? log.kWh != null
            ? `${log.kWh}kWh`
            : "-"
          : log.liters != null
            ? `${log.liters}L`
            : "-";
        const unitPrice = isElectric ? log.pricePerkWh : log.pricePerLiter;
        const rightBottom =
          unitPrice != null
            ? `${unitPrice.toLocaleString()}원/${isElectric ? "kWh" : "L"}`
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
                top={`${log.totalPrice.toLocaleString()}원`}
                bottom={contentsBottom ? contentsBottom : ""}
              />
            }
            right={
              <ListRow.Texts
                type="Right2RowTypeA"
                top={rightTop}
                bottom={rightBottom ? rightBottom : ""}
              />
            }
          />
        );
      })}

      <ReceiptScanButton />
      <AddFuelLogButton />
    </main>
  );
}

function MonthlySummary({
  selectedMonth,
  logs,
  isElectric,
}: {
  selectedMonth: number;
  logs: FuelLog[];
  isElectric: boolean;
}) {
  const count = logs.length;
  const totalSpend = logs.reduce((sum, log) => sum + log.totalPrice, 0);
  // 전기차는 충전량(kWh), 그 외에는 주유량(L)을 합산해요.
  const amountOf = (log: FuelLog) => (isElectric ? log.kWh : log.liters);
  const totalAmount = logs.reduce((sum, log) => sum + (amountOf(log) ?? 0), 0);
  const hasAnyAmount = logs.some((log) => amountOf(log) != null);
  const action = isElectric ? "충전" : "주유";
  const unit = isElectric ? "kWh" : "L";

  if (count === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "64px 0",
          color: "#8B95A1",
          fontSize: 15,
        }}
      >
        이 달의 {action} 기록이 없어요!
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "14px 24px",
        backgroundColor: "#F9FAFB",
        borderBottom: "1px solid #E5E8EB",
      }}
    >
      <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 4 }}>
        {selectedMonth}월 · {count}회 {action}
        {hasAnyAmount ? ` · 총 ${totalAmount.toFixed(1)}${unit}` : ""}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#191F28" }}>
        {totalSpend.toLocaleString()}원
      </div>
    </div>
  );
}

function YearSelector({
  selectedYear,
  setSelectedYear,
  onToday,
}: {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onToday: () => void;
}) {
  const { selectedCar } = useCars();
  const [carSheetOpen, setCarSheetOpen] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "24px 0 12px",
      }}
    >
      <button
        aria-label="차 전환"
        onClick={() => setCarSheetOpen(true)}
        style={{
          position: "absolute",
          left: 24,
          maxWidth: 96,
          background: "none",
          border: "1px solid #E5E8EB",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "#4E5968",
          padding: "6px 10px",
          lineHeight: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {selectedCar?.name ?? "내 차"} ▾
      </button>
      <CarSwitchBottomSheet
        open={carSheetOpen}
        onClose={() => setCarSheetOpen(false)}
      />
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
      <button
        onClick={onToday}
        style={{
          position: "absolute",
          right: 24,
          background: "none",
          border: "1px solid #E5E8EB",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "#4E5968",
          padding: "6px 10px",
          lineHeight: 1,
        }}
      >
        이번 달
      </button>
    </div>
  );
}

function ReceiptScanButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleImageSelected(dataUri: string) {
    const commaIndex = dataUri.indexOf(",");
    const header = commaIndex !== -1 ? dataUri.slice(0, commaIndex) : "";
    const base64 = commaIndex !== -1 ? dataUri.slice(commaIndex + 1) : dataUri;
    const contentType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    console.log(`handleImageSelected ContentType: ${contentType}`);
    navigate("/receipt-loading", { state: { base64, contentType } });
  }

  return (
    <>
      <ReceiptScanBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        onImageSelected={handleImageSelected}
      />
      <button
        aria-label="영수증 AI 스캔"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 32,
          right: 92,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#FFFFFF",
          border: "1.5px solid #E5E8EB",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
          zIndex: 100,
        }}
      >
        <img src="/icon-camera.svg" alt="" width={24} height={24} />
      </button>
    </>
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
  );
}
