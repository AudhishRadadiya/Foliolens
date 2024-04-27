import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Responsive as ResponsiveGridLayout } from "react-grid-layout";
import { SizeMe } from "react-sizeme";
import Widget from "./Widget";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import PortfolioDropDown from "../Portfolios/PortfolioDropDown";
import AppButton from "../Button/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  createRecordTB,
  fetchDashboardData,
  fetchDashboardLayout,
  getRdsFN,
  updateRecordTB,
} from "../../Utility/ApiService";
import { getId, getMonthBetweenDates } from "../../Utility";
import moment from "moment";
import { setLoading } from "../../store/reducer";
import FlowHelp from "../../pages/Support/FlowHelp";
import AppleStoreModel from "../../pages/Property/AppleStoreModel";

const originalItems = [
  "map",
  "properties",
  "tenants",
  "tasks",
  "unreadNotifications",
  "pastDueAccounts",
  "marketValueRent",
  "equity",
  "cashReturn",
  "nextProperty",
  "cashFlow",
  "occupancy",
  "capRate",
];

// const initialLayouts = {
//   lg: [
//     {
//       w: 4,
//       h: 3,
//       x: 0,
//       y: 0,
//       i: "map",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 4,
//       y: 0,
//       i: "properties",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 6,
//       y: 0,
//       i: "tenants",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 8,
//       y: 0,
//       i: "tasks",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 10,
//       y: 0,
//       i: "unreadNotifications",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 12,
//       y: 0,
//       i: "pastDueAccounts",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 4,
//       h: 2,
//       x: 4,
//       y: 1,
//       i: "marketValueRent",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 4,
//       h: 2,
//       x: 8,
//       y: 1,
//       i: "equity",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 12,
//       y: 1,
//       i: "cashReturn",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 4,
//       h: 4,
//       x: 0,
//       y: 3,
//       i: "nextProperty",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 8,
//       h: 4,
//       x: 4,
//       y: 3,
//       i: "cashFlow",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 12,
//       y: 3,
//       i: "occupancy",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 12,
//       y: 5,
//       i: "capRate",
//       moved: false,
//       static: false,
//     },
//   ],
//   md: [
//     {
//       w: 4,
//       h: 3,
//       x: 0,
//       y: 0,
//       i: "map",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 4,
//       y: 0,
//       i: "properties",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 6,
//       y: 0,
//       i: "tenants",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 8,
//       y: 0,
//       i: "tasks",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 10,
//       y: 0,
//       i: "unreadNotifications",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 12,
//       y: 0,
//       i: "pastDueAccounts",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 4,
//       h: 2,
//       x: 4,
//       y: 1,
//       i: "marketValueRent",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 4,
//       h: 2,
//       x: 8,
//       y: 1,
//       i: "equity",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 12,
//       y: 1,
//       i: "cashReturn",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 4,
//       h: 4,
//       x: 0,
//       y: 3,
//       i: "nextProperty",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 8,
//       h: 4,
//       x: 4,
//       y: 3,
//       i: "cashFlow",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 12,
//       y: 3,
//       i: "occupancy",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 12,
//       y: 5,
//       i: "capRate",
//       moved: false,
//       static: false,
//     },
//   ],
//   xxs: [
//     {
//       w: 2,
//       h: 3,
//       x: 0,
//       y: 0,
//       i: "map",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 1,
//       h: 1,
//       x: 0,
//       y: 3,
//       i: "properties",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 1,
//       h: 1,
//       x: 1,
//       y: 3,
//       i: "tenants",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 1,
//       h: 1,
//       x: 0,
//       y: 4,
//       i: "tasks",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 1,
//       h: 1,
//       x: 1,
//       y: 4,
//       i: "unreadNotifications",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 1,
//       x: 0,
//       y: 5,
//       i: "pastDueAccounts",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 0,
//       y: 6,
//       i: "marketValueRent",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 0,
//       y: 8,
//       i: "equity",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 2,
//       x: 0,
//       y: 10,
//       i: "cashReturn",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 4,
//       x: 0,
//       y: 12,
//       i: "nextProperty",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 2,
//       h: 4,
//       x: 0,
//       y: 16,
//       i: "cashFlow",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 1,
//       h: 1,
//       x: 0,
//       y: 20,
//       i: "occupancy",
//       moved: false,
//       static: false,
//     },
//     {
//       w: 1,
//       h: 1,
//       x: 1,
//       y: 20,
//       i: "capRate",
//       moved: false,
//       static: false,
//     },
//   ],
// };

