import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ListRow, Tab } from "@toss/tds-mobile";
import { useFuelLogFilter } from "../context/FuelLogFilterContext";
import type { FuelLog } from "../types/fuelLog";
import { getFuelLogs } from "../repository";
import ReceiptScanBottomSheet from "../components/ReceiptScanBottomSheet";
import { useToast } from "../hooks/useToast";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function FuelLogList() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { show } = useToast();
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

  useEffect(() => {
    if (state?.receiptError) {
      show({ text: "영수증 분석에 실패했어요", duration: 2000 });
      navigate("/", { replace: true, state: {} });
    }
  }, [state?.receiptError]);

  const selectedMonth = MONTHS[selectedMonthIndex];

  const filtered = logs
    .filter((log) => {
      const d = new Date(log.date);
      return (
        d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth
      );
    })
    .sort((a, b) => (Number(a.id) > Number(b.id) ? -1 : 1)); // 최신순 정렬

  const totalSpend = filtered.reduce((sum, log) => sum + log.totalPrice, 0);
  const totalLiters = filtered.reduce((sum, log) => sum + (log.liters ?? 0), 0);
  const hasAnyLiters = filtered.some((log) => log.liters != null);

  return (
    // 아래 floating button 공간 확보를 위한 padding-bottom
    <main style={{ paddingBottom: 90 }}>
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
                top={`${log.totalPrice.toLocaleString()}원`}
                bottom={contentsBottom ? contentsBottom : ""}
              />
            }
            right={
              <ListRow.Texts
                type="Right2RowTypeA"
                top={`${log.liters != null ? `${log.liters}L` : "-"}`}
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

function ReceiptScanButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleImageSelected(dataUri: string) {
    const commaIndex = dataUri.indexOf(",");
    const header = commaIndex !== -1 ? dataUri.slice(0, commaIndex) : "";
    const base64 = commaIndex !== -1 ? dataUri.slice(commaIndex + 1) : dataUri;
    const contentType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    console.log(contentType);
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
