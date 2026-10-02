import {
  TossAds,
  TossAdsAttachBannerOptions,
} from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useState } from "react";

// 초기화 및 배너 부착을 위한 커스텀 훅
export default function useTossBanner() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: (error) => {
          console.error("Toss Ads SDK initialization failed:", error);
        },
      },
    });
  }, [isInitialized]);

  const attachBanner = useCallback(
    (
      adGroupId: string,
      element: HTMLElement,
      options?: TossAdsAttachBannerOptions,
    ) => {
      if (!isInitialized) return;
      return TossAds.attachBanner(adGroupId, element, options);
    },
    [isInitialized],
  );

  return { isInitialized, attachBanner };
}
