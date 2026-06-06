import { Button, Slider, TextField, Top } from "@toss/tds-mobile";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DatepickerButton } from "../components/DatepickerButton";
import { useToast } from "../hooks/useToast";
import {
  addFuelLog,
  getFuelLogs,
  removeFuelLog,
  updateFuelLog,
} from "../repository";
import type { FuelLog } from "../types/fuelLog";

interface Props {
  initialData?: FuelLog;
}

const FUEL_LEVEL_PRESETS = [
  { label: "입력안함", value: 0 },
  { label: "1/4", value: 25 },
  { label: "1/2", value: 50 },
  { label: "3/4", value: 75 },
  { label: "가득", value: 100 },
];

function toNumberString(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString() : "";
}

export function FuelLogForm({ initialData }: Props) {
  const navigate = useNavigate();
  const { show } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(initialData?.date ?? today);
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [odometer, setOdometer] = useState(
    initialData?.odometer?.toLocaleString() ?? "",
  );
  const [pricePerLiter, setPricePerLiter] = useState(
    initialData?.pricePerLiter?.toLocaleString() ?? "",
  );
  const [totalPrice, setTotalPrice] = useState(
    initialData ? initialData.totalPrice.toLocaleString() : "",
  );
  const [fuelLevel, setFuelLevel] = useState(initialData?.fuelLevel ?? 0);

  const [frequentTotalPrices, setFrequentTotalPrices] = useState<number[]>([]);
  const [showTotalPricePopover, setShowTotalPricePopover] = useState(false);
  const totalPriceFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFuelLogs().then((logs) => {
      const freq = new Map<number, number>();
      for (const log of logs) {
        if (log.totalPrice > 0) {
          freq.set(log.totalPrice, (freq.get(log.totalPrice) ?? 0) + 1);
        }
      }
      const top = [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([price]) => price);
      setFrequentTotalPrices(top);
    });
  }, []);

  useEffect(() => {
    if (!showTotalPricePopover) return;
    const handle = (e: MouseEvent) => {
      if (!totalPriceFieldRef.current?.contains(e.target as Node)) {
        setShowTotalPricePopover(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showTotalPricePopover]);

  const p = parseFloat(pricePerLiter.replace(/,/g, ""));
  const t = parseFloat(totalPrice.replace(/,/g, ""));
  const liters =
    p > 0 && t > 0 && !isNaN(p) && !isNaN(t) ? (t / p).toFixed(2) : "";

  const isValid = Boolean(date && totalPrice);

  const handleDelete = async () => {
    if (!initialData) return;
    if (window.confirm("정말 이 주유 기록을 삭제할까요?")) {
      await removeFuelLog(initialData.id);
      show({
        text: "주유 기록이 삭제됐어요",
        duration: 2000,
      });
      navigate(-1);
    }
  };

  const handleSave = async () => {
    const log: FuelLog = {
      id: initialData?.id ?? Date.now().toString(),
      date,
      totalPrice: parseFloat(totalPrice.replace(/,/g, "")),
      location: location.trim() || undefined,
      odometer: odometer ? parseFloat(odometer.replace(/,/g, "")) : undefined,
      pricePerLiter: pricePerLiter
        ? parseFloat(pricePerLiter.replace(/,/g, ""))
        : undefined,
      fuelLevel,
    };
    if (initialData) {
      console.log(`update: ${JSON.stringify(log)}`);
      await updateFuelLog(log);
    } else {
      console.log(`add: ${JSON.stringify(log)}`);
      await addFuelLog(log);
    }
    show({
      text: "주유 기록이 저장됐어요",
      duration: 2000,
    });
    navigate(-1);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "white",
        padding: "24px 0px",
      }}
    >
      {/* 헤더 */}
      <Top
        upperGap={0}
        lowerGap={0}
        title={
          <Top.TitleParagraph size={28}>
            {initialData ? "주유 기록 수정" : "주유 기록 추가"}
          </Top.TitleParagraph>
        }
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "0px 0px",
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
            style={{ width: "100%" }}
            right={<DatepickerButton value={date} onChange={setDate} />}
            required
          />

          {/* 주유소 */}
          <TextField.Clearable
            variant="line"
            label="주유소"
            labelOption="sustain"
            placeholder="주유소 이름 입력 (선택)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onClear={() => setLocation("")}
            required={false}
          />

          {/* 누적 주행거리 */}
          <TextField
            variant="line"
            label="누적 주행거리"
            labelOption="sustain"
            placeholder="0 (선택)"
            suffix="km"
            value={odometer}
            onChange={(e) => setOdometer(toNumberString(e.target.value))}
            required={false}
          />

          {/* 리터당 금액 */}
          <TextField.Clearable
            variant="line"
            label="리터당 금액"
            labelOption="sustain"
            placeholder="0 (선택)"
            suffix="원/L"
            value={pricePerLiter}
            onChange={(e) => setPricePerLiter(toNumberString(e.target.value))}
            required={false}
            onClear={() => setPricePerLiter("")}
          />

          {/* 총 주유 금액 */}
          <div ref={totalPriceFieldRef} style={{ position: "relative" }}>
            <TextField.Clearable
              variant="line"
              label="총 주유 금액"
              labelOption="sustain"
              placeholder="0 (필수)"
              suffix="원"
              value={totalPrice}
              onChange={(e) => {
                setTotalPrice(toNumberString(e.target.value));
                setShowTotalPricePopover(false);
              }}
              required
              onClear={() => {
                setTotalPrice("");
                setShowTotalPricePopover(false);
              }}
              onFocus={() => {
                if (frequentTotalPrices.length > 0)
                  setShowTotalPricePopover(true);
              }}
            />
            {showTotalPricePopover && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
                  zIndex: 200,
                  overflow: "hidden",
                }}
              >
                {frequentTotalPrices.map((price, i) => (
                  <button
                    key={price}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTotalPrice(price.toLocaleString());
                      setShowTotalPricePopover(false);
                    }}
                    style={{
                      display: "flex",
                      width: "100%",
                      padding: "14px 20px",
                      background: "none",
                      border: "none",
                      borderTop: i === 0 ? "none" : "1px solid #F2F4F6",
                      textAlign: "left",
                      fontSize: 15,
                      color: "#191F28",
                      cursor: "pointer",
                    }}
                  >
                    {price.toLocaleString()}원
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 주유량 */}
        <div style={{ padding: "0 24px" }}>
          <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 4 }}>
            주유량
          </div>
          <div
            style={{
              fontSize: 20,
              color: liters ? "#3182F6" : "#B0B8C1",
              fontWeight: 600,
            }}
          >
            {liters ? `${liters} L` : "0.00 L"}
          </div>
          <div style={{ fontSize: 12, color: "#8B95A1", marginTop: 4 }}>
            리터당 금액과 총 금액으로 자동 계산해요
          </div>
        </div>

        {/* 연료 잔량 */}
        <div style={{ marginTop: "20px", padding: "0 24px" }}>
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
                ? "입력안함"
                : fuelLevel === 100
                  ? "가득"
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
        <ActionSection>
          <SaveButton disabled={!isValid} onSave={handleSave} />
          {initialData && <DeleteButton onDelete={handleDelete} />}
        </ActionSection>
      </div>
    </main>
  );
}

function ActionSection({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        padding: "0 24px 48px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {children}
    </section>
  );
}

function SaveButton({
  disabled,
  onSave,
}: {
  disabled: boolean;
  onSave: () => void;
}) {
  return (
    <Button
      color="primary"
      variant="fill"
      style={{ width: "100%" }}
      onClick={onSave}
      disabled={disabled}
    >
      저장하기
    </Button>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <Button
      color="danger"
      variant="fill"
      style={{ width: "100%" }}
      onClick={onDelete}
    >
      삭제하기
    </Button>
  );
}
