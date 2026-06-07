import { ConfirmDialog } from "@toss/tds-mobile";

export default function DeleteConfirmDialog({
  open,
  setOpen,
  onConfirm,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <ConfirmDialog
        open={open}
        title={<ConfirmDialog.Title>{"주유 기록 삭제"}</ConfirmDialog.Title>}
        description={
          <ConfirmDialog.Description>
            {"정말 이 주유 기록을 삭제할까요?"}
          </ConfirmDialog.Description>
        }
        cancelButton={
          <ConfirmDialog.CancelButton onClick={() => setOpen(false)}>
            아니오
          </ConfirmDialog.CancelButton>
        }
        confirmButton={
          <ConfirmDialog.ConfirmButton
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            예
          </ConfirmDialog.ConfirmButton>
        }
        onClose={() => setOpen(false)}
      />
    </>
  );
}
