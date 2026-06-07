import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fuel-log-ait",
  brand: {
    displayName: "주유기록", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#3182F6", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/40561/b619f9fa-184c-4667-9ad3-3e4715a43ffc.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  webViewProps: {
    pullToRefreshEnabled: false,
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  permissions: [],
  outdir: "dist",
});
