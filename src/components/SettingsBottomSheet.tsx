import { getAnonymousKey, saveBase64Data } from "@apps-in-toss/web-framework";
import { BottomSheet, ListRow } from "@toss/tds-mobile";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { useFuelLogs } from "../context/FuelLogContext";
import { getOperationalEnvironment } from "@apps-in-toss/web-framework";
import { ConfirmDialog } from "@toss/tds-mobile";
import { useState } from "react";
import { fetchRemoteFuelLogs } from "../api/fuellog";

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

const env = getOperationalEnvironment();

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
  const { logs, clearLogs, reloadFromServer } = useFuelLogs();
  const [openDataImportDialog, setOpenDataImportDialog] = useState(false);
  const [openDataDeleteDialog, setOpenDataDeleteDialog] = useState(false);
  const navigate = useNavigate();

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
    const dateStr = new Date().toISOString();
    const fileName = `주유기록_${dateStr}.csv`;
    const isSuccess = await handleSaveBase64Data({
      fileName,
      data: await blobToBase64(blob),
      mimeType: "text/csv",
    });

    if (isSuccess) {
      setOpen(false);
      console.log("주유기록 데이터를 내보냈어요");
      // show({
      //   text: "주유기록 데이터를 내보냈어요",
      //   duration: 2000,
      // });
    } else {
      show({
        text: "데이터 내보내기에 실패했어요",
        duration: 2000,
      });
    }
  }

  async function requestRemoteDataImport() {
    /**
     * 서버에 저장된 기록이 있는지 확인한 다음 dialog 를 띄웁니다.
     * 사용자가 확인 버튼을 누르면 서버 기록으로 이 기기의 목록을 맞춥니다.
     */
    const anonymousKey = await getAnonymousKey();
    if (!anonymousKey || anonymousKey === "ERROR") {
      console.warn("can't get getAnonymousKey");
      return;
    }
    const remoteFuelLogs = await fetchRemoteFuelLogs(anonymousKey.hash, env);
    if (remoteFuelLogs.length <= 0) {
      show({ text: "가져올 데이터가 없어요", duration: 2000 });
      return;
    }

    setOpenDataImportDialog(true);
  }

  async function confirmRemoteDataImport() {
    await reloadFromServer();
    setOpenDataImportDialog(false);
    setOpen(false);
    show({ text: "데이터를 가져왔어요", duration: 2000 });
  }

  async function confirmDeleteAllData() {
    await clearLogs();
    setOpenDataDeleteDialog(false);
    setOpen(false);
    show({ text: "로컬 데이터를 모두 삭제했어요", duration: 2000 });
  }

  return (
    <>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        header={<BottomSheet.Header>데이터 관리</BottomSheet.Header>}
      >
        <div style={{ paddingBottom: 24 }}>
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="통계 보기" />}
            onClick={() => {
              setOpen(false);
              navigate("/statistics");
            }}
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="데이터 내보내기" />}
            onClick={exportToCsv}
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="데이터 가져오기" />}
            onClick={() => {
              requestRemoteDataImport();
            }}
          />
          {env === "sandbox" ? (
            <ListRow
              contents={
                <ListRow.Texts
                  type="1RowTypeA"
                  top="[SANDBOX] 전체 데이터 삭제"
                />
              }
              onClick={() => setOpenDataDeleteDialog(true)}
            />
          ) : null}
        </div>
      </BottomSheet>
      <RemoteDataLoadConfirmDialog
        open={openDataImportDialog}
        setOpen={setOpenDataImportDialog}
        onConfirm={confirmRemoteDataImport}
      />
      <DeleteAllDataConfirmDialog
        open={openDataDeleteDialog}
        setOpen={setOpenDataDeleteDialog}
        onConfirm={confirmDeleteAllData}
      />
    </>
  );
}

function DeleteAllDataConfirmDialog({
  open,
  setOpen,
  onConfirm,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title={<ConfirmDialog.Title>{"데이터 삭제하기"}</ConfirmDialog.Title>}
      description={
        <ConfirmDialog.Description>
          {"현재 기기에 저장된 데이터를 모두 삭제할게요."}
        </ConfirmDialog.Description>
      }
      cancelButton={
        <ConfirmDialog.CancelButton onClick={() => setOpen(false)}>
          아니오
        </ConfirmDialog.CancelButton>
      }
      confirmButton={
        <ConfirmDialog.ConfirmButton color="danger" onClick={onConfirm}>
          예
        </ConfirmDialog.ConfirmButton>
      }
      onClose={() => setOpen(false)}
    />
  );
}

function RemoteDataLoadConfirmDialog({
  open,
  setOpen,
  onConfirm,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title={<ConfirmDialog.Title>{"데이터 가져오기"}</ConfirmDialog.Title>}
      description={
        <ConfirmDialog.Description>
          {
            "서버에 저장된 주유 기록을 가져올게요.\n이 기기의 목록이 서버 기록과\n동일하게 맞춰져요."
          }
        </ConfirmDialog.Description>
      }
      cancelButton={
        <ConfirmDialog.CancelButton onClick={() => setOpen(false)}>
          아니오
        </ConfirmDialog.CancelButton>
      }
      confirmButton={
        <ConfirmDialog.ConfirmButton onClick={onConfirm}>
          예
        </ConfirmDialog.ConfirmButton>
      }
      onClose={() => setOpen(false)}
    />
  );
}
