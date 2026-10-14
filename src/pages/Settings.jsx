import React from "react";
import { useSearchParams } from "react-router-dom";

import StoreSettings from "./StoreSettings";
import DeliveryCharges from "./DeliveryCharges";
import DeliverySlots from "./DeliverySlots";

const TABS = [
  { key: "store", label: "Store Settings", Component: StoreSettings },
  { key: "charges", label: "Delivery Charges", Component: DeliveryCharges },
  { key: "slots", label: "Delivery Slots", Component: DeliverySlots },
];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active =
    TABS.find((tab) => tab.key === searchParams.get("tab")) || TABS[0];
  const ActiveComponent = active.Component;

  return (
    <div className="settings-tabs-page">
      <div className="settings-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active.key}
            className={`settings-tab ${tab.key === active.key ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: tab.key })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-tabs-content">
        <ActiveComponent />
      </div>

      <style>{`
        .settings-tabs-page { background: #f5f6f8; min-height: 100vh; }
        .settings-tabs { display: flex; gap: 4px; padding: 16px 24px 0; border-bottom: 1px solid #e5e7eb; background: #fff; position: sticky; top: 0; z-index: 10; }
        .settings-tab { border: none; background: transparent; padding: 12px 18px; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -1px; }
        .settings-tab:hover { color: #ea580c; }
        .settings-tab.active { color: #ea580c; border-bottom-color: #f97316; }
        .settings-tabs-content .dc-page, .settings-tabs-content .ds-page { min-height: auto; }
      `}</style>
    </div>
  );
}
