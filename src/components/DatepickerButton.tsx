import React, { useState, useEffect } from "react";
import { BottomSheet } from "@toss/tds-mobile";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS_KO = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

const navBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 24,
  color: "#4E5968",
  padding: "4px 12px",
  lineHeight: 1,
};

export interface DatepickerButtonProps {
  value: string;
  onChange: (date: string) => void;
}

export function DatepickerButton({ value, onChange }: DatepickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getMonth();
  });

  useEffect(() => {
    if (isOpen) {
      const d = value ? new Date(value) : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [isOpen, value]);

  const todayStr = new Date().toISOString().split("T")[0];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

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
            <span style={{ fontSize: 20, fontWeight: 700, color: "#191F28" }}>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              marginBottom: 8,
            }}
          >
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                style={{
                  textAlign: "center",
                  fontSize: 18,
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
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 1,
            }}
          >
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;

              const mm = String(viewMonth + 1).padStart(2, "0");
              const dd = String(day).padStart(2, "0");
              const cellStr = `${viewYear}-${mm}-${dd}`;
              const isSelected = cellStr === value;
              const isToday = cellStr === todayStr;
              const col = i % 7;

              return (
                <button
                  key={i}
                  onClick={() => handleSelectDay(day)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    border:
                      isToday && !isSelected ? "1.5px solid #3182F6" : "none",
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
