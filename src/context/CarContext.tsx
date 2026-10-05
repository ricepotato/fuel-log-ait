import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  createCarId,
  getCars,
  getSelectedCarId,
  saveCars,
  saveSelectedCarId,
} from "../carRepository";
import type { Car } from "../types/car";
import type { FuelLog } from "../types/fuelLog";
import { useFuelLogs } from "./FuelLogContext";

export type CarInput = Omit<Car, "id" | "createdAt">;

interface CarState {
  cars: Car[];
  /** Storage 에서 최초 로드가 끝났는지 여부 */
  loaded: boolean;
  /** 지금 기록을 보고 입력하는 차. 등록된 차가 없으면 null 이에요. */
  selectedCar: Car | null;
  /** 새 차를 등록하고 그 차를 선택해요. 첫 차라면 기존 기록을 모두 연결해요. */
  addCar: (input: CarInput) => Promise<Car>;
  updateCar: (car: Car) => Promise<void>;
  /** 차를 지우고, 그 차의 기록도 모두 지워요. */
  deleteCar: (id: string) => Promise<void>;
  selectCar: (id: string) => Promise<void>;
}

const CarContext = createContext<CarState | null>(null);

/**
 * 기록이 어느 차에 속하는지 정해요.
 * carId 가 없는 기록(차 기능 이전 기록)은 기본 차 소속이에요.
 */
export function carIdOfLog(log: FuelLog, defaultCarId: string | undefined) {
  return log.carId ?? defaultCarId;
}

export function CarProvider({ children }: { children: ReactNode }) {
  const { linkUnassignedLogs, removeCarLogs } = useFuelLogs();
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setCars(await getCars());
      setSelectedCarId(await getSelectedCarId());
      setLoaded(true);
    })();
  }, []);

  const selectCar = useCallback(async (id: string) => {
    await saveSelectedCarId(id);
    setSelectedCarId(id);
  }, []);

  const addCar = useCallback(
    async (input: CarInput) => {
      const car: Car = {
        ...input,
        id: createCarId(),
        createdAt: new Date().toISOString(),
      };
      const isFirstCar = cars.length === 0;
      const next = [...cars, car];
      await saveCars(next);
      setCars(next);
      if (isFirstCar) {
        await linkUnassignedLogs(car.id);
      }
      await selectCar(car.id);
      return car;
    },
    [cars, linkUnassignedLogs, selectCar],
  );

  const updateCar = useCallback(
    async (car: Car) => {
      const next = cars.map((item) => (item.id === car.id ? car : item));
      await saveCars(next);
      setCars(next);
    },
    [cars],
  );

  const deleteCar = useCallback(
    async (id: string) => {
      await removeCarLogs(id, cars[0]?.id === id);
      const next = cars.filter((car) => car.id !== id);
      await saveCars(next);
      setCars(next);
      if (selectedCarId === id && next.length > 0) {
        await selectCar(next[0].id);
      }
    },
    [cars, selectedCarId, removeCarLogs, selectCar],
  );

  // 선택한 차가 지워졌거나 아직 고른 적이 없으면 기본 차(첫 차)를 보여줘요.
  const selectedCar =
    cars.find((car) => car.id === selectedCarId) ?? cars[0] ?? null;

  return (
    <CarContext.Provider
      value={{
        cars,
        loaded,
        selectedCar,
        addCar,
        updateCar,
        deleteCar,
        selectCar,
      }}
    >
      {children}
    </CarContext.Provider>
  );
}

export function useCars() {
  const ctx = useContext(CarContext);
  if (!ctx) throw new Error("CarProvider가 필요합니다.");
  return ctx;
}

/** 선택한 차의 기록만 돌려줘요. 등록된 차가 없으면 전체 기록이에요. */
export function useSelectedCarLogs(): FuelLog[] {
  const { logs } = useFuelLogs();
  const { cars, selectedCar } = useCars();
  const defaultCarId = cars[0]?.id;

  return useMemo(() => {
    if (!selectedCar) return logs;
    return logs.filter(
      (log) => carIdOfLog(log, defaultCarId) === selectedCar.id,
    );
  }, [logs, selectedCar, defaultCarId]);
}
