import { partner, tdsEvent } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import "./App.css";
import { FuelLogForm } from "./pages/FuelLogForm";
import { FuelLogList } from "./pages/FuelLogList";
import { getFuelLogById } from "./repository";
import type { FuelLog } from "./types/fuelLog";
import SettingsBottomSheet from "./components/SettingsBottomSheet";

function EditFuelLogRoute() {
  const { id } = useParams<{ id: string }>();
  const [log, setLog] = useState<FuelLog | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getFuelLogById(id).then((found) => setLog(found ?? null));
  }, [id]);

  if (log === undefined) return null;
  if (log === null) return <Navigate to="/" replace />;
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
          console.log("버튼 클릭");
          setShowSettings(true);
        }
      },
    });

    return cleanup;
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<FuelLogList />} />
        <Route path="/add" element={<FuelLogForm />} />
        <Route path="/edit/:id" element={<EditFuelLogRoute />} />
      </Routes>
      <SettingsBottomSheet open={showSettings} setOpen={setShowSettings} />
    </>
  );
}

export default App;
