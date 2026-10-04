import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { FuelLog } from "../types/fuelLog";
import {
  addFuelLog,
  addFuelLogs,
  clearFuelLogs,
  getFuelLogs,
  linkUnassignedFuelLogs,
  unlinkFuelLogsFromCar,
  removeFuelLog,
  updateFuelLog,
} from "../repository";

interface FuelLogState {
  logs: FuelLog[];
  /** Storage 에서 최초 로드가 끝났는지 여부. false 면 아직 빈 목록인지 알 수 없어요. */
  loaded: boolean;
  addLog: (log: FuelLog) => Promise<void>;
  updateLog: (log: FuelLog) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  /** 여러 기록을 한 번에 추가해요(sandbox 샘플 데이터 입력용). */
  addLogs: (logs: FuelLog[]) => Promise<void>;
  /** 차가 지정되지 않은 기록을 모두 carId 차에 연결해요(첫 차 등록 시). */
  linkUnassignedLogs: (carId: string) => Promise<void>;
  /** carId 차의 기록을 기본 차 소속으로 되돌려요(차 삭제 시). */
  unlinkCarLogs: (carId: string) => Promise<void>;
}

const FuelLogContext = createContext<FuelLogState | null>(null);

export function FuelLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Storage 를 읽어 전역 상태를 맞춰요.
  const reload = useCallback(async () => {
    setLogs(await getFuelLogs());
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addLog = useCallback(
    async (log: FuelLog) => {
      await addFuelLog(log);
      await reload();
    },
    [reload],
  );

  const updateLog = useCallback(
    async (log: FuelLog) => {
      await updateFuelLog(log);
      await reload();
    },
    [reload],
  );

  const removeLog = useCallback(
    async (id: string) => {
      await removeFuelLog(id);
      await reload();
    },
    [reload],
  );

  // sandbox 전용 테스트 기능이에요.
  const clearLogs = useCallback(async () => {
    await clearFuelLogs();
    await reload();
  }, [reload]);

  const addLogs = useCallback(
    async (newLogs: FuelLog[]) => {
      await addFuelLogs(newLogs);
      await reload();
    },
    [reload],
  );

  const linkUnassignedLogs = useCallback(
    async (carId: string) => {
      const linked = await linkUnassignedFuelLogs(carId);
      if (linked.length > 0) await reload();
    },
    [reload],
  );

  const unlinkCarLogs = useCallback(
    async (carId: string) => {
      await unlinkFuelLogsFromCar(carId);
      await reload();
    },
    [reload],
  );

  return (
    <FuelLogContext.Provider
      value={{
        logs,
        loaded,
        addLog,
        updateLog,
        removeLog,
        clearLogs,
        addLogs,
        linkUnassignedLogs,
        unlinkCarLogs,
      }}
    >
      {children}
    </FuelLogContext.Provider>
  );
}

export function useFuelLogs() {
  const ctx = useContext(FuelLogContext);
  if (!ctx) throw new Error("FuelLogProvider가 필요합니다.");
  return ctx;
}