const initialLayouts = {
  lg: [
    {
      w: 2,
      h: 1,
      x: 4,
      y: 0,
      i: "properties",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 6,
      y: 0,
      i: "tenants",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 8,
      y: 0,
      i: "tasks",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 10,
      y: 0,
      i: "unreadNotifications",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 12,
      y: 0,
      i: "pastDueAccounts",
      moved: false,
      static: false,
    },
    {
      w: 4,
      h: 3,
      x: 0,
      y: 0,
      i: "marketValueRent",
      moved: false,
      static: false,
    },
    {
      w: 4,
      h: 2,
      x: 4,
      y: 1,
      i: "equity",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 8,
      y: 1,
      i: "cashReturn",
      moved: false,
      static: false,
    },
    {
      w: 14,
      h: 4,
      x: 0,
      y: 3,
      i: "cashFlow",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 10,
      y: 1,
      i: "occupancy",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 12,
      y: 1,
      i: "capRate",
      moved: false,
      static: false,
    },
  ],
  md: [
    {
      w: 3,
      h: 1,
      x: 0,
      y: 7,
      i: "map",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 4,
      y: 0,
      i: "properties",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 6,
      y: 0,
      i: "tenants",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 8,
      y: 0,
      i: "tasks",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 10,
      y: 0,
      i: "unreadNotifications",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 12,
      y: 0,
      i: "pastDueAccounts",
      moved: false,
      static: false,
    },
    {
      w: 4,
      h: 3,
      x: 0,
      y: 0,
      i: "marketValueRent",
      moved: false,
      static: false,
    },
    {
      w: 4,
      h: 2,
      x: 4,
      y: 1,
      i: "equity",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 8,
      y: 1,
      i: "cashReturn",
      moved: false,
      static: false,
    },
    {
      w: 3,
      h: 1,
      x: 0,
      y: 8,
      i: "nextProperty",
      moved: false,
      static: false,
    },
    {
      w: 14,
      h: 4,
      x: 0,
      y: 3,
      i: "cashFlow",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 10,
      y: 1,
      i: "occupancy",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 12,
      y: 1,
      i: "capRate",
      moved: false,
      static: false,
    },
  ],
  sm: [
    {
      w: 3,
      h: 1,
      x: 0,
      y: 10,
      i: "map",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 2,
      y: 6,
      i: "properties",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 0,
      y: 6,
      i: "tenants",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 4,
      y: 7,
      i: "tasks",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 4,
      y: 6,
      i: "unreadNotifications",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 0,
      y: 7,
      i: "pastDueAccounts",
      moved: false,
      static: false,
    },
    {
      w: 3,
      h: 2,
      x: 0,
      y: 4,
      i: "marketValueRent",
      moved: false,
      static: false,
    },
    {
      w: 3,
      h: 2,
      x: 3,
      y: 4,
      i: "equity",
      moved: false,
      static: false,
    },
    {
      w: 3,
      h: 2,
      x: 0,
      y: 8,
      i: "cashReturn",
      moved: false,
      static: false,
    },
    {
      w: 3,
      h: 1,
      x: 0,
      y: 11,
      i: "nextProperty",
      moved: false,
      static: false,
    },
    {
      w: 6,
      h: 4,
      x: 0,
      y: 0,
      i: "cashFlow",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 2,
      y: 7,
      i: "occupancy",
      moved: false,
      static: false,
    },
    {
      w: 3,
      h: 2,
      x: 3,
      y: 8,
      i: "capRate",
      moved: false,
      static: false,
    },
  ],
  xs: [
    {
      w: 2,
      h: 1,
      x: 2,
      y: 9,
      i: "properties",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 0,
      y: 9,
      i: "tenants",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 0,
      y: 10,
      i: "tasks",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 2,
      y: 10,
      i: "unreadNotifications",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 0,
      y: 11,
      i: "pastDueAccounts",
      moved: false,
      static: false,
    },
    {
      w: 4,
      h: 3,
      x: 0,
      y: 4,
      i: "marketValueRent",
      moved: false,
      static: false,
    },
    {
      w: 4,
      h: 2,
      x: 0,
      y: 7,
      i: "equity",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 0,
      y: 12,
      i: "cashReturn",
      moved: false,
      static: false,
    },
    {
      w: 4,
      h: 4,
      x: 0,
      y: 0,
      i: "cashFlow",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 2,
      y: 11,
      i: "occupancy",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 2,
      y: 12,
      i: "capRate",
      moved: false,
      static: false,
    },
  ],
  xxs: [
    {
      w: 2,
      h: 1,
      x: 0,
      y: 14,
      i: "map",
      moved: false,
      static: false,
    },
    {
      w: 1,
      h: 1,
      x: 0,
      y: 0,
      i: "properties",
      moved: false,
      static: false,
    },
    {
      w: 1,
      h: 1,
      x: 1,
      y: 0,
      i: "tenants",
      moved: false,
      static: false,
    },
    {
      w: 1,
      h: 1,
      x: 0,
      y: 1,
      i: "tasks",
      moved: false,
      static: false,
    },
    {
      w: 1,
      h: 1,
      x: 1,
      y: 1,
      i: "unreadNotifications",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 0,
      y: 2,
      i: "pastDueAccounts",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 0,
      y: 3,
      i: "marketValueRent",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 0,
      y: 5,
      i: "equity",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 2,
      x: 0,
      y: 7,
      i: "cashReturn",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 1,
      x: 0,
      y: 15,
      i: "nextProperty",
      moved: false,
      static: false,
    },
    {
      w: 2,
      h: 4,
      x: 0,
      y: 10,
      i: "cashFlow",
      moved: false,
      static: false,
    },
    {
      w: 1,
      h: 1,
      x: 0,
      y: 9,
      i: "occupancy",
      moved: false,
      static: false,
    },
    {
      w: 1,
      h: 1,
      x: 1,
      y: 9,
      i: "capRate",
      moved: false,
      static: false,
    },
  ],
};

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const { state } = useLocation();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const dashboardLayout = useSelector(({ dashboardLayout }) => dashboardLayout);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("All");
  const [isCustomizable, setIsCustomizable] = useState(false);
  const allPortfolio = useSelector(({ allPortfolioList }) => allPortfolioList);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const [properties, setProperties] = useState([]);
  const [items, setItems] = useState(originalItems);
  const [layouts, setLayouts] = useState(initialLayouts);

  const [cashflowData, setCashflowData] = useState([]);
  const [show, setShow] = useState(false);
  //   const [layouts, setLayouts] = useState(getFromLS("layouts") || initialLayouts);
  const date = new Date();
  const startDate = new Date(date.getFullYear() - 1, date.getMonth(), 1).toLocaleDateString("sv");
  const endDate = new Date(date.getFullYear(), date.getMonth(), 0).toLocaleDateString("sv");

  const months = getMonthBetweenDates(startDate, endDate);

  useEffect(() => {
    if (allPortfolio?.length) {
      updateDashboardData();
      getCashflowData();
    }
  }, [selectedPortfolioId, allProperties, allPortfolio]);

  const getCashflowData = async () => {
    const params = {
      userId: loggedUserData.id,
      startDate,
      endDate,
      ...(selectedPortfolioId !== "All" && { portfolioId: selectedPortfolioId }),
    };

    const data = await getRdsFN("cashFlow", params);

    const gData = months.map((m) => {
      return {
        name: m,
        income: 0,
        maintenance: 0,
        insurance: 0,
        tax: 0,
        mortgage: 0,
        admin_misc: 0,
        capital_expenses: 0,
        hoa: 0,
        management_fee: 0,
        utility: 0,
        cashflow: 0,
        uncategorized: 0,
      };
    });

    data.map((d) => {
      const mon = moment(d?.date).format("MMM YY");
      const idx = gData.findIndex((g) => g.name === mon);
      if (idx !== -1) {
        if (d?.is_cf_income) {
          gData[idx].income += parseFloat(d?.amount);
        } else if (d?.is_cf_maintenance) {
          gData[idx].maintenance = -(Math.abs(gData[idx].maintenance) + parseFloat(d?.amount));
        } else if (d?.is_cf_insurance) {
          gData[idx].insurance = -(Math.abs(gData[idx].insurance) + parseFloat(d?.amount));
        } else if (d?.is_cf_property_tax) {
          gData[idx].tax = -(Math.abs(gData[idx].tax) + parseFloat(d?.amount));
        } else if (d?.is_cf_mortgage) {
          gData[idx].mortgage = -(Math.abs(gData[idx].mortgage) + parseFloat(d?.amount));
        } else if (d?.is_cf_admin_misc || d?.is_cf_hoa) {
          gData[idx].admin_misc = -(Math.abs(gData[idx].admin_misc) + parseFloat(d?.amount));
        } else if (d?.is_cf_capital_expenses) {
          gData[idx].capital_expenses = -(Math.abs(gData[idx].capital_expenses) + parseFloat(d?.amount));
        } else if (d?.is_cf_management_fee) {
          gData[idx].management_fee = -(Math.abs(gData[idx].management_fee) + parseFloat(d?.amount));
        } else if (d?.is_cf_utility) {
          gData[idx].utility = -(Math.abs(gData[idx].utility) + parseFloat(d?.amount));
        } else if (!d?.category) {
          gData[idx].uncategorized += d?.is_paid ? -parseFloat(d?.amount) : parseFloat(d?.amount);
        }

        if (d?.is_cf_income) {
          gData[idx].cashflow += parseFloat(d?.amount);
        } else if (!d?.category) {
          gData[idx].cashflow += d?.is_paid ? -parseFloat(d?.amount) : parseFloat(d?.amount);
        } else if (d?.expense) {
          gData[idx].cashflow -= Math.abs(parseFloat(d?.amount));
          // gData[idx].cashflow += d?.is_paid ? -parseFloat(d?.amount) : parseFloat(d?.amount);
        } else {
        }
      }
    });
    setCashflowData(gData);
  };

  useEffect(() => {
    if (dashboardLayout?.id) {
      setLayouts(JSON.parse(dashboardLayout?.data));
    } else {
      setLayouts(initialLayouts);
    }
  }, [dashboardLayout]);

  const updateDashboardData = async () => {
    if (allPortfolio) {
      let ids = [];
      if (selectedPortfolioId === "All") {
        ids = allPortfolio?.map(({ id }) => id);
        setProperties(allPortfolio);
      } else {
        ids = [selectedPortfolioId];
        const filteredProperties = allPortfolio?.filter((p) => p?.portfolio_id === selectedPortfolioId);
        setProperties(filteredProperties);
      }
      await dispatch(fetchDashboardLayout());
      await dispatch(fetchDashboardData(ids));
    }
  };

  const onLayoutChange = (_, allLayouts) => {
    setLayouts(allLayouts);
  };

  const onLayoutSave = async () => {
    try {
      dispatch(setLoading(true));
      let res;
      if (dashboardLayout?.id) {
        res = await updateRecordTB("UserDashboard", {
          id: dashboardLayout?.id,
          updated_by: loggedUserData?.id,
          data: JSON.stringify(layouts),
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      } else {
        res = await createRecordTB("UserDashboard", {
          id: getId(),
          created_by: loggedUserData?.id,
          updated_by: loggedUserData?.id,
          data: JSON.stringify(layouts),
          active: 1,
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      }
      dispatch(setLoading(false));
    } catch (err) {
      dispatch(setLoading(false));
    }

    // saveToLS("layouts", layouts);
  };
  const onRemoveItem = (itemId) => {
    setItems(items.filter((i) => i !== itemId));
  };
  const onAddItem = (itemId) => {
    setItems([...items, itemId]);
  };

  return (
    <>
      {/* <TopBar
        onLayoutSave={onLayoutSave}
        items={items}
        onRemoveItem={onRemoveItem}
        onAddItem={onAddItem}
        originalItems={originalItems}
      /> */}
      <div className="mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
        <PortfolioDropDown selectedPortfolioId={selectedPortfolioId} setSelectedPortfolioId={setSelectedPortfolioId} />
        <div className="properties-filter d-flex justify-content-between">
          {isCustomizable && (
            <AppButton
              type="button"
              classes="no-img mx-1 ms-lg-3 btn-reset w-50"
              title={"Cancel"}
              onClick={async () => {
                setIsCustomizable(false);
              }}
            />
          )}
          <AppButton
            type="button"
            classes={`no-img mx-1  ms-lg-3 ${isCustomizable ? "w-50" : "w-100"}`}
            title={isCustomizable ? "Save" : "Customize Dashboard"}
            onClick={async () => {
              if (isCustomizable) {
                await onLayoutSave();
              }
              setIsCustomizable(!isCustomizable);
            }}
          />
        </div>
      </div>
      <SizeMe refreshRate={32} refreshMode="debounce">
        {({ size: { width } }) => (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 996, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 14, md: 14, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={90}
            width={width}
            onLayoutChange={onLayoutChange}
            isDraggable={isCustomizable}
            isResizable={isCustomizable}
          >
            {items.map((key) => {
              // if(width){
              //   if(width >= 996){

              //   }
              // }
              return (
                <div
                  key={key}
                  className="widget"
                  style={{
                    cursor: isCustomizable ? "grab" : "auto",
                    display: key === "map" || key === "nextProperty" ? "none" : "block",
                    position: "relative",
                  }}
                  data-grid={{ w: 3, h: 1, x: 0, y: Infinity }}
                >
                  <Widget
                    id={key}
                    onRemoveItem={onRemoveItem}
                    backgroundColor="#000"
                    properties={properties}
                    selectedPortfolioId={selectedPortfolioId}
                    layout={{ elem: key, width, height: 90 }}
                    cashflowData={key === "cashFlow" ? cashflowData : []}
                  />
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </SizeMe>
      {(state?.isOpen || show) && <AppleStoreModel setShow={setShow} show={show} />}
      <FlowHelp onClick={() => setShow(true)} />
    </>
  );
}

function getFromLS(key) {
  let ls = {};
  if (global.localStorage) {
    try {
      ls = JSON.parse(global.localStorage.getItem("rgl-8")) || {};
    } catch (e) {}
  }
  return ls[key];
}

function saveToLS(key, value) {
  if (global.localStorage) {
    global.localStorage.setItem(
      "rgl-8",
      JSON.stringify({
        [key]: value,
      })
    );
  }
}
