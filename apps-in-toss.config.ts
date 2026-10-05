import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "fuel-log-ait",

  brand: {
    // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    primaryColor: "#3182F6"
  },

  webView: {
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

  webBundleDir: "dist"
});
