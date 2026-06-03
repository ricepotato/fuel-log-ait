import { Asset, Button, Top } from "@toss/tds-mobile";
import "./App.css";
import { InAppPurchasePage } from "./pages/InAppPurchasePage";
import { InAppAdsPage } from "./pages/InAppAdsPage";
import { FuelLogList } from "./pages/FuelLogList";
import { FuelLogForm } from "./pages/FuelLogForm";
import { useState } from "react";
import type { FuelLog } from "./types/fuelLog";

function App() {
  const [page, setPage] = useState<string | null>("fuel");
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth(),
  );

  if (page === "fuel")
    return (
      <FuelLogList
        onNavigate={setPage}
        onEdit={(log) => {
          setEditingLog(log);
          setPage("fuel-edit");
        }}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedMonthIndex={selectedMonthIndex}
        onMonthChange={setSelectedMonthIndex}
      />
    );
  if (page === "fuel-create")
    return <FuelLogForm onBack={() => setPage("fuel")} />;
  if (page === "fuel-edit" && editingLog)
    return (
      <FuelLogForm
        initialData={editingLog}
        onBack={() => {
          setEditingLog(null);
          setPage("fuel");
        }}
      />
    );
  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;
  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>반가워요</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            앱인토스 개발을 시작해 보세요.
          </Top.SubtitleParagraph>
        }
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "24px",
        }}
      >
        <Button
          as="a"
          variant="weak"
          href="https://developers-apps-in-toss.toss.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          개발자센터
        </Button>
        <Button
          as="a"
          variant="weak"
          href="https://techchat-apps-in-toss.toss.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          개발자 커뮤니티
        </Button>
        <Button color="dark" variant="weak" onClick={() => setPage("iap")}>
          인앱결제 테스트하기
        </Button>

        <Button color="dark" variant="weak" onClick={() => setPage("iaa")}>
          인앱광고 테스트하기
        </Button>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Asset.Image
          alt="apps in toss logo"
          frameShape={{ width: 160 }}
          backgroundColor="transparent"
          src={`${import.meta.env.BASE_URL}appsintoss-logo.png`}
        />
      </div>
    </>
  );
}

export default App;
