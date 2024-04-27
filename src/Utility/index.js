import { API, Auth, graphqlOperation } from "aws-amplify";
import toast from "react-hot-toast";
import { signOut } from "../graphql/mutations";
import moment from "moment";
import axios from "axios";
import envFile from "../envFile";

export const getCurrentUser = async () => {
  let data = await Auth.currentAuthenticatedUser();
  return data;
};

export const accessToken = async () => {
  const res = await axios.post(
    `${envFile.ACCESS_TOKEN_LINK}`,
    {},
    {
      params: {
        grant_type: "client_credentials",
        client_id: "26fk3pff43bpvh4gfvo73eqo64",
        scope: "apiauthidentifier/add.user",
      },
      headers: {
        Authorization:
          "Basic bHMzNW0zaGNldTAxMWRqbmMydWJncjEwODoxNmpwOWhuOTlrOG90ZGNlYzBjOHYzb2I3dDJobWE3YW9oZ2VxNTJ1ODlwMGQ4ZnVqN280",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return res;
};

export const logOut = async () => {
  try {
    const userData = await getCurrentUser();
    const refreshToken = userData.signInUserSession.refreshToken.token;
    const clientId = userData.pool.clientId;
    await API.graphql(
      graphqlOperation(signOut, {
        clientId: clientId,
        token: refreshToken,
      })
    );
    await Auth.signOut().then(() => {
      localStorage.clear();
      window.location.reload();
    });
  } catch (err) {
    console.log(err, "err signout");
    toast.error("Failed to sign out.");
    window.location.reload();
  }
};

export function getId() {
  return Math.floor(Math.random() * 1000000000) + Math.floor(Math.random() * 10000000);
}

export const epochDateConvert = (epochDate) => {
  const convertDate = new Date(0).setUTCSeconds(epochDate);
  return new Date(convertDate);
};

export const ROLES = {
  PropertyManager: "Property Manager",
  PropertyOwner: "Property Owner",
  Collaborator: "Collaborator",
  Landlord: "Landlord",
};

export const checkSecondUser = (loggedUserData) =>
  loggedUserData?.user_role === "Collaborator" || loggedUserData?.user_role === "Property Owner";

export const checkIsNotSecondUser = (loggedUserData) =>
  loggedUserData?.user_role !== "Collaborator" || loggedUserData?.user_role !== "Property Owner";

export const BUSINESS_TYPES = [
  { name: "Sole proprietorships", value: "soleProprietorship", type: "soleProprietorship" },
  { name: "Unincorporated association", value: "Unincorporated", type: "soleProprietorship" },
  { name: "Trust", value: "Trust", type: "soleProprietorship" },
  { name: "Corporation", value: "Corporation", type: "corporation" },
  { name: "Publicly traded corporations", value: "Publicly traded corporations", type: "corporation" },
  { name: "Non-profits corporations", value: "NonProfitsCorporations", type: "corporation" },
  { name: "Non-profits LLC", value: "NonProfitsLLC", type: "llc" },
  { name: "LLCs", value: "LLCs", type: "llc" },
  { name: "Partnerships, LP's, LLP's", value: "Partnerships", type: "partnership" },
];

export function formatNumber(amount) {
  if (!amount) {
    return 0;
  }
  let parsedAmount = parseNumber(amount);
  return parsedAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export const formatMoney = (amount, paid = false) => {
  const parts = Number(amount)?.toFixed(2)?.split(".");

  if (parts) {
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (amount && paid) {
      return "-" + "$" + integerPart + "." + parts[1];
    } else {
      if (Number(integerPart) < 0) {
        return "-" + "$" + integerPart?.split("-")[1] + "." + parts[1];
      }
      return "$" + integerPart + "." + parts[1];
    }
  }
};

export function formatCurrency(amount, fraction = 0) {
  if (!amount) {
    if (fraction) {
      return "$0.00";
    }
    return "$0";
  }
  let parsedAmount = parseFloat(amount);
  return parsedAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fraction ? fraction : parsedAmount % 1 == 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export const abbrNumber = (num) => {
  const value = Math.round(num);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "USD",
  }).format(value);
};

export const nonDecimalFormat = (amount) => {
  const parts = Number(amount)?.toFixed(2)?.split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return integerPart < 0 ? "$(" + Math.abs(integerPart) + ")" : "$" + integerPart;
};

function parseNumber(num) {
  num = num.toString();
  num = num.replace(/[^.0-9]/g, "");
  num = Number(num);
  if (isNaN(num)) {
    return 0;
  }
  return num;
}

export const PLACES_TYPES = ["address"];

export const formatDate = (date) => {
  if (!date) return "";
  const date1 = date instanceof Date ? date.toDateString() : date.split("T")[0];
  return moment(date1).format("MM/DD/YYYY");
};

export const getPublicIpv4 = async () => {
  const res = await axios.get("https://geolocation-db.com/json/");
  return res.data.IPv4;
};

export const getPortfolioCardColors = (i) => {
  const colors = [
    "#1646AA",
    "#4FB980",
    "#C166B2",
    "#F2A851",
    "#2295AD",
    "#1646AA",
    "#4FB980",
    "#C166B2",
    "#F2A851",
    "#2295AD",
  ];
  return colors[i] ? colors[i] : "#4FB980";
};

export function getMonthBetweenDates(startDate, endDate) {
  const months = [];
  let formattedStartDate = moment(startDate);
  let formattedEndDate = moment(endDate);
  if (formattedStartDate < formattedEndDate) {
    var date = formattedStartDate.startOf("month");

    while (date < formattedEndDate.endOf("month")) {
      months.push(date.format("MMM YY"));
      date.add(1, "month");
    }
  }
  return months;
}
