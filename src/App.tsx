import { Route, Routes } from "react-router-dom";
import "./App.css";
import { FuelLogForm } from "./pages/FuelLogForm";
import { FuelLogList } from "./pages/FuelLogList";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FuelLogList />} />
      <Route path="/add" element={<FuelLogForm />} />
    </Routes>
  );
}

export default App;
