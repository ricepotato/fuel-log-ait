import { useState } from "react";
import "./App.css";
import { FuelLogList } from "./pages/FuelLogList";
import type { FuelLog } from "./types/fuelLog";

function App() {
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth(),
  );

  return (
    <FuelLogList
      onEdit={(log) => {
        setEditingLog(log);
      }}
      selectedYear={selectedYear}
      onYearChange={setSelectedYear}
      selectedMonthIndex={selectedMonthIndex}
      onMonthChange={setSelectedMonthIndex}
    />
  );
}

export default App;
