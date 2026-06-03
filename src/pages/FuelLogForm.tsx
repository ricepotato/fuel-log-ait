import { Button, Slider, TextField, Toast, Top } from "@toss/tds-mobile";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DatepickerButton } from "../components/DatepickerButton";
import { useToast } from "../hooks/useToast";
import { addFuelLog, updateFuelLog } from "../repository";
import type { FuelLog } from "../types/fuelLog";

interface Props {
  initialData?: FuelLog;
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

export function FuelLogForm({ initialData }: Props) {
  const navigate = useNavigate();
  const { show } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(initialData?.date ?? today);
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [odometer, setOdometer] = useState(
    initialData ? initialData.odometer.toLocaleString() : "",
  );
  const [pricePerLiter, setPricePerLiter] = useState(
    initialData ? initialData.pricePerLiter.toLocaleString() : "",
  );
  const [totalPrice, setTotalPrice] = useState(
    initialData ? initialData.totalPrice.toLocaleString() : "",
  );
  const [fuelLevel, setFuelLevel] = useState(initialData?.fuelLevel ?? 100);

  const p = parseFloat(pricePerLiter.replace(/,/g, ""));
  const t = parseFloat(totalPrice.replace(/,/g, ""));
  const liters =
    p > 0 && t > 0 && !isNaN(p) && !isNaN(t) ? (t / p).toFixed(2) : "";

  const isValid = Boolean(
    date && location && liters && pricePerLiter && totalPrice && odometer,
  );

  const handleSave = async () => {
    const log: FuelLog = {
      id: initialData?.id ?? Date.now().toString(),
      date,
      location,
      liters: parseFloat(liters),
      pricePerLiter: parseFloat(pricePerLiter.replace(/,/g, "")),
      totalPrice: parseFloat(totalPrice.replace(/,/g, "")),
      odometer: parseInt(odometer.replace(/,/g, "")),
      fuelLevel,
    };
    if (initialData) {
      await updateFuelLog(log);
    } else {
      await addFuelLog(log);
    }
    show({
      text: "주유 기록이 저장됐어요",
      leftAddon: (
        <Toast.Lottie src="https://static.toss.im/lotties-common/check-green-spot.json" />
      ),
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
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%" }}
            right={<DatepickerButton value={date} onChange={setDate} />}
            required
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
            required={false}
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
            required={false}
          />

          {/* 리터당 금액 */}
          <TextField.Clearable
            variant="line"
            label="리터당 금액"
            labelOption="sustain"
            placeholder="0"
            suffix="원/L"
            value={pricePerLiter}
            onChange={(e) => setPricePerLiter(toNumberString(e.target.value))}
            required={false}
            onClear={() => setPricePerLiter("")}
          />

          {/* 총 주유 금액 */}
          <TextField.Clearable
            variant="line"
            label="총 주유 금액"
            labelOption="sustain"
            placeholder="0"
            suffix="원"
            value={totalPrice}
            onChange={(e) => setTotalPrice(toNumberString(e.target.value))}
            required
            onClear={() => setTotalPrice("")}
          />
        </div>

        {/* 주유량 */}
        <TextField
          variant="line"
          label="주유량"
          labelOption="sustain"
          placeholder="0.00"
          suffix="L"
          value={liters}
          help="리터당 금액과 총 금액으로 자동 계산해요"
          required={false}
          disabled
        />

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
