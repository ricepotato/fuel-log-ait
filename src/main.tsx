import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import config from "../apps-in-toss.config.ts";
import App from "./App.tsx";
import { FuelLogFilterProvider } from "./context/FuelLogFilterContext.tsx";
import { FuelLogProvider } from "./context/FuelLogContext.tsx";
import { CarProvider } from "./context/CarContext.tsx";
import { ToastProvider } from "./hooks/useToast.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
        <FuelLogProvider>
          <CarProvider>
            <FuelLogFilterProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </FuelLogFilterProvider>
          </CarProvider>
        </FuelLogProvider>
      </TDSMobileAITProvider>
    </BrowserRouter>
  </StrictMode>,
);
