import React, { useState, useEffect } from "react";
import { Button, Slider, TextField, BottomSheet } from "@toss/tds-mobile";
import type { FuelLog } from "../types/fuelLog";

interface Props {
  onBack: () => void;
}

const FUEL_LEVEL_PRESETS = [
  { label: "E", value: 0 },
  { label: "1/4", value: 25 },
  { label: "1/2", value: 50 },
  { label: "3/4", value: 75 },
  { label: "F", value: 100 },
];

function toNumberString(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString() : "";
}

export function FuelLogCreate({ onBack }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);

  const [location, setLocation] = useState("");
  const [odometer, setOdometer] = useState("");
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [fuelLevel, setFuelLevel] = useState(100);
  const [isTotalManual, setIsTotalManual] = useState(false);

  // liters × pricePerLiter 자동 계산
  useEffect(() => {
    if (isTotalManual) return;
    const l = parseFloat(liters);
    const p = parseFloat(pricePerLiter.replace(/,/g, ""));
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setTotalPrice(Math.round(l * p).toLocaleString());
    } else {
      setTotalPrice("");
    }
  }, [liters, pricePerLiter, isTotalManual]);

  const isValid = Boolean(
    date && location && liters && pricePerLiter && totalPrice && odometer,
  );

  const handleSave = () => {
    const newLog: FuelLog = {
      id: Date.now().toString(),
      date,
      location,
      liters: parseFloat(liters),
      pricePerLiter: parseFloat(pricePerLiter.replace(/,/g, "")),
      totalPrice: parseFloat(totalPrice.replace(/,/g, "")),
      odometer: parseInt(odometer.replace(/,/g, "")),
      fuelLevel,
    };
    console.log("새 주유 기록 저장:", newLog);
    onBack();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "white",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 56,
          padding: "0 8px",
          borderBottom: "1px solid #E5E8EB",
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          aria-label="뒤로가기"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 12px",
            fontSize: 24,
            color: "#191F28",
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 17,
            fontWeight: 600,
            color: "#191F28",
            marginRight: 44,
          }}
        >
          주유 기록 추가
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "8px 24px 0",
        }}
      >
        {/* 폼 */}
        <div>
          {/* 날짜 */}
          <TextField
            variant="line"
            label="날짜"
            labelOption="sustain"
            placeholder="YYYY-MM-DD"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%" }}
            right={<DatepickerButton value={date} onChange={setDate} />}
          />

          {/* 주유소 */}
          <TextField.Clearable
            variant="line"
            label="주유소"
            labelOption="sustain"
            placeholder="주유소 이름 입력"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onClear={() => setLocation("")}
          />

          {/* 누적 주행거리 */}
          <TextField
            variant="line"
            label="누적 주행거리"
            labelOption="sustain"
            placeholder="0"
            suffix="km"
            value={odometer}
            onChange={(e) => setOdometer(toNumberString(e.target.value))}
          />

          {/* 주유량 */}
          <TextField
            variant="line"
            label="주유량"
            labelOption="sustain"
            placeholder="0.00"
            suffix="L"
            value={liters}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, "");
              setLiters(raw);
            }}
          />

          {/* 리터당 금액 */}
          <TextField
            variant="line"
            label="리터당 금액"
            labelOption="sustain"
            placeholder="0"
            suffix="원/L"
            value={pricePerLiter}
            onChange={(e) => setPricePerLiter(toNumberString(e.target.value))}
          />

          {/* 총 금액 (자동 계산) */}
          <TextField
            variant="line"
            label="총 주유 금액"
            labelOption="sustain"
            placeholder="주유량 × 리터당 금액으로 자동 계산"
            suffix="원"
            value={totalPrice}
            help={
              isTotalManual
                ? "직접 입력 중이에요. 비우면 자동 계산으로 돌아가요."
                : undefined
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              if (!raw) {
                setIsTotalManual(false);
                setTotalPrice("");
              } else {
                setIsTotalManual(true);
                setTotalPrice(Number(raw).toLocaleString());
              }
            }}
          />
        </div>

        {/* 연료 잔량 */}
        <div style={{ padding: "0 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 15, color: "#4E5968" }}>
              주유 후 연료 잔량
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#3182F6" }}>
              {fuelLevel === 0
                ? "Empty"
                : fuelLevel === 100
                  ? "Full (가득)"
                  : `${fuelLevel}%`}
            </span>
          </div>

          {/* 프리셋 버튼 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {FUEL_LEVEL_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setFuelLevel(preset.value)}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 8,
                  border: `1.5px solid ${fuelLevel === preset.value ? "#3182F6" : "#E5E8EB"}`,
                  backgroundColor:
                    fuelLevel === preset.value ? "#EBF3FF" : "white",
                  color: fuelLevel === preset.value ? "#3182F6" : "#4E5968",
                  fontSize: 13,
                  fontWeight: fuelLevel === preset.value ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 슬라이더 */}
          <Slider
            value={fuelLevel}
            minValue={0}
            maxValue={100}
            onValueChange={(v) => setFuelLevel(Math.round(v))}
            label={{ min: "E", max: "F" }}
          />
        </div>
        <div style={{ padding: "0 24px 48px 24px" }}>
          <Button
            disabled={!isValid}
            onClick={handleSave}
            color="primary"
            variant="fill"
            type="submit"
            style={{ width: "100%" }}
          >
            저장하기
          </Button>
        </div>
      </div>
    </main>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS_KO = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

interface DatepickerButtonProps {
  value: string;
  onChange: (date: string) => void;
}

function DatepickerButton({ value, onChange }: DatepickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getMonth();
  });

  // 시트를 열 때마다 선택된 날짜의 월로 초기화
  useEffect(() => {
    if (isOpen) {
      const d = value ? new Date(value) : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [isOpen, value]);

  const todayStr = new Date().toISOString().split("T")[0];

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // 달력 셀 배열 (앞쪽 빈 칸 포함)
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 12px" }}>
      <button
        aria-label="달력 열기"
        onClick={() => setIsOpen(true)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 20,
          lineHeight: 1,
          padding: 4,
        }}
      >
        📅
      </button>

      <BottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        header={<BottomSheet.Header>날짜 선택</BottomSheet.Header>}
      >
        <div style={{ padding: "4px 20px 40px" }}>
          {/* 월 이동 헤더 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <button
              aria-label="이전 달"
              onClick={handlePrevMonth}
              style={navBtnStyle}
            >
              ‹
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#191F28" }}>
              {viewYear}년 {MONTHS_KO[viewMonth]}
            </span>
            <button
              aria-label="다음 달"
              onClick={handleNextMonth}
              style={navBtnStyle}
            >
              ›
            </button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: i === 0 ? "#F04452" : i === 6 ? "#3182F6" : "#8B95A1",
                  paddingBottom: 4,
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;

              const mm = String(viewMonth + 1).padStart(2, "0");
              const dd = String(day).padStart(2, "0");
              const cellStr = `${viewYear}-${mm}-${dd}`;
              const isSelected = cellStr === value;
              const isToday = cellStr === todayStr;
              const col = i % 7; // 0=일, 6=토

              return (
                <button
                  key={i}
                  onClick={() => handleSelectDay(day)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    border: isToday && !isSelected ? "1.5px solid #3182F6" : "none",
                    backgroundColor: isSelected ? "#3182F6" : "transparent",
                    color: isSelected
                      ? "white"
                      : col === 0
                        ? "#F04452"
                        : col === 6
                          ? "#3182F6"
                          : "#191F28",
                    fontSize: 14,
                    fontWeight: isSelected || isToday ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 24,
  color: "#4E5968",
  padding: "4px 12px",
  lineHeight: 1,
};
