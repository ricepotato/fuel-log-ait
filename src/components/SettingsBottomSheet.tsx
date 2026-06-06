import { saveBase64Data } from "@apps-in-toss/web-framework";
import { BottomSheet, ListRow } from "@toss/tds-mobile";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { getFuelLogs } from "../repository";

const CSV_HEADERS = [
  "ID",
  "날짜",
  "주유소",
  "주유량(L)",
  "리터당금액(원)",
  "총금액(원)",
  "누적주행거리(km)",
  "연료잔량(%)",
];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function handleSaveBase64Data({
  fileName,
  data,
  mimeType,
}: {
  fileName: string;
  data: string;
  mimeType: string;
}) {
  try {
    await saveBase64Data({
      data,
      fileName,
      mimeType,
    });
    return true;
  } catch (error) {
    console.error("데이터 저장에 실패했어요:", error);
    return false;
  }
}

export default function SettingsBottomSheet({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { show } = useToast();
  const navigate = useNavigate();

  async function exportToCsv() {
    const logs = await getFuelLogs();
    const rows = logs
      .sort((a, b) => (a.id > b.id ? -1 : 1))
      .map((log) => [
        log.id,
        log.date,
        log.location ?? "",
        log.liters ?? "",
        log.pricePerLiter ?? "",
        log.totalPrice,
        log.odometer ?? "",
        log.fuelLevel ?? "",
      ]);

    const csv = [CSV_HEADERS, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const dateStr = new Date().toISOString();
    const fileName = `주유기록_${dateStr}.csv`;
    const isSuccess = await handleSaveBase64Data({
      fileName,
      data: await blobToBase64(blob),
      mimeType: "text/csv",
    });

    if (isSuccess) {
      setOpen(false);
      show({
        text: "주유기록 데이터를 내보냈어요",
        duration: 2000,
      });
    } else {
      show({
        text: "데이터 내보내기에 실패했어요",
        duration: 2000,
      });
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => setOpen(false)}
      header={<BottomSheet.Header>데이터 관리</BottomSheet.Header>}
    >
      <div style={{ paddingBottom: 24 }}>
        <ListRow
          contents={<ListRow.Texts type="1RowTypeA" top="데이터 내보내기" />}
          onClick={exportToCsv}
        />
        <ListRow
          contents={<ListRow.Texts type="1RowTypeA" top="통계 보기" />}
          onClick={() => {
            setOpen(false);
            navigate("/statistics");
          }}
        />
      </div>
    </BottomSheet>
  );
}
