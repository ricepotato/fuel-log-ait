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

function EditFuelLogRoute() {
  const { id } = useParams<{ id: string }>();
  const { logs, loaded } = useFuelLogs();

  if (!loaded) return null;
  const log = logs.find((item) => item.id === id);
  if (log == null) return <Navigate to="/" replace />;
  return <FuelLogForm initialData={log} />;
}

function App() {
  const [showSettings, setShowSettings] = useState(false);
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
        <Route path="/add" element={<FuelLogForm />} />
        <Route path="/edit/:id" element={<EditFuelLogRoute />} />
        <Route path="/insight/:id" element={<FuelLogInsight />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/receipt-loading" element={<ReceiptLoadingPage />} />
      </Routes>
      <SettingsBottomSheet open={showSettings} setOpen={setShowSettings} />
    </>
  );
}

export default App;
