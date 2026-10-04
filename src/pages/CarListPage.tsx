import { Button, ListRow, Top } from "@toss/tds-mobile";
import { useNavigate } from "react-router-dom";
import { useCars } from "../context/CarContext";
import { FUEL_TYPE_LABELS } from "../types/car";

export function CarListPage() {
  const navigate = useNavigate();
  const { cars, selectedCar } = useCars();

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <Top
        upperGap={0}
        lowerGap={0}
        title={<Top.TitleParagraph size={28}>내 차 관리</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            주유 기록은 선택한 차에 저장돼요
          </Top.SubtitleParagraph>
        }
      />

      {cars.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "#8B95A1",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          아직 등록된 차가 없어요
          <br />
          처음 등록한 차에 지금까지의 주유 기록이 연결돼요
        </div>
      ) : (
        <div>
          {cars.map((car, index) => (
            <ListRow
              key={car.id}
              border={index === 0 ? "none" : "indented"}
              onClick={() => navigate(`/cars/${car.id}`)}
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
              withArrow
            />
          ))}
        </div>
      )}

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Button
          color="primary"
          variant="fill"
          style={{ width: "100%" }}
          onClick={() => navigate("/cars/new")}
        >
          차 추가하기
        </Button>
        <Button
          color="dark"
          variant="weak"
          style={{ width: "100%" }}
          onClick={() => {
            navigate("/");
          }}
        >
          홈 화면으로 돌아가기
        </Button>
      </div>
    </main>
  );
}
