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
  clearFuelLogs,
  getFuelLogs,
  reloadFuelLogsFromServer,
  removeFuelLog,
  syncFuelLog,
  updateFuelLog,
  type FuelLogChange,
} from "../repository";

interface FuelLogState {
  logs: FuelLog[];
  /** 캐시에서 최초 로드가 끝났는지 여부. false 면 아직 빈 목록인지 알 수 없어요. */
  loaded: boolean;
  addLog: (log: FuelLog) => Promise<void>;
  updateLog: (log: FuelLog) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  /** 서버 기록을 다시 받아 캐시와 화면을 갱신해요. */
  reloadFromServer: () => Promise<void>;
}

const FuelLogContext = createContext<FuelLogState | null>(null);

export function FuelLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 캐시를 읽어 전역 상태를 맞춰요. 화면을 바로 그리기 위한 경로예요.
  const reload = useCallback(async () => {
    setLogs(await getFuelLogs());
    setLoaded(true);
  }, []);

  // 서버 반영은 화면을 막지 않도록 백그라운드로 돌려요.
  // 성공하면 서버 기준 목록이 돌아오니 그대로 반영하고,
  // 실패하면 캐시에 남은 로컬 변경을 유지해요.
  const sync = useCallback((change?: FuelLogChange) => {
    syncFuelLog(change)
      .then((serverLogs) => {
        if (serverLogs) setLogs(serverLogs);
      })
      .catch((error) => console.warn("서버 동기화에 실패했어요.", error));
  }, []);

  useEffect(() => {
    // 캐시로 먼저 그리고, 서버 기준으로 다시 맞춰요.
    reload();
    sync();
  }, [reload, sync]);

  const addLog = useCallback(
    async (log: FuelLog) => {
      await addFuelLog(log);
      await reload();
      sync({ type: "add", log });
    },
    [reload, sync],
  );

  const updateLog = useCallback(
    async (log: FuelLog) => {
      await updateFuelLog(log);
      await reload();
      sync({ type: "update", log });
    },
    [reload, sync],
  );

  const removeLog = useCallback(
    async (id: string) => {
      await removeFuelLog(id);
      await reload();
      sync({ type: "remove", id });
    },
    [reload, sync],
  );

  // 로컬 캐시만 지우는 테스트용 기능이에요.
  // 서버 기록은 그대로라 다음 동기화 때 다시 내려와요.
  const clearLogs = useCallback(async () => {
    await clearFuelLogs();
    await reload();
  }, [reload]);

  const reloadFromServer = useCallback(async () => {
    const serverLogs = await reloadFuelLogsFromServer();
    if (serverLogs) {
      setLogs(serverLogs);
      return;
    }
    await reload();
  }, [reload]);

  return (
    <FuelLogContext.Provider
      value={{
        logs,
        loaded,
        addLog,
        updateLog,
        removeLog,
        clearLogs,
        reloadFromServer,
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
