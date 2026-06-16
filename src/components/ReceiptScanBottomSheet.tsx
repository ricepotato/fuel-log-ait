import {
  openCamera,
  OpenCameraPermissionError,
} from "@apps-in-toss/web-framework";
import { BottomSheet, ListRow } from "@toss/tds-mobile";
import { useAlbumPhotos } from "../hooks/useAlbumPhotos";
import { useToast } from "../hooks/useToast";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onImageSelected: (dataUri: string) => void;
}

export default function ReceiptScanBottomSheet({
  open,
  onClose,
  onImageSelected,
}: Props) {
  const { show } = useToast();
  const { albumPhotos, loadPhotos } = useAlbumPhotos({
    base64: false,
  });

  async function handleCamera() {
    onClose();
    try {
      const result = await openCamera({ base64: true });
      onImageSelected("data:image/jpeg;base64," + result.dataUri);
    } catch (error) {
      if (error instanceof OpenCameraPermissionError) {
        show({ text: "카메라 접근 권한이 필요해요", duration: 2000 });
        return;
      }
      show({ text: "사진 촬영에 실패했어요", duration: 2000 });
    }
  }

  async function handleGallery() {
    onClose();
    loadPhotos();
  }

  useEffect(() => {
    if (albumPhotos.length > 0) {
      const latestPhoto = albumPhotos[albumPhotos.length - 1];
      console.log("선택된 사진:", latestPhoto.previewUri);
      onImageSelected(latestPhoto.previewUri);
    }
  }, [albumPhotos]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={<BottomSheet.Header>영수증 스캔</BottomSheet.Header>}
    >
      <div style={{ paddingBottom: 24 }}>
        <ListRow
          contents={<ListRow.Texts type="1RowTypeA" top="카메라로 촬영하기" />}
          onClick={handleCamera}
        />
        <ListRow
          contents={
            <ListRow.Texts type="1RowTypeA" top="갤러리에서 선택하기" />
          }
          onClick={handleGallery}
        />
      </div>
    </BottomSheet>
  );
}
