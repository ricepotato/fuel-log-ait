import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import config from "../granite.config.ts";
import App from "./App.tsx";
import { FuelLogFilterProvider } from "./context/FuelLogFilterContext.tsx";
import { FuelLogProvider } from "./context/FuelLogContext.tsx";
import { ToastProvider } from "./hooks/useToast.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
        <FuelLogProvider>
          <FuelLogFilterProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </FuelLogFilterProvider>
        </FuelLogProvider>
      </TDSMobileAITProvider>
    </BrowserRouter>
  </StrictMode>,
);
