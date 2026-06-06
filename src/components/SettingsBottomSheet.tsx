import { BottomSheet, ListRow } from "@toss/tds-mobile";

export default function SettingsBottomSheet({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={() => setOpen(false)}
      header={<BottomSheet.Header>데이터 관리</BottomSheet.Header>}
    >
      <div style={{ paddingBottom: 24 }}>
        <ListRow
          contents={<ListRow.Texts type="1RowTypeA" top="데이터 내보내기" />}
          onClick={() => {}}
        />
        <ListRow
          border="indented"
          contents={<ListRow.Texts type="1RowTypeA" top="데이터 가져오기" />}
          onClick={() => {}}
        />
        <ListRow
          contents={<ListRow.Texts type="1RowTypeA" top="통계 보기" />}
          onClick={() => {}}
        />
      </div>
    </BottomSheet>
  );
}
