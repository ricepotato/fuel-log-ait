import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fuel-log-ait",
  brand: {
    displayName: "주유 기록", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#3182F6", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/40561/3968cc04-c6d0-4cd0-bc3e-9253365e0708.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev --host 0.0.0.0",
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
  permissions: [
    {
      name: "camera",
      access: "access",
    },
    {
      name: "photos",
      access: "read",
    },
  ],
  outdir: "dist",
});
