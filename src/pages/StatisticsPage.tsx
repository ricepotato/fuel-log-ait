import { Top } from "@toss/tds-mobile";
import { useEffect, useState } from "react";
import { getFuelLogs } from "../repository";
import type { FuelLog } from "../types/fuelLog";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function MonthlyBarChart({
  data,
  maxValue,
}: {
  data: number[];
  maxValue: number;
}) {
  const chartHeight = 160;
  const barWidth = 18;
  const gap = 8;
  const totalWidth = (barWidth + gap) * 12 - gap;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalWidth} ${chartHeight + 28}`}
      style={{ overflow: "visible" }}
    >
      {data.map((value, i) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
        const x = i * (barWidth + gap);
        const y = chartHeight - barHeight;
        const isHighest = value === maxValue && value > 0;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={isHighest ? "#3182F6" : "#E5E8EB"}
            />
            <text
              x={x + barWidth / 2}
              y={chartHeight + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#8B95A1"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StatisticsPage() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    getFuelLogs().then(setLogs);
  }, []);

  const yearLogs = logs.filter(
    (log) => new Date(log.date).getFullYear() === selectedYear,
  );

  const totalYearCost = yearLogs.reduce((sum, log) => sum + log.totalPrice, 0);
  const totalYearLiters = yearLogs.reduce(
    (sum, log) => sum + (log.liters ?? 0),
    0,
  );
  const refuelCount = yearLogs.length;

  const monthlyData = MONTHS.map((m) =>
    yearLogs
      .filter((log) => new Date(log.date).getMonth() + 1 === m)
      .reduce((sum, log) => sum + log.totalPrice, 0),
  );

  const maxMonthlyValue = Math.max(...monthlyData, 1);

  const peakMonthIndex = monthlyData.indexOf(Math.max(...monthlyData));
  const peakMonthCost = monthlyData[peakMonthIndex];

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        padding: "24px 0",
      }}
    >
      {/* Header */}
      <Top
        upperGap={0}
        lowerGap={0}
        title={<Top.TitleParagraph size={28}>통계 보기</Top.TitleParagraph>}
      />

      {/* Year selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "24px 0 20px",
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

      {/* Summary cards */}
      <div style={{ padding: "0 20px 24px" }}>
        <div
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 16,
            padding: "20px 20px 4px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 4 }}>
                연간 총 주유비
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#191F28" }}>
                {totalYearCost.toLocaleString()}원
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 4 }}>
                주유 횟수
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#191F28" }}>
                {refuelCount}회
              </div>
            </div>
          </div>

          {totalYearLiters > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 4 }}>
                총 주유량
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#191F28" }}>
                {totalYearLiters.toFixed(1)}L
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly chart */}
      <div style={{ padding: "0 20px 32px" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#191F28",
            marginBottom: 16,
          }}
        >
          월별 주유비
        </div>

        {refuelCount === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#8B95A1",
              fontSize: 15,
            }}
          >
            이 해의 주유 기록이 없어요
          </div>
        ) : (
          <>
            <div style={{ padding: "0 4px" }}>
              <MonthlyBarChart data={monthlyData} maxValue={maxMonthlyValue} />
            </div>

            {peakMonthCost > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 16px",
                  backgroundColor: "#EFF6FF",
                  borderRadius: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: "#3182F6" }}>
                  지출이 가장 많은 달
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#3182F6",
                  }}
                >
                  {peakMonthIndex + 1}월 · {peakMonthCost.toLocaleString()}원
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Monthly breakdown list */}
      {refuelCount > 0 && (
        <div style={{ padding: "0 20px 40px" }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#191F28",
              marginBottom: 12,
            }}
          >
            월별 상세
          </div>
          {MONTHS.filter((m) => monthlyData[m - 1] > 0).map((m) => {
            const cost = monthlyData[m - 1];
            const count = yearLogs.filter(
              (log) => new Date(log.date).getMonth() + 1 === m,
            ).length;
            return (
              <div
                key={m}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid #F2F4F6",
                }}
              >
                <span style={{ fontSize: 15, color: "#4E5968" }}>{m}월</span>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#191F28",
                    }}
                  >
                    {cost.toLocaleString()}원
                  </div>
                  <div style={{ fontSize: 12, color: "#8B95A1" }}>
                    {count}회 주유
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
