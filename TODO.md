# 남은 확인 사항

- 마이그레이션 안내에 나온 대로, 백엔드 API가 있다면 CORS 허용 목록에 https://fuel-log-ait.web.tossmini.com,
  https://fuel-log-ait.private-web.tossmini.com을 등록해야 합니다.
- SDK 3.x로 배포하면 2.x로 롤백이 안 되니, 출시 전에 QR 테스트를 먼저 해보세요.
- npm run dev가 이제 vite dev --host 0.0.0.0으로 바뀌었고, 브라우저에서 devtools 패널 + mock SDK로 개발 가능합니다.
