import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fuel-log-ait",
  brand: {
    displayName: "주유기록", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#64B5F6", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  permissions: [],
  outdir: "dist",
});
