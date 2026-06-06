import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface FuelLogFilterState {
  selectedYear: number;
  selectedMonthIndex: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonthIndex: (index: number) => void;
}

const FuelLogFilterContext = createContext<FuelLogFilterState | null>(null);

export function FuelLogFilterProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth(),
  );

  return (
    <FuelLogFilterContext.Provider
      value={{ selectedYear, selectedMonthIndex, setSelectedYear, setSelectedMonthIndex }}
    >
      {children}
    </FuelLogFilterContext.Provider>
  );
}

export function useFuelLogFilter() {
  const ctx = useContext(FuelLogFilterContext);
  if (!ctx) throw new Error("FuelLogFilterProvider가 필요합니다.");
  return ctx;
}
