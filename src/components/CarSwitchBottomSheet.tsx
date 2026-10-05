import { BottomSheet, ListRow } from "@toss/tds-mobile";
import { useNavigate } from "react-router-dom";
import { useCars } from "../context/CarContext";
import { FUEL_TYPE_LABELS } from "../types/car";

export default function CarSwitchBottomSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { cars, selectedCar, selectCar } = useCars();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={<BottomSheet.Header>차 선택</BottomSheet.Header>}
    >
      <div style={{ paddingBottom: 24 }}>
        {cars.map((car) => (
          <ListRow
            key={car.id}
            onClick={async () => {
              await selectCar(car.id);
              onClose();
            }}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={car.name}
                bottom={[FUEL_TYPE_LABELS[car.fuelType], car.model]
                  .filter(Boolean)
                  .join(" · ")}
              />
            }
            right={
              car.id === selectedCar?.id ? (
                <ListRow.Texts type="Right1RowTypeA" top="사용 중" />
              ) : undefined
            }
          />
        ))}
        <ListRow
          onClick={() => {
            onClose();
            navigate(cars.length === 0 ? "/cars/new" : "/cars");
          }}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top={cars.length === 0 ? "차 등록하기" : "내 차 관리"}
            />
          }
          withArrow
        />
      </div>
    </BottomSheet>
  );
}
