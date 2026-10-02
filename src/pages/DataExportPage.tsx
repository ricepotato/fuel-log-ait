import { File } from "@apps-in-toss/web-framework";
import { Button, Top } from "@toss/tds-mobile";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BannerAdComponent } from "../components/AdBanner";
import { useFuelLogs } from "../context/FuelLogContext";
import { useToast } from "../hooks/useToast";

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
    await File.saveBase64({
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

export function DataExportPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { logs } = useFuelLogs();
  // 화면에 보여준 파일 이름 그대로 저장되도록 진입 시점에 한 번만 만들어요
  const [fileName] = useState(() => `주유기록_${new Date().toISOString()}.csv`);
  const [exporting, setExporting] = useState(false);

  async function exportToCsv() {
    const rows = [...logs]
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
    setExporting(true);
    const isSuccess = await handleSaveBase64Data({
      fileName,
      data: await blobToBase64(blob),
      mimeType: "text/csv",
    });
    setExporting(false);

    if (isSuccess) {
      console.log("주유기록 데이터를 내보냈어요");
    } else {
      show({
        text: "데이터 내보내기에 실패했어요",
        duration: 2000,
      });
    }
  }

  return (
    <>
      <div
        style={{
          position: "relative",
          height: "100vh",
        }}
      >
        <main
          style={{
            backgroundColor: "#FFFFFF",
            padding: "24px 0",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Header */}
          <Top
            upperGap={0}
            lowerGap={0}
            title={
              <Top.TitleParagraph size={28}>데이터 내보내기</Top.TitleParagraph>
            }
            subtitleBottom={
              <Top.SubtitleParagraph size={17}>
                아래 정보를 확인하고 내보내기를 눌러주세요
              </Top.SubtitleParagraph>
            }
          />

          {/* Summary */}
          <div style={{ padding: "0 20px" }}>
            <div
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 16,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 13, color: "#8B95A1" }}>
                  내보낼 주유 기록
                </div>
                <div
                  style={{ fontSize: 24, fontWeight: 700, color: "#191F28" }}
                >
                  {logs.length.toLocaleString()}개
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 13, color: "#8B95A1" }}>파일 이름</div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#191F28",
                    wordBreak: "break-all",
                  }}
                >
                  {fileName}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "0 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Button
              color="primary"
              variant="fill"
              style={{ width: "100%" }}
              disabled={logs.length === 0}
              loading={exporting}
              onClick={exportToCsv}
            >
              {logs.length === 0 ? "내보낼 기록이 없어요" : "CSV로 내보내기"}
            </Button>
            <Button
              color="dark"
              variant="weak"
              style={{ width: "100%" }}
              onClick={() => {
                navigate("/");
              }}
            >
              홈 화면으로 돌아가기
            </Button>
          </div>
        </main>
        <footer
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
          }}
        >
          <BannerAdComponent />
        </footer>
      </div>
    </>
  );
}
