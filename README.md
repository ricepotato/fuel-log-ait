# fuel-log-ait

Apps in Toss 프로젝트입니다.

## 시작하기

```bash
npm run dev
```

## 배포하기

- 앱인토스 배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/) > 워크스페이스 > API 키 > 콘솔 API 키 에서 발급받을 수 있어요.

```bash
npm run build
npm run deploy
```

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

AI를 사용하시는 경우 [여기](https://developers-apps-in-toss.toss.im/development/llms.html)를 확인해보세요.

## ADB port forward

```
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5173 tcp:5173
```

## chrome debug console

크롬을 열고 아래 주소 입력. remove device 에서 inspect 클릭

```
chrome://inspect/#devices
```

## FuelLogList

/Users/ricepotato/dev/fuel-log-ait/src/pages/FuelLogList.tsx 이 화면은 주유기록 목록을 보여주는 화면임. 상단에 년도, 월을 선택할 수 있는 컴포넌트를 배치. 화면중간에는 주유한
날짜 주유량(리터) 주유한 장소, 구간 (km), 주유 금액, 주유한

## deploy

https://developers-apps-in-toss.toss.im/development/test/toss.html

토큰 추가하기

```
npx ait token add
```

배포하기

```
npx ait deploy
```

토큰 관련 하위 명령을 관리합니다.

```
ait token
```

시크릿 토큰을 추가합니다.

```
ait token add [--api-key #0] [profile]
```

시크릿 토큰을 삭제합니다.

```
ait token remove [profile]
```
