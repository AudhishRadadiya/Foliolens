import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import GoogleMapReact from "google-map-react";
import MapWidget from "./MapWidget";
import { useSelector } from "react-redux";
import MarketValueRentWidget from "./MarketValueRentWidget";
import TotalEquityWidget from "./TotalEquityWidget";
import CashReturnWidget from "./CashReturnWidget";
import CashflowWidget from "./CashflowWidget";

const cardBgColor = (key) =>
  ["marketValueRent", "cashFlow", "nextProperty"].includes(key)
    ? "#FFFFFF"
    : ["map", "properties", "tenants", "tasks", "unreadNotifications", "pastDueAccounts"].includes(key)
    ? "#EDEDED"
    : "#E8EDF7";

const cardNumberColor = (key) =>
  ["marketValueRent", "cashFlow", "nextProperty"].includes(key)
    ? "#FFFFFF"
    : ["map", "properties", "tenants", "tasks", "unreadNotifications", "pastDueAccounts"].includes(key)
    ? "#000000"
    : "#1646AA";

const widgetNames = {
  map: "Map of Properties",
  properties: "# of Properties",
  tenants: "# of Tenants",
  tasks: "Tasks To Be Completed",
  unreadNotifications: "Unread Notifications",
  pastDueAccounts: "Tenants Past Due",
  marketValueRent: "Market Value Rent",
  equity: "Total equity",
  cashReturn: "Cash on Cash Return",
  nextProperty: "Time to Next Property",
  cashFlow: "Net Cashflow",
  occupancy: "Occupancy",
  capRate: "Cap Rate",
};

const Counter = ({ value, id }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "row",
        alignItems: "center",
        height: "50%",
      }}
    >
      <h2
        style={{
          fontSize: "30px",
          color: cardNumberColor(id),
          margin: "10px 0px",
          textAlign: "center",
        }}
      >
        {value}
      </h2>
    </div>
  );
};

export default function Widget({
  id,
  onRemoveItem,
  properties,
  selectedPortfolioId,
  layout,
  cashflowData,
  totalIncome,
}) {
  const dashboardData = useSelector(({ dashboardData }) => dashboardData);

  let capRate = dashboardData?.cap_rate ? dashboardData?.cap_rate : "0.0";
  let cashOnCash = dashboardData?.cash_on_cash ? dashboardData?.cash_on_cash : "0.0";

  const renderComponent = (id) => {
    switch (id) {
      case "map":
        return <MapWidget properties={properties} />;
      case "properties":
        return <Counter id={id} value={dashboardData?.total_property ? dashboardData?.total_property : 0} />;
      case "tenants":
        return <Counter id={id} value={dashboardData?.total_tenant ? dashboardData?.total_tenant : 0} />;
      case "tasks":
        return <Counter id={id} value={dashboardData?.total_pending_task ? dashboardData?.total_pending_task : 0} />;
      case "unreadNotifications":
        return (
          <Counter
            id={id}
            value={dashboardData?.total_unread_notification ? dashboardData?.total_unread_notification : 0}
          />
        );
      case "pastDueAccounts":
        return <Counter id={id} value={dashboardData?.total_past_due ? dashboardData?.total_past_due : 0} />;
      case "marketValueRent":
        return (
          <MarketValueRentWidget
            marketRent={dashboardData?.total_market_rent ? dashboardData?.total_market_rent : 0}
            portfolioAverage={dashboardData?.portfolio_average_rent ? dashboardData?.portfolio_average_rent : 0}
          />
        );
      case "equity":
        return <TotalEquityWidget value={dashboardData?.total_equity ? dashboardData?.total_equity : 0} />;
      case "cashReturn":
        return <CashReturnWidget value={!cashOnCash || isNaN(cashOnCash) ? "0.0%" : cashOnCash + "%"} />;
      case "nextProperty":
        return <></>;
      case "cashFlow":
        return <CashflowWidget selectedPortfolioId={selectedPortfolioId} layout={layout} cashflowData={cashflowData} />;
      case "capRate":
        return <Counter id={id} value={!capRate || isNaN(capRate) ? "0.0%" : capRate + "%"} />;
      case "occupancy":
        return (
          <Counter
            id={id}
            value={dashboardData?.occupancy ? Math.round(Number(dashboardData?.occupancy)) + "%" : "0%"}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        alignItems: "center",
        padding: 0,
        boxShadow: "0px 1px 6px rgba(6, 18, 43, 0.1)",
        backgroundColor: cardBgColor(id),
      }}
    >
      <h4 style={{ margin: "10px 0px 5px 0px", fontSize: "12px", textAlign: "center" }}>{widgetNames[id]}</h4>
      <div
        style={{ height: "90%", display: "flex", flexDirection: "column", overflow: "hidden", alignItems: "center" }}
      >
        {renderComponent(id)}
      </div>
    </Card>
  );
}
