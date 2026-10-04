import { Environment, User } from "@apps-in-toss/web-framework";
import { BottomSheet, ConfirmDialog, ListRow } from "@toss/tds-mobile";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRemoteFuelLogs } from "../api/fuellog";
import { useFuelLogs } from "../context/FuelLogContext";
import { useToast } from "../hooks/useToast";
import { SAMPLE_FUEL_LOGS } from "../sandbox/sampleFuelLogs";
import { useCars } from "../context/CarContext";

export default function SettingsBottomSheet({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { show } = useToast();
  const { clearLogs, addLogs, reloadFromServer } = useFuelLogs();
  const { selectedCar } = useCars();
  const [openDataImportDialog, setOpenDataImportDialog] = useState(false);
  const [openDataDeleteDialog, setOpenDataDeleteDialog] = useState(false);
  const navigate = useNavigate();

  async function requestRemoteDataImport() {
    /**
     * 서버에 저장된 기록이 있는지 확인한 다음 dialog 를 띄웁니다.
     * 사용자가 확인 버튼을 누르면 서버 기록으로 이 기기의 목록을 맞춥니다.
     */
    const anonymousKey = await User.getAnonymousKey();
    const remoteFuelLogs = await fetchRemoteFuelLogs(
      anonymousKey.hash,
      Environment.environment,
    );
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

  async function insertSampleData() {
    const baseId = Date.now();
    await addLogs(
      SAMPLE_FUEL_LOGS.map((log, index) => ({
        ...log,
        id: (baseId + index).toString(),
        carId: selectedCar?.id,
      })),
    );
    setOpen(false);
    show({
      text: `샘플 데이터 ${SAMPLE_FUEL_LOGS.length}개를 입력했어요`,
      duration: 2000,
    });
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
            contents={<ListRow.Texts type="1RowTypeA" top="내 차 관리" />}
            onClick={() => {
              setOpen(false);
              navigate("/cars");
            }}
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="통계 보기" />}
            onClick={() => {
              setOpen(false);
              navigate("/statistics");
            }}
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="데이터 내보내기" />}
            onClick={() => {
              setOpen(false);
              navigate("/export");
            }}
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="데이터 가져오기" />}
            onClick={() => {
              requestRemoteDataImport();
            }}
          />
          {Environment.environment === "sandbox" ? (
            <>
              <ListRow
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top="[SANDBOX] 전체 데이터 삭제"
                  />
                }
                onClick={() => setOpenDataDeleteDialog(true)}
              />
              <ListRow
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top="[SANDBOX] 임의의 데이터 입력"
                  />
                }
                onClick={insertSampleData}
              />
            </>
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
