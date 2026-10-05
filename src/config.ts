/**
 * 빌드 시점 환경변수로 정하는 앱 설정이에요.
 * Vite 가 빌드할 때 값을 코드에 박아 넣어서, 바꾸려면 다시 빌드해야 해요.
 */

/** 광고 노출 여부. VITE_ADS_ENABLED=false 일 때만 광고를 숨겨요(기본값: 노출). */
export const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED !== "false";
