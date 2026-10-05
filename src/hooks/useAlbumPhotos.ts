import { Device } from "@apps-in-toss/web-framework";
import { useCallback, useState } from "react";
import { useToast } from "../hooks/useToast";

export interface ImageState {
  previewUri: string;
  dataUri: string;
}

interface UseAlbumPhotosProps {
  base64?: boolean;
}

export function useAlbumPhotos({ base64 = false }: UseAlbumPhotosProps) {
  const { show } = useToast();
  const [albumPhotos, setAlbumPhotos] = useState<ImageState[]>([]);

  const loadPhotos = useCallback(async () => {
    try {
      const response = await Device.getAlbumItems({
        types: ["PHOTO"],
        maxCount: 5,
        base64: true,
      });

      if (!response) {
        return;
      }

      const newImages = response.map((img) => ({
        ...img,
        previewUri: base64
          ? `data:image/jpeg;base64,${img.dataUri}`
          : img.dataUri,
      }));

      setAlbumPhotos((prev) => [...prev, ...newImages]);
    } catch (error) {
      let errorMessage = "앨범을 가져오는 데 실패했어요";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error(error);
      show({ text: errorMessage, duration: 2000 });
    }
  }, [base64]);

  const deletePhoto = useCallback((id: string) => {}, []);

  return { albumPhotos, loadPhotos, deletePhoto };
}
