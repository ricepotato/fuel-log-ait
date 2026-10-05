import { Button, Slider, TextField, Top } from "@toss/tds-mobile";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DatepickerButton } from "../components/DatepickerButton";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import { useToast } from "../hooks/useToast";
import { useFuelLogs } from "../context/FuelLogContext";
import { carIdOfLog, useCars, useSelectedCarLogs } from "../context/CarContext";
import type { FuelLog } from "../types/fuelLog";
import type { ReceiptAnalyzeResult } from "../api/fuellog";

interface Props {
  initialData?: FuelLog;
}

// 전기차는 리터 대신 kWh 로 입력받아요. 나머지 입력 흐름은 같아요.
const FORM_TEXT = {
  fuel: {
    record: "주유 기록",
    totalPrice: "총 주유 금액",
    unitPrice: "리터당 금액",
    unitSuffix: "원/L",
    station: "주유소",
    stationPlaceholder: "주유소 이름 입력 (선택)",
    amount: "주유량",
    amountUnit: "L",
    amountHint: "주유량은 리터당 금액과 총 금액으로 자동 계산해요",
    level: "주유 후 연료 잔량",
  },
  electric: {
    record: "충전 기록",
    totalPrice: "총 충전 금액",
    unitPrice: "kWh당 충전 단가",
    unitSuffix: "원/kWh",
    station: "충전소",
    stationPlaceholder: "충전소 이름 입력 (선택)",
    amount: "충전량",
    amountUnit: "kWh",
    amountHint: "충전량은 kWh당 충전 단가와 총 금액으로 자동 계산해요",
    level: "충전 후 배터리 잔량",
  },
};

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
  const { addLog, updateLog, removeLog } = useFuelLogs();
  const logs = useSelectedCarLogs();
  const { cars, selectedCar } = useCars();
  // 수정할 때는 기록이 속한 차, 새 기록은 선택한 차 기준으로 화면을 보여줘요.
  const formCar = initialData
    ? cars.find((car) => car.id === carIdOfLog(initialData, cars[0]?.id))
    : selectedCar;
  const isElectric = formCar?.fuelType === "electric";
  const text = isElectric ? FORM_TEXT.electric : FORM_TEXT.fuel;
  const { state } = useLocation();
  const receipt: ReceiptAnalyzeResult | undefined = state?.receipt;
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(initialData?.date ?? receipt?.date ?? today);
  const [location, setLocation] = useState(
    initialData?.location ?? receipt?.location ?? "",
  );
  const [odometer, setOdometer] = useState(
    initialData?.odometer?.toLocaleString() ?? "",
  );
  // 리터당 금액 또는 kWh당 충전 단가
  const [unitPrice, setUnitPrice] = useState(
    (isElectric
      ? initialData?.pricePerkWh?.toLocaleString()
      : (initialData?.pricePerLiter?.toLocaleString() ??
        receipt?.pricePerLiter?.toLocaleString())) ?? "",
  );
  const [totalPrice, setTotalPrice] = useState(
    initialData
      ? initialData.totalPrice.toLocaleString()
      : (receipt?.totalPrice?.toLocaleString() ?? ""),
  );
  const [fuelLevel, setFuelLevel] = useState(initialData?.fuelLevel ?? 0);

  const [showTotalPricePopover, setShowTotalPricePopover] = useState(false);
  const totalPriceFieldRef = useRef<HTMLDivElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const frequentTotalPrices = useMemo(() => {
    const freq = new Map<number, number>();
    for (const log of logs) {
      if (log.totalPrice > 0) {
        freq.set(log.totalPrice, (freq.get(log.totalPrice) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([price]) => price);
  }, [logs]);

  const lastOdometer = useMemo(() => {
    const recentWithOdometer = logs
      .filter((log) => log.odometer != null && log.id !== initialData?.id)
      .sort((a, b) => (a.date > b.date ? -1 : 1))[0];
    return recentWithOdometer?.odometer ?? null;
  }, [logs, initialData?.id]);

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

  const p = parseFloat(unitPrice.replace(/,/g, ""));
  const t = parseFloat(totalPrice.replace(/,/g, ""));
  // 주유량(L) 또는 충전량(kWh)
  const amount =
    p > 0 && t > 0 && !isNaN(p) && !isNaN(t) ? (t / p).toFixed(2) : "";

  const isValid = Boolean(date && totalPrice);

  const handleDelete = async () => {
    if (!initialData) return;
    await removeLog(initialData.id);
    show({
      text: `${text.record}이 삭제됐어요`,
      duration: 2000,
    });
    // 삭제된 기록의 편집/인사이트 화면으로 돌아가지 않도록 목록으로 보내요.
    navigate("/", { replace: true });
  };

  const handleSave = async () => {
    const log: FuelLog = {
      id: initialData?.id ?? Date.now().toString(),
      date,
      totalPrice: parseFloat(totalPrice.replace(/,/g, "")),
      location: location.trim() || undefined,
      odometer: odometer ? parseFloat(odometer.replace(/,/g, "")) : undefined,
      fuelLevel,
      ...(isElectric
        ? {
            pricePerkWh: unitPrice ? p : undefined,
            kWh: amount ? parseFloat(amount) : undefined,
          }
        : {
            pricePerLiter: unitPrice ? p : undefined,
            liters: amount ? parseFloat(amount) : undefined,
          }),
      // 수정할 때는 원래 차를 유지하고, 새 기록은 선택한 차에 넣어요.
      carId: initialData ? initialData.carId : selectedCar?.id,
    };
    if (initialData) {
      console.log(`update: ${JSON.stringify(log)}`);
      await updateLog(log);
      show({
        text: `${text.record}이 저장됐어요`,
        duration: 2000,
      });
      navigate(-1);
      return;
    }

    console.log(`add: ${JSON.stringify(log)}`);
    await addLog(log);

    // 새로 추가한 기록은 인사이트 화면에서 지난 기록과 비교해서 보여줘요.
    // 인사이트는 아직 리터당 금액만 비교해서 전기차 기록은 목록으로 보내요.
    if (log.pricePerLiter !== undefined) {
      navigate(`/insight/${log.id}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
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
            {initialData ? `${text.record} 수정` : `${text.record} 추가`}
          </Top.TitleParagraph>
        }
        subtitleBottom={
          // 차를 등록하지 않으면 주유 기록으로 보여서, 전기차 오너에게 차 등록을 안내해요.
          !initialData && cars.length === 0 ? (
            <button
              type="button"
              onClick={() => navigate("/cars")}
              style={{
                padding: 0,
                border: "none",
                background: "none",
                fontSize: 14,
                color: "#8B95A1",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              ⚡ 전기차 오너이신가요?{" "}
              <span style={{ color: "#3182F6", fontWeight: 600 }}>
                내 차 등록하기 ›
              </span>
            </button>
          ) : undefined
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

          {/* 총 금액 */}
          <div ref={totalPriceFieldRef} style={{ position: "relative" }}>
            <TextField.Clearable
              variant="line"
              label={text.totalPrice}
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

          {/* 리터당 금액 / kWh당 충전 단가 */}
          <TextField.Clearable
            variant="line"
            label={text.unitPrice}
            labelOption="sustain"
            placeholder="0 (선택)"
            suffix={text.unitSuffix}
            value={unitPrice}
            onChange={(e) => setUnitPrice(toNumberString(e.target.value))}
            required={false}
            onClear={() => setUnitPrice("")}
          />

          {/* 주유소 / 충전소 */}
          <TextField.Clearable
            variant="line"
            label={text.station}
            labelOption="sustain"
            placeholder={text.stationPlaceholder}
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
            placeholder={
              lastOdometer != null
                ? `${lastOdometer.toLocaleString()} (선택)`
                : "0 (선택)"
            }
            suffix="km"
            value={odometer}
            onChange={(e) => setOdometer(toNumberString(e.target.value))}
            required={false}
          />
        </div>

        {/* 주유량 / 충전량 */}
        <div style={{ padding: "0 24px" }}>
          <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 4 }}>
            {text.amount}
          </div>
          <div
            style={{
              fontSize: 20,
              color: amount ? "#3182F6" : "#B0B8C1",
              fontWeight: 600,
            }}
          >
            {`${amount || "0.00"} ${text.amountUnit}`}
          </div>
          <div style={{ fontSize: 12, color: "#8B95A1", marginTop: 4 }}>
            {text.amountHint}
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
            <span style={{ fontSize: 15, color: "#4E5968" }}>{text.level}</span>
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
          {initialData && (
            <DeleteButton onDelete={() => setShowDeleteConfirm(true)} />
          )}
          <DeleteConfirmDialog
            open={showDeleteConfirm}
            setOpen={setShowDeleteConfirm}
            onConfirm={handleDelete}
          />
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
      variant="weak"
      style={{ width: "100%" }}
      onClick={onDelete}
    >
      기록 삭제하기
    </Button>
  );
}
