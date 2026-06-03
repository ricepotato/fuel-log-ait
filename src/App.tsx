import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import "./App.css";
import { FuelLogForm } from "./pages/FuelLogForm";
import { FuelLogList } from "./pages/FuelLogList";
import { getFuelLogById } from "./repository";
import type { FuelLog } from "./types/fuelLog";

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
  return (
    <Routes>
      <Route path="/" element={<FuelLogList />} />
      <Route path="/add" element={<FuelLogForm />} />
      <Route path="/edit/:id" element={<EditFuelLogRoute />} />
    </Routes>
  );
}

export default App;
