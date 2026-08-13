import { Button, Top } from "@toss/tds-mobile";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getFuelLogs } from "../repository";
import type { FuelLog } from "../types/fuelLog";

/** 비교에 사용할 지난 주유 기록 개수 */
const HISTORY_COUNT = 5;

const BLUE = "#3182F6";
const RED = "#F04452";

/** 리터당 금액. 직접 입력값이 없으면 총 금액/주유량으로 유추해요 */
function pricePerLiterOf(log: FuelLog): number | undefined {
  if (log.pricePerLiter != null && log.pricePerLiter > 0) {
    return log.pricePerLiter;
  }
  if (log.liters != null && log.liters > 0 && log.totalPrice > 0) {
    return log.totalPrice / log.liters;
  }
  return undefined;
}

/** 날짜 오름차순, 같은 날짜면 입력 순서(id)대로 */
function byOldestFirst(a: FuelLog, b: FuelLog): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return Number(a.id) - Number(b.id);
}

function formatMonthDay(date: string): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface ChartPoint {
  id: string;
  date: string;
  pricePerLiter: number;
}

function PricePerLiterLineChart({
  points,
  selectedIndex,
  onSelect,
}: {
  points: ChartPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const W = 340;
  const H = 200;
  const padL = 46;
  const padR = 14;
  const padT = 30;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const values = points.map((p) => p.pricePerLiter);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // 값이 모두 같으면 직선이 화면 위아래에 붙지 않도록 여백을 만들어요
  const pad =
    rawMax - rawMin > 0
      ? (rawMax - rawMin) * 0.28
      : Math.max(rawMax * 0.02, 20);
  const lo = rawMin - pad;
  const hi = rawMax + pad;

  const x = (i: number) =>
    points.length === 1
      ? padL + plotW / 2
      : padL + (i / (points.length - 1)) * plotW;
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(p.pricePerLiter)}`)
    .join(" ");

  const gridValues = [hi, (hi + lo) / 2, lo];
  const selected = points[selectedIndex];
  const labelX = Math.min(Math.max(x(selectedIndex), padL + 20), W - padR - 20);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="최근 리터당 금액 추이"
    >
      {/* 기준선 */}
      {gridValues.map((v, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(v)}
            y2={y(v)}
            stroke="#F2F4F6"
            strokeWidth={1}
          />
          <text
            x={padL - 8}
            y={y(v) + 3.5}
            textAnchor="end"
            fontSize={10}
            fill="#B0B8C1"
          >
            {Math.round(v).toLocaleString()}
          </text>
        </g>
      ))}

      {/* 추이선 */}
      <path
        d={linePath}
        fill="none"
        stroke={BLUE}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => {
        const isSelected = i === selectedIndex;
        return (
          <g key={p.id}>
            <circle
              cx={x(i)}
              cy={y(p.pricePerLiter)}
              r={isSelected ? 5 : 3.5}
              fill={isSelected ? BLUE : "#FFFFFF"}
              stroke={isSelected ? "#FFFFFF" : BLUE}
              strokeWidth={isSelected ? 2.5 : 2}
            />
            <text
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill={isSelected ? "#4E5968" : "#B0B8C1"}
              fontWeight={isSelected ? 600 : 400}
            >
              {formatMonthDay(p.date)}
            </text>
            {/* 터치 영역 */}
            <rect
              x={x(i) - plotW / Math.max(points.length - 1, 1) / 2}
              y={0}
              width={plotW / Math.max(points.length - 1, 1)}
              height={H}
              fill="transparent"
              onClick={() => onSelect(i)}
              style={{ cursor: "pointer" }}
            />
          </g>
        );
      })}

      {/* 선택한 지점만 값을 표기해요 */}
      <text
        x={labelX}
        y={y(selected.pricePerLiter) - 12}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="#191F28"
      >
        {Math.round(selected.pricePerLiter).toLocaleString()}원/L
      </text>
    </svg>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#191F28" }}>
        {value}
      </div>
    </div>
  );
}

export function FuelLogInsight() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<FuelLog[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    getFuelLogs().then(setLogs);
  }, []);

  const insight = useMemo(() => {
    if (logs == null) return null;
    const current = logs.find((log) => log.id === id);
    if (current == null) return null;

    const currentPrice = pricePerLiterOf(current);

    // 리터당 금액을 알 수 있는 기록만 비교 대상이에요
    const history = logs
      .filter((log) => log.id !== current.id && pricePerLiterOf(log) != null)
      .sort(byOldestFirst)
      .filter((log) => byOldestFirst(log, current) < 0)
      .slice(-HISTORY_COUNT);

    const previous =
      history.length > 0 ? history[history.length - 1] : undefined;

    const points: ChartPoint[] =
      currentPrice == null
        ? []
        : [...history, current].map((log) => ({
            id: log.id,
            date: log.date,
            pricePerLiter: pricePerLiterOf(log)!,
          }));

    return { current, currentPrice, previous, points };
  }, [logs, id]);

  if (logs == null) return null;
  if (insight == null) return <Navigate to="/" replace />;

  const { current, currentPrice, previous, points } = insight;
  const previousPrice = previous ? pricePerLiterOf(previous)! : undefined;

  // 리터당 차액과, 이번 주유량 기준 실제 차액
  const diff =
    currentPrice != null && previousPrice != null
      ? Math.round(currentPrice - previousPrice)
      : undefined;
  const totalDiff =
    diff != null && current.liters != null
      ? Math.round(diff * current.liters)
      : undefined;

  const isCheaper = diff != null && diff < 0;
  const isSame = diff === 0;
  const accent = diff == null || isSame ? "#4E5968" : isCheaper ? BLUE : RED;

  const headline =
    diff == null
      ? currentPrice == null
        ? "리터당 금액을 입력하면 비교해드려요"
        : "첫 비교 기록이에요"
      : isSame
        ? "지난번과 리터당 금액이 같아요"
        : `지난번보다 리터당 ${Math.abs(diff).toLocaleString()}원 더 ${isCheaper ? "싸게" : "비싸게"} 주유했어요`;

  const subline =
    diff == null
      ? currentPrice == null
        ? "리터당 금액이 있어야 가격 추이를 비교할 수 있어요"
        : "다음 주유부터 지난 기록과 비교해드릴게요"
      : isSame || totalDiff == null || totalDiff === 0
        ? previous
          ? `직전 주유일 ${formatMonthDay(previous.date)} · ${Math.round(previousPrice!).toLocaleString()}원/L 기준이에요`
          : ""
        : `이번 ${current.liters!.toFixed(2)}L 기준 약 ${Math.abs(totalDiff).toLocaleString()}원 ${isCheaper ? "아꼈어요" : "더 썼어요"}`;

  const chartSelectedIndex = selectedIndex ?? points.length - 1;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        padding: "24px 0 0",
      }}
    >
      <Top
        upperGap={0}
        lowerGap={0}
        title={
          <Top.TitleParagraph size={28}>
            주유 기록을 저장했어요
          </Top.TitleParagraph>
        }
      />

      {/* 비교 결과 */}
      <div style={{ padding: "24px 24px 0" }}>
        <div
          style={{
            backgroundColor: isCheaper
              ? "#EFF6FF"
              : diff != null && !isSame
                ? "#FEF1F2"
                : "#F9FAFB",
            borderRadius: 16,
            padding: "20px",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: accent,
              lineHeight: 1.4,
            }}
          >
            {headline}
          </div>
          {subline && (
            <div style={{ fontSize: 13, color: "#8B95A1", marginTop: 6 }}>
              {subline}
            </div>
          )}
        </div>
      </div>

      {/* 이번 주유 요약 */}
      <div style={{ padding: "20px 24px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 20px",
            borderRadius: 16,
            border: "1px solid #F2F4F6",
          }}
        >
          <SummaryItem
            label="리터당 금액"
            value={
              currentPrice != null
                ? `${Math.round(currentPrice).toLocaleString()}원`
                : "-"
            }
          />
          <SummaryItem
            label="총 금액"
            value={`${current.totalPrice.toLocaleString()}원`}
          />
          <SummaryItem
            label="주유량"
            value={
              current.liters != null ? `${current.liters.toFixed(2)}L` : "-"
            }
          />
        </div>
      </div>

      {/* 리터당 금액 추이 */}
      <div style={{ padding: "32px 24px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#191F28" }}>
          리터당 금액 추이
        </div>
        <div style={{ fontSize: 13, color: "#8B95A1", marginTop: 4 }}>
          {points.length >= 2
            ? `이번 기록 포함 최근 ${points.length}회`
            : "비교할 지난 기록이 아직 없어요"}
        </div>

        {points.length >= 2 ? (
          <div style={{ marginTop: 16 }}>
            <PricePerLiterLineChart
              points={points}
              selectedIndex={chartSelectedIndex}
              onSelect={setSelectedIndex}
            />
          </div>
        ) : (
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              padding: "40px 0",
              color: "#8B95A1",
              fontSize: 14,
            }}
          >
            주유 기록이 2회 이상 쌓이면 그래프를 보여드릴게요
          </div>
        )}
      </div>

      {/* 지난 기록 목록 */}
      {points.length >= 2 && (
        <div style={{ padding: "28px 24px 0" }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#191F28",
              marginBottom: 4,
            }}
          >
            기록별 상세
          </div>
          {[...points].reverse().map((point) => {
            const isCurrent = point.id === current.id;
            return (
              <div
                key={point.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid #F2F4F6",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    color: isCurrent ? "#191F28" : "#4E5968",
                    fontWeight: isCurrent ? 700 : 400,
                  }}
                >
                  {point.date}
                  {isCurrent && (
                    <span style={{ fontSize: 12, color: BLUE, marginLeft: 6 }}>
                      이번 주유
                    </span>
                  )}
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 600, color: "#191F28" }}
                >
                  {Math.round(point.pricePerLiter).toLocaleString()}원/L
                </span>
              </div>
            );
          })}
        </div>
      )}

      <section style={{ padding: "32px 24px 48px" }}>
        <Button
          color="primary"
          variant="fill"
          style={{ width: "100%" }}
          onClick={() => navigate("/", { replace: true })}
        >
          확인
        </Button>
      </section>
    </main>
  );
}
