import { partner, tdsEvent } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import "./App.css";
import { FuelLogForm } from "./pages/FuelLogForm";
import { FuelLogInsight } from "./pages/FuelLogInsight";
import { FuelLogList } from "./pages/FuelLogList";
import { ReceiptLoadingPage } from "./pages/ReceiptLoadingPage";
import { useFuelLogs } from "./context/FuelLogContext";
import SettingsBottomSheet from "./components/SettingsBottomSheet";
import { ScrollToTop } from "./components/ScrollToTop";
import { StatisticsPage } from "./pages/StatisticsPage";
import { DataExportPage } from "./pages/DataExportPage";
import { CarListPage } from "./pages/CarListPage";
import { CarFormPage } from "./pages/CarFormPage";
import { useCars } from "./context/CarContext";
import { TossAds } from "@apps-in-toss/web-framework";

function EditFuelLogRoute() {
  const { id } = useParams<{ id: string }>();
  const { logs, loaded } = useFuelLogs();
  const { loaded: carsLoaded } = useCars();

  // 폼은 차의 연료 종류로 입력 항목을 정해서 차 목록까지 읽은 뒤에 그려요.
  if (!loaded || !carsLoaded) return null;
  const log = logs.find((item) => item.id === id);
  if (log == null) return <Navigate to="/" replace />;
  return <FuelLogForm initialData={log} />;
}

function AddFuelLogRoute() {
  const { loaded } = useCars();
  if (!loaded) return null;
  return <FuelLogForm />;
}

function EditCarRoute() {
  const { id } = useParams<{ id: string }>();
  const { cars, loaded } = useCars();

  if (!loaded) return null;
  const car = cars.find((item) => item.id === id);
  if (car == null) return <Navigate to="/cars" replace />;
  return <CarFormPage initialData={car} />;
}

function App() {
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (TossAds.initialize.isSupported()) {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => console.log("SDK 준비 완료"),
        },
      });
    }
  }, []);

  useEffect(() => {
    partner.addAccessoryButton({
      id: "setting",
      title: "설정",
      icon: {
        name: "icon-setting-mono",
      },
    });

    const cleanup = tdsEvent.addEventListener("navigationAccessoryEvent", {
      onEvent: ({ id }) => {
        if (id === "setting") {
          setShowSettings(true);
        }
      },
    });

    return cleanup;
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<FuelLogList />} />
        <Route path="/add" element={<AddFuelLogRoute />} />
        <Route path="/edit/:id" element={<EditFuelLogRoute />} />
        <Route path="/insight/:id" element={<FuelLogInsight />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/export" element={<DataExportPage />} />
        <Route path="/cars" element={<CarListPage />} />
        <Route path="/cars/new" element={<CarFormPage />} />
        <Route path="/cars/:id" element={<EditCarRoute />} />
        <Route path="/receipt-loading" element={<ReceiptLoadingPage />} />
      </Routes>
      <SettingsBottomSheet open={showSettings} setOpen={setShowSettings} />
    </>
  );
}

export default App;
