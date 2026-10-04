import {
  Button,
  ConfirmDialog,
  SegmentedControl,
  TextArea,
  TextField,
  Top,
} from "@toss/tds-mobile";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { carIdOfLog, useCars } from "../context/CarContext";
import { useFuelLogs } from "../context/FuelLogContext";
import { useToast } from "../hooks/useToast";
import { FUEL_TYPE_LABELS, type Car, type FuelType } from "../types/car";
import type { FuelLog } from "../types/fuelLog";

const FUEL_TYPES: FuelType[] = ["gasoline", "diesel", "electric"];

export function CarFormPage({ initialData }: { initialData?: Car }) {
  const navigate = useNavigate();
  const { show } = useToast();
  const { cars, addCar, updateCar, deleteCar } = useCars();
  const { logs } = useFuelLogs();

  const [name, setName] = useState(initialData?.name ?? "붕붕이");
  const [fuelType, setFuelType] = useState<FuelType>(
    initialData?.fuelType ?? "gasoline",
  );
  const [model, setModel] = useState(initialData?.model ?? "");
  const [memo, setMemo] = useState(initialData?.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isValid = name.trim().length > 0;

  async function handleSave() {
    setSaving(true);
    const input = {
      name: name.trim(),
      fuelType,
      model: model.trim() || undefined,
      memo: memo.trim() || undefined,
    };
    if (initialData) {
      await updateCar({ ...initialData, ...input });
      show({ text: "차 정보를 저장했어요", duration: 2000 });
    } else {
      await addCar(input);
      show({
        text: `${input.name}을(를) 등록했어요. 이제 이 차에 기록돼요`,
        duration: 2000,
      });
    }
    setSaving(false);
    navigate(-1);
  }

  async function handleDelete() {
    if (!initialData) return;
    setShowDeleteConfirm(false);
    await deleteCar(initialData.id);
    show({ text: `${initialData.name}을(를) 삭제했어요`, duration: 2000 });
    navigate(-1);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <Top
        upperGap={0}
        lowerGap={0}
        title={
          <Top.TitleParagraph size={28}>
            {initialData ? "차 정보 수정" : "차 등록하기"}
          </Top.TitleParagraph>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <TextField
          variant="line"
          label="차 이름"
          labelOption="sustain"
          placeholder="차 이름을 입력해주세요 (필수)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div
          style={{
            padding: "0 24px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 13, color: "#4E5968" }}>연료</div>
          <SegmentedControl
            value={fuelType}
            onChange={(value) => setFuelType(value as FuelType)}
          >
            {FUEL_TYPES.map((type) => (
              <SegmentedControl.Item key={type} value={type}>
                {FUEL_TYPE_LABELS[type]}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl>
        </div>

        <TextField
          variant="line"
          label="차종"
          labelOption="sustain"
          placeholder="예: 쏘나타"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />

        <TextArea
          variant="line"
          label="메모"
          labelOption="sustain"
          placeholder="차량 번호, 보험 만기일 등 자유롭게 적어주세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          minHeight={96}
        />
      </div>

      <div
        style={{
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Button
          color="primary"
          variant="fill"
          style={{ width: "100%" }}
          disabled={!isValid}
          loading={saving}
          onClick={handleSave}
        >
          저장하기
        </Button>
        {initialData ? (
          <Button
            color="danger"
            variant="weak"
            style={{ width: "100%" }}
            onClick={() => setShowDeleteConfirm(true)}
          >
            차 삭제하기
          </Button>
        ) : null}
      </div>
      {initialData ? (
        <DeleteCarConfirmDialog
          open={showDeleteConfirm}
          description={deleteDescription(initialData, cars, logs)}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </main>
  );
}

/** 삭제할 차의 기록이 어디로 가는지 알려주는 문구를 만들어요. */
function deleteDescription(car: Car, cars: Car[], logs: FuelLog[]): string {
  const count = logs.filter(
    (log) => carIdOfLog(log, cars[0]?.id) === car.id,
  ).length;
  if (count === 0) return `${car.name}을(를) 삭제할까요?`;

  // 남은 차 중 가장 먼저 만든 차가 새 기본 차가 돼요.
  const nextDefault = cars.find((item) => item.id !== car.id);
  return nextDefault
    ? `${car.name}의 주유 기록 ${count}개는 ${nextDefault.name}(으)로 옮겨져요.`
    : `주유 기록 ${count}개는 지워지지 않고 차 없이 남아요.`;
}

function DeleteCarConfirmDialog({
  open,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title={<ConfirmDialog.Title>차 삭제하기</ConfirmDialog.Title>}
      description={
        <ConfirmDialog.Description>{description}</ConfirmDialog.Description>
      }
      cancelButton={
        <ConfirmDialog.CancelButton onClick={onCancel}>
          아니오
        </ConfirmDialog.CancelButton>
      }
      confirmButton={
        <ConfirmDialog.ConfirmButton color="danger" onClick={onConfirm}>
          삭제
        </ConfirmDialog.ConfirmButton>
      }
      onClose={onCancel}
    />
  );
}
