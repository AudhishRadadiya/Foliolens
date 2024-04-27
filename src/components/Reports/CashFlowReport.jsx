import React from "react";
import moment from "moment";
import { Table } from "react-bootstrap";

const getMonthBetweenDates = (startDate, endDate) => {
  const months = [];
  let formattedStartDate = moment(startDate);
  let formattedEndDate = moment(endDate);
  if (formattedStartDate < formattedEndDate) {
    var date = formattedStartDate.startOf("month");

    while (date < formattedEndDate.endOf("month")) {
      months.push(date.format("YYYY-MM"));
      date.add(1, "month");
    }
  }
  return months;
};

const sliceArrayIntoChunks = (arr, chunkSize) => {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
};

const formatMoney = (amount) => {
  if (!amount) {
    return "$0.00";
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    return "$0.00";
  }
  var absAmt = Math.abs(parsedAmount);
  const formattedValue =
    absAmt.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      style: "currency",
      currency: "USD",
    }) || 0;

  return parsedAmount < 0 ? "(" + formattedValue + ")" : formattedValue;
};

export default function CashFlowReport(props) {
  const { data, startDate, endDate } = props;

  data?.sort((a, b) => parseInt(new Date(a?.date).getTime()) - parseInt(new Date(b?.date).getTime()));

  const transactionMonths = getMonthBetweenDates(startDate, endDate);
  let currentYear = [];
  let lastYear = [];
  if (transactionMonths.length >= 24) {
    const months = [...transactionMonths];
    months.reverse();
    [currentYear, lastYear] = sliceArrayIntoChunks(months, 12);
  }

  const availableCategories = {
    income: {},
    expense: {},
    is_administration_misc: {},
    is_insurance: {},
    is_maintenance_repairs: {},
    is_tax: {},
    is_management_fee: {},
    is_professional_due: {},
    is_utilities: {},
    is_transfer: {},
    is_uncategorized: {},
    is_mortgage: {},
    is_capital_expenses: {},
  };

  const incomeSummary = {};
  // let incomeTransactions = {};

  const administrationMiscSummary = {};
  const insuranceSummary = {};
  const maintenanceSummary = {};
  const taxesSummary = {};
  const managementFeesSummary = {};
  const legalProfessionalSummary = {};
  const utilitiesSummary = {};
  const uncategorizedSummary = {};

  const mortgageSummary = {};
  const capitalSummary = {};

  const transferSummary = {};

  // let administrationMiscTransactions = {};
  // let insuranceTransactions = {};
  // let maintenanceTransactions = {};
  // let taxesTransactions = {};
  // let managementFeesTransactions = {};
  // let legalProfessionalTransactions = {};
  // let utilitiesTransactions = {};

  // let expenseTransactions = {};
  // let operatingIncomeTransactions = {};
  // let uncategorizedTransactions = {};

  // let mortgageTransactions = {};
  // let capitalTransactions = {};
  // let netCashFlowTransactions = {};
  // let transferTransactions = {};

  const totalIncome = [];
  const totalOperatingExpenses = [];
  const totalNetOperatingIncome = [];
  const totalTransfer = [];
  const totalUncategorized = [];

  const totalRent = [];
  const totalOtherIncome = [];
  const totalMisc = [];

  const totalAdminOther = [];
  const totalRepair = [];
  const totalManagement = [];
  const totalLegal = [];
  const totalUtility = [];

  const totalNetCashFlow = [];
  const totalMortgages = [];
  const totalCapital = [];

  let currentYearIncome = 0;
  let lastYearIncome = 0;

  transactionMonths.map((m) => {
    const chartMonth = moment(m).format("M/YY");
    const data = { x: chartMonth, y: 0 };
    totalIncome.push(data);
    totalOperatingExpenses.push(data);
    totalNetOperatingIncome.push(data);
    totalTransfer.push(data);
    totalUncategorized.push(data);

    totalRent.push(data);
    totalOtherIncome.push(data);
    totalMisc.push(data);

    totalAdminOther.push(data);
    totalRepair.push(data);
    totalManagement.push(data);
    totalLegal.push(data);
    totalUtility.push(data);

    totalMortgages.push(data);
    totalCapital.push(data);
    totalNetCashFlow.push(data);
  });

  data?.map((t) => {
    const key = moment(t?.date).format("YYYY-MM");
    const chartMonth = moment(t?.date).format("M/YY");

    let category = t?.category;
    let amount = parseFloat(t?.amount);

    if (t?.income === 1) {
      const findIndexTotalIncome = totalIncome.findIndex((i) => i?.x === chartMonth);

      if (findIndexTotalIncome !== -1) {
        totalIncome[findIndexTotalIncome] = {
          ...totalIncome[findIndexTotalIncome],
          y: parseInt(totalIncome[findIndexTotalIncome]["y"]) + amount,
        };
      } else {
        totalIncome.push({
          x: chartMonth,
          y: amount,
        });
      }

      if (t?.is_rent === 1) {
        const findIndex = totalRent.findIndex((i) => i?.x === chartMonth);
        if (findIndex !== -1) {
          totalRent[findIndex] = {
            ...totalRent[findIndex],
            y: parseInt(totalRent[findIndex]["y"]) + amount,
          };
        } else {
          totalRent.push({
            x: chartMonth,
            y: amount,
          });
        }
      }

      if (t?.is_misc_interest === 1) {
        const findIndex = totalMisc.findIndex((i) => i?.x === chartMonth);
        if (findIndex !== -1) {
          totalMisc[findIndex] = {
            ...totalMisc[findIndex],
            y: parseInt(totalMisc[findIndex]["y"]) + amount,
          };
        } else {
          totalMisc.push({
            x: chartMonth,
            y: amount,
          });
        }
      }

      availableCategories["income"][t?.transaction_category_id] = category;
      if (t?.is_rent !== 1 && t?.is_misc_interest !== 1) {
        const findIndex = totalOtherIncome.findIndex((i) => i?.x === chartMonth);
        if (findIndex !== -1) {
          totalOtherIncome[findIndex] = {
            ...totalOtherIncome[findIndex],
            y: parseInt(totalOtherIncome[findIndex]["y"]) + amount,
          };
        } else {
          totalOtherIncome.push({
            x: chartMonth,
            y: amount,
          });
        }
      }

      if (incomeSummary[key]) {
        if (incomeSummary[key][t?.transaction_category_id]) {
          incomeSummary[key][t?.transaction_category_id]["amount"] =
            incomeSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          incomeSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        incomeSummary[key]["total"]["amount"] = incomeSummary[key]["total"]["amount"] + amount;
      } else {
        incomeSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
            category: "Total Income",
          },
        };
      }
    }

    if (t?.expense === 1) {
      const findIndexExpense = totalOperatingExpenses.findIndex((i) => i?.x === chartMonth);

      if (findIndexExpense !== -1) {
        totalOperatingExpenses[findIndexExpense] = {
          ...totalOperatingExpenses[findIndexExpense],
          y: parseInt(totalOperatingExpenses[findIndexExpense]["y"]) + amount,
        };
      } else {
        totalOperatingExpenses.push({
          x: chartMonth,
          y: amount,
        });
      }
    }

    if (t?.is_administration_misc === 1) {
      const findIndex = totalAdminOther.findIndex((i) => i?.x === chartMonth);
      if (findIndex !== -1) {
        totalAdminOther[findIndex] = {
          ...totalAdminOther[findIndex],
          y: parseInt(totalAdminOther[findIndex]["y"]) + amount,
        };
      } else {
        totalAdminOther.push({
          x: chartMonth,
          y: amount,
        });
      }
      availableCategories["is_administration_misc"][t?.transaction_category_id] = category;
      if (administrationMiscSummary[key]) {
        if (administrationMiscSummary[key][t?.transaction_category_id]) {
          administrationMiscSummary[key][t?.transaction_category_id]["amount"] =
            administrationMiscSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          administrationMiscSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        administrationMiscSummary[key]["total"]["amount"] = administrationMiscSummary[key]["total"]["amount"] + amount;
      } else {
        administrationMiscSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      // administrationMiscTransactions
    }

    if (t?.is_insurance === 1) {
      availableCategories["is_insurance"][t?.transaction_category_id] = category;
      if (insuranceSummary[key]) {
        if (insuranceSummary[key][t?.transaction_category_id]) {
          insuranceSummary[key][t?.transaction_category_id]["amount"] =
            insuranceSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          insuranceSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        insuranceSummary[key]["total"]["amount"] = insuranceSummary[key]["total"]["amount"] + amount;
      } else {
        insuranceSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      //insuranceTransactions
    }

    if (t?.is_maintenance_repairs === 1) {
      const findIndex = totalRepair.findIndex((i) => i?.x === chartMonth);
      if (findIndex !== -1) {
        totalRepair[findIndex] = {
          ...totalRepair[findIndex],
          y: parseInt(totalRepair[findIndex]["y"]) + amount,
        };
      } else {
        totalRepair.push({
          x: chartMonth,
          y: amount,
        });
      }
      availableCategories["is_maintenance_repairs"][t?.transaction_category_id] = category;
      if (maintenanceSummary[key]) {
        if (maintenanceSummary[key][t?.transaction_category_id]) {
          maintenanceSummary[key][t?.transaction_category_id]["amount"] =
            maintenanceSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          maintenanceSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        maintenanceSummary[key]["total"]["amount"] = maintenanceSummary[key]["total"]["amount"] + amount;
      } else {
        maintenanceSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      //maintenanceTransactions
    }

    if (t?.is_property_tax === 1 || t?.is_other_tax === 1) {
      availableCategories["is_tax"][t?.transaction_category_id] = category;

      if (taxesSummary[key]) {
        if (taxesSummary[key][t?.transaction_category_id]) {
          taxesSummary[key][t?.transaction_category_id]["amount"] =
            taxesSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          taxesSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        taxesSummary[key]["total"]["amount"] = taxesSummary[key]["total"]["amount"] + amount;
      } else {
        taxesSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      //taxesTransactions
    }

    if (t?.is_management_fee === 1) {
      const findIndex = totalManagement.findIndex((i) => i?.x === chartMonth);
      if (findIndex !== -1) {
        totalManagement[findIndex] = {
          ...totalManagement[findIndex],
          y: parseInt(totalManagement[findIndex]["y"]) + amount,
        };
      } else {
        totalManagement.push({
          x: chartMonth,
          y: amount,
        });
      }
      availableCategories["is_management_fee"][t?.transaction_category_id] = category;

      if (managementFeesSummary[key]) {
        if (managementFeesSummary[key][t?.transaction_category_id]) {
          managementFeesSummary[key][t?.transaction_category_id]["amount"] =
            managementFeesSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          managementFeesSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        managementFeesSummary[key]["total"]["amount"] = managementFeesSummary[key]["total"]["amount"] + amount;
      } else {
        managementFeesSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      // managementFeesTransactions
    }

    if (t?.is_professional_due === 1) {
      const findIndex = totalLegal.findIndex((i) => i?.x === chartMonth);
      if (findIndex !== -1) {
        totalLegal[findIndex] = {
          ...totalLegal[findIndex],
          y: parseInt(totalLegal[findIndex]["y"]) + amount,
        };
      } else {
        totalLegal.push({
          x: chartMonth,
          y: amount,
        });
      }
      availableCategories["is_professional_due"][t?.transaction_category_id] = category;

      if (legalProfessionalSummary[key]) {
        if (legalProfessionalSummary[key][t?.transaction_category_id]) {
          legalProfessionalSummary[key][t?.transaction_category_id]["amount"] =
            legalProfessionalSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          legalProfessionalSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        legalProfessionalSummary[key]["total"]["amount"] = legalProfessionalSummary[key]["total"]["amount"] + amount;
      } else {
        legalProfessionalSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      //legalProfessionalTransaction
    }

    if (t?.is_utilities === 1) {
      const findIndex = totalUtility.findIndex((i) => i?.x === chartMonth);
      if (findIndex !== -1) {
        totalUtility[findIndex] = {
          ...totalUtility[findIndex],
          y: parseInt(totalUtility[findIndex]["y"]) + amount,
        };
      } else {
        totalUtility.push({
          x: chartMonth,
          y: amount,
        });
      }
      availableCategories["is_utilities"][t?.transaction_category_id] = category;

      if (utilitiesSummary[key]) {
        if (utilitiesSummary[key][t?.transaction_category_id]) {
          utilitiesSummary[key][t?.transaction_category_id]["amount"] =
            utilitiesSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          utilitiesSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        utilitiesSummary[key]["total"]["amount"] = utilitiesSummary[key]["total"]["amount"] + amount;
      } else {
        utilitiesSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      // utilitiesTransactions
    }
    if (t?.is_mortgage === 1) {
      const findIndex = totalMortgages.findIndex((i) => i?.x === chartMonth);
      if (findIndex !== -1) {
        totalMortgages[findIndex] = {
          ...totalMortgages[findIndex],
          y: parseInt(totalMortgages[findIndex]["y"]) + amount,
        };
      } else {
        totalMortgages.push({
          x: chartMonth,
          y: amount,
        });
      }
      availableCategories["is_mortgage"][t?.transaction_category_id] = category;

      if (mortgageSummary[key]) {
        if (mortgageSummary[key][t?.transaction_category_id]) {
          mortgageSummary[key][t?.transaction_category_id]["amount"] =
            mortgageSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          mortgageSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        mortgageSummary[key]["total"]["amount"] = mortgageSummary[key]["total"]["amount"] + amount;
      } else {
        mortgageSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      // mortgageTransactions
    }

    if (t?.is_capital_expenses === 1) {
      const findIndex = totalCapital.findIndex((i) => i?.x === chartMonth);
      if (findIndex !== -1) {
        totalCapital[findIndex] = {
          ...totalCapital[findIndex],
          y: parseInt(totalCapital[findIndex]["y"]) + amount,
        };
      } else {
        totalCapital.push({
          x: chartMonth,
          y: amount,
        });
      }
      availableCategories["is_capital_expenses"][t?.transaction_category_id] = category;

      if (capitalSummary[key]) {
        if (capitalSummary[key][t?.transaction_category_id]) {
          capitalSummary[key][t?.transaction_category_id]["amount"] =
            capitalSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          capitalSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        capitalSummary[key]["total"]["amount"] = capitalSummary[key]["total"]["amount"] + amount;
      } else {
        capitalSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      // capitalTransactions
    }

    if (t?.is_transfer === 1) {
      const findIndexTransfer = totalTransfer.findIndex((i) => i?.x === chartMonth);

      if (findIndexTransfer !== -1) {
        totalTransfer[findIndexTransfer] = {
          ...totalTransfer[findIndexTransfer],
          y: parseInt(totalTransfer[findIndexTransfer]["y"]) + amount,
        };
      } else {
        totalTransfer.push({
          x: chartMonth,
          y: amount,
        });
      }
      availableCategories["is_transfer"][t?.transaction_category_id] = category;

      if (transferSummary[key]) {
        if (transferSummary[key][t?.transaction_category_id]) {
          transferSummary[key][t?.transaction_category_id]["amount"] =
            transferSummary[key][t?.transaction_category_id]["amount"] + amount;
        } else {
          transferSummary[key][t?.transaction_category_id] = {
            amount: amount,
            category: category,
          };
        }
        transferSummary[key]["total"]["amount"] = transferSummary[key]["total"]["amount"] + amount;
      } else {
        transferSummary[key] = {
          [t?.transaction_category_id]: {
            amount: amount,
            category: category,
          },
          total: {
            amount: amount,
          },
        };
      }
      // transferTransactions
    }

    if (!t?.transaction_category_id) {
      availableCategories["is_uncategorized"]["total"] = category;

      const findIndexUncategorized = totalUncategorized.findIndex((i) => i?.x === chartMonth);

      if (findIndexUncategorized !== -1) {
        totalUncategorized[findIndexUncategorized] = {
          ...totalUncategorized[findIndexUncategorized],
          y: parseInt(totalUncategorized[findIndexUncategorized]["y"]) + amount,
        };
      } else {
        totalUncategorized.push({
          x: chartMonth,
          y: amount,
        });
      }

      if (uncategorizedSummary[key]) {
        uncategorizedSummary[key]["total"]["amount"] = uncategorizedSummary[key]["total"]["amount"] + amount;
      } else {
        uncategorizedSummary[key] = {
          total: {
            amount: amount,
          },
        };
      }
      // uncategorizedTransactions
    }
  });

  availableCategories["income"]["total"] = "Total Income";
  availableCategories["is_administration_misc"]["total"] = "Total Admin & Other";
  availableCategories["is_insurance"]["total"] = "Total Insurance";
  availableCategories["is_maintenance_repairs"]["total"] = "Total Repairs & Maintenance";
  availableCategories["is_tax"]["total"] = "Total Taxes";
  availableCategories["is_management_fee"]["total"] = "Total Management Fees";
  availableCategories["is_professional_due"]["total"] = "Total Legal & Professional";
  availableCategories["is_utilities"]["total"] = "Total Utilities";
  availableCategories["is_transfer"]["total"] = "Total Transfers";
  availableCategories["is_uncategorized"]["total"] = "Uncategorized Transactions";
  availableCategories["expense"]["total"] = "Total Operating Expenses";
  availableCategories["is_mortgage"]["total"] = "Total Mortgages & Loans";
  availableCategories["is_capital_expenses"]["total"] = "Total Capital Expenses";

  let operatingExpenseTransaction = {};
  const income = {};
  const administrationMiscTransaction = {};
  const insuranceTransaction = {};
  const maintenanceTransaction = {};
  const managementFeesTransaction = {};
  const taxesTransaction = {};
  const legalProfessionalTransaction = {};
  const utilitiesTransaction = {};
  const transferTransaction = {};
  const uncategorizedTransaction = {};
  const mortgageTransaction = {};
  const capitalTransaction = {};
  const netOperatingIncomeTransaction = {
    "Net operating Income": [],
  };
  const netCashFlowTransaction = {
    "Net Cash Flow": [],
  };

  Object.values(availableCategories["expense"]).map((i) => {
    operatingExpenseTransaction[i] = [];
  });

  Object.values(availableCategories["income"]).map((i) => {
    income[i] = [];
  });

  Object.values(availableCategories["is_administration_misc"]).map((i) => {
    administrationMiscTransaction[i] = [];
  });

  Object.values(availableCategories["is_insurance"]).map((i) => {
    insuranceTransaction[i] = [];
  });

  Object.values(availableCategories["is_maintenance_repairs"]).map((i) => {
    maintenanceTransaction[i] = [];
  });

  Object.values(availableCategories["is_management_fee"]).map((i) => {
    managementFeesTransaction[i] = [];
  });

  Object.values(availableCategories["is_tax"]).map((i) => {
    taxesTransaction[i] = [];
  });

  Object.values(availableCategories["is_professional_due"]).map((i) => {
    legalProfessionalTransaction[i] = [];
  });

  Object.values(availableCategories["is_utilities"]).map((i) => {
    utilitiesTransaction[i] = [];
  });

  Object.values(availableCategories["is_transfer"]).map((i) => {
    transferTransaction[i] = [];
  });

  Object.values(availableCategories["is_uncategorized"]).map((i) => {
    uncategorizedTransaction[i] = [];
  });

  Object.values(availableCategories["is_mortgage"]).map((i) => {
    mortgageTransaction[i] = [];
  });

  Object.values(availableCategories["is_capital_expenses"]).map((i) => {
    capitalTransaction[i] = [];
  });

  transactionMonths?.map((m) => {
    Object.entries(availableCategories["income"])?.map((key) => {
      if (!incomeSummary[m]) {
        income[key[1]]?.push("-");
      } else {
        income[key[1]]?.push(incomeSummary[m][key[0]] ? formatMoney(incomeSummary[m][key[0]]["amount"]) : "-");
      }
    });

    Object.entries(availableCategories["is_administration_misc"])?.map((key) => {
      if (!administrationMiscSummary[m]) {
        administrationMiscTransaction[key[1]]?.push({ [key[0]]: "-" });
      } else {
        administrationMiscTransaction[key[1]]?.push({
          [key[0]]: administrationMiscSummary[m][key[0]]
            ? formatMoney(administrationMiscSummary[m][key[0]]["amount"])
            : "-",
        });
      }
    });

    Object.entries(availableCategories["is_insurance"])?.map((key) => {
      if (!insuranceSummary[m]) {
        insuranceTransaction[key[1]]?.push({ [key[0]]: "-" });
      } else {
        insuranceTransaction[key[1]]?.push({
          [key[0]]: insuranceSummary[m][key[0]] ? formatMoney(insuranceSummary[m][key[0]]["amount"]) : "-",
        });
      }
    });

    Object.entries(availableCategories["is_maintenance_repairs"])?.map((key) => {
      if (!maintenanceSummary[m]) {
        maintenanceTransaction[key[1]]?.push({ [key[0]]: "-" });
      } else {
        maintenanceTransaction[key[1]]?.push({
          [key[0]]: maintenanceSummary[m][key[0]] ? formatMoney(maintenanceSummary[m][key[0]]["amount"]) : "-",
        });
      }
    });

    Object.entries(availableCategories["is_tax"])?.map((key) => {
      if (!taxesSummary[m]) {
        taxesTransaction[key[1]]?.push({ [key[0]]: "-" });
      } else {
        taxesTransaction[key[1]]?.push({
          [key[0]]: taxesSummary[m][key[0]] ? formatMoney(taxesSummary[m][key[0]]["amount"]) : "-",
        });
      }
    });

    Object.entries(availableCategories["is_management_fee"])?.map((key) => {
      if (!managementFeesSummary[m]) {
        managementFeesTransaction[key[1]]?.push({ [key[0]]: "-" });
      } else {
        managementFeesTransaction[key[1]]?.push({
          [key[0]]: managementFeesSummary[m][key[0]] ? formatMoney(managementFeesSummary[m][key[0]]["amount"]) : "-",
        });
      }
    });

    Object.entries(availableCategories["is_professional_due"])?.map((key) => {
      if (!legalProfessionalSummary[m]) {
        legalProfessionalTransaction[key[1]]?.push({ [key[0]]: "-" });
      } else {
        legalProfessionalTransaction[key[1]]?.push({
          [key[0]]: legalProfessionalSummary[m][key[0]]
            ? formatMoney(legalProfessionalSummary[m][key[0]]["amount"])
            : "-",
        });
      }
    });

    Object.entries(availableCategories["is_utilities"])?.map((key) => {
      if (!utilitiesSummary[m]) {
        utilitiesTransaction[key[1]]?.push({ [key[0]]: "-" });
      } else {
        utilitiesTransaction[key[1]]?.push({
          [key[0]]: utilitiesSummary[m][key[0]] ? formatMoney(utilitiesSummary[m][key[0]]["amount"]) : "-",
        });
      }
    });

    Object.entries(availableCategories["is_transfer"])?.map((key) => {
      if (!transferSummary[m]) {
        transferTransaction[key[1]]?.push("-");
      } else {
        transferTransaction[key[1]]?.push(
          transferSummary[m][key[0]] ? formatMoney(transferSummary[m][key[0]]["amount"]) : "-"
        );
      }
    });

    Object.entries(availableCategories["is_uncategorized"])?.map((key) => {
      if (!uncategorizedSummary[m]) {
        uncategorizedTransaction[key[1]]?.push({ [key[0]]: "-" });
      } else {
        uncategorizedTransaction[key[1]]?.push({
          [key[0]]: uncategorizedSummary[m][key[0]] ? formatMoney(uncategorizedSummary[m][key[0]]["amount"]) : "-",
        });
      }
    });

    Object.entries(availableCategories["is_mortgage"])?.map((key) => {
      if (!mortgageSummary[m]) {
        mortgageTransaction[key[1]]?.push("-");
      } else {
        mortgageTransaction[key[1]]?.push(
          mortgageSummary[m][key[0]] ? formatMoney(mortgageSummary[m][key[0]]["amount"]) : "-"
        );
      }
    });

    Object.entries(availableCategories["is_capital_expenses"])?.map((key) => {
      if (!capitalSummary[m]) {
        capitalTransaction[key[1]]?.push("-");
      } else {
        capitalTransaction[key[1]]?.push(
          capitalSummary[m][key[0]] ? formatMoney(capitalSummary[m][key[0]]["amount"]) : "-"
        );
      }
    });
  });

  // const Transfers = [{ data: transferTransaction, c: "is_transfer" }];
  // infinity loop, so not store in state

  transactionMonths?.map((m, i) => {
    const currentIndex = i + 1;
    const month = moment(m).format("M/YY");
    const findIncome = totalIncome?.find((i) => i?.x === month);
    const findExpense = totalOperatingExpenses?.find((i) => i?.x === month);
    const findTransfer = totalTransfer?.find((i) => i?.x === month);
    const findUncategorized = totalUncategorized?.find((i) => i?.x === month);

    const dataObj = {
      x: month,
      y: 0,
    };

    const netIncomeObj = { ...dataObj };
    if (!findTransfer) {
      totalTransfer.splice(currentIndex, 0, dataObj);
    }
    if (!findUncategorized) {
      totalUncategorized.splice(currentIndex, 0, dataObj);
    }
    if (findIncome) {
      netIncomeObj["y"] = netIncomeObj["y"] + parseFloat(findIncome?.y);
    } else {
      totalIncome.splice(currentIndex, 0, netIncomeObj);
    }
    if (findExpense) {
      netIncomeObj["y"] = netIncomeObj["y"] - parseFloat(findExpense?.y);
    } else {
      totalOperatingExpenses.splice(currentIndex, 0, netIncomeObj);
    }
    // expenseTransactions = {
    //   ...expenseTransactions,
    //   [m]: { total: findExpense ? formatMoney(findExpense?.y) : "-" },
    // };

    Object.entries(availableCategories["expense"])?.map((key) => {
      if (!findExpense?.y) {
        operatingExpenseTransaction[key[1]]?.push({ [key[0]]: "$0.00" });
      } else {
        operatingExpenseTransaction[key[1]]?.push({ [key[0]]: findExpense ? formatMoney(findExpense?.y) : "$0.00" });
      }
    });

    // operatingIncomeTransactions = {
    //   ...operatingIncomeTransactions,
    //   [m]: { total: netIncomeObj?.y ? formatMoney(netIncomeObj?.y) : "$0.00" },
    // };

    if (!netIncomeObj?.y) {
      netOperatingIncomeTransaction["Net operating Income"]?.push("$0.00");
    } else {
      netOperatingIncomeTransaction["Net operating Income"]?.push(
        netIncomeObj ? formatMoney(netIncomeObj?.y) : "$0.00"
      );
    }

    if (currentYear.includes(m)) {
      currentYearIncome += netIncomeObj?.y ? netIncomeObj?.y : 0;
    }
    if (lastYear.includes(m)) {
      lastYearIncome += netIncomeObj?.y ? netIncomeObj?.y : 0;
    }
    totalNetOperatingIncome.push(netIncomeObj);

    const findRent = totalRent?.find((i) => i?.x === month);
    const findOtherIncome = totalOtherIncome?.find((i) => i?.x === month);
    const findMisc = totalMisc?.find((i) => i?.x === month);

    if (!findRent) {
      totalRent.splice(currentIndex, 0, dataObj);
    }
    if (!findOtherIncome) {
      totalOtherIncome.splice(currentIndex, 0, dataObj);
    }
    if (!findMisc) {
      totalMisc.splice(currentIndex, 0, dataObj);
    }

    const findAdminOther = totalAdminOther?.find((i) => i?.x === month);
    const findRepair = totalRepair?.find((i) => i?.x === month);
    const findManagement = totalManagement?.find((i) => i?.x === month);
    const findLegal = totalLegal?.find((i) => i?.x === month);
    const findUtility = totalUtility?.find((i) => i?.x === month);

    if (!findAdminOther) {
      totalAdminOther.splice(currentIndex, 0, dataObj);
    }
    if (!findRepair) {
      totalRepair.splice(currentIndex, 0, dataObj);
    }
    if (!findManagement) {
      totalManagement.splice(currentIndex, 0, dataObj);
    }
    if (!findLegal) {
      totalLegal.splice(currentIndex, 0, dataObj);
    }
    if (!findUtility) {
      totalUtility.splice(currentIndex, 0, dataObj);
    }

    const findCapital = totalCapital.find((i) => i?.x === month);
    if (!findCapital) {
      totalCapital.splice(currentIndex, 0, dataObj);
    }
    const findMortgage = totalMortgages?.find((i) => i?.x === month);
    if (!findMortgage) {
      totalMortgages.splice(currentIndex, 0, dataObj);
    }
    let netCashFlowAmt = netIncomeObj?.y ? netIncomeObj?.y : 0;
    if (findMortgage) {
      netCashFlowAmt -= findMortgage?.y ? findMortgage?.y : 0;
    }
    if (findCapital) {
      netCashFlowAmt -= findCapital?.y ? findCapital?.y : 0;
    }
    // netCashFlowTransactions = {
    //   ...netCashFlowTransactions,
    //   [m]: { total: netCashFlowAmt ? formatMoney(netCashFlowAmt) : "$0.00" },
    // };

    if (netCashFlowAmt) {
      netCashFlowTransaction["Net Cash Flow"]?.push("$0.00");
    } else {
      netCashFlowTransaction["Net Cash Flow"]?.push(netCashFlowAmt ? formatMoney(netCashFlowAmt) : "$0.00");
    }
  });

  const allExpensesTransactions = [
    { data: administrationMiscTransaction, c: "is_administration_misc" },
    { data: insuranceTransaction, c: "is_insurance" },
    { data: maintenanceTransaction, c: "is_maintenance_repairs" },
    { data: taxesTransaction, c: "is_tax" },
    { data: managementFeesTransaction, c: "is_management_fee" },
    { data: legalProfessionalTransaction, c: "is_professional_due" },
    { data: utilitiesTransaction, c: "is_utilities" },
    { data: operatingExpenseTransaction, c: "expense" },
  ];

  return (
    <div>
      <h3 className="mb-5">Summary</h3>
      <div className="incomeTable">
        <div className="fw-bold mb-3">Income</div>
        <div className="mb-5 expensesTable">
          <Table>
            <thead>
              <tr style={{ borderColor: "#ffffff" }}>
                <th style={{ minWidth: "100px" }}></th>
                {transactionMonths?.map((i) => (
                  <th style={{ minWidth: "100px" }}>{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(income)?.map((item) => {
                return (
                  <tr
                    style={{ background: item.includes("Total Income") && "#E8EDF7", borderColor: "#EDEDED" }}
                    className={`${item?.includes("Total Income") && "fw-bold"}`}
                  >
                    <td>{item}</td>
                    {income[item]?.map((i) => (
                      <td>{i}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </div>

      <div className="incomeTable">
        <div className="fw-bold mb-3">Operating Expenses</div>
        <div className="mb-5 expensesTable">
          <Table>
            <thead>
              <tr style={{ borderColor: "#ffffff" }}>
                <th style={{ minWidth: "200px" }}></th>
                {transactionMonths?.map((i) => (
                  <th style={{ minWidth: "100px" }}>{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allExpensesTransactions?.map(({ data, c }) => {
                return Object.keys(data)?.map((category) => {
                  return (
                    <>
                      <tr
                        style={{
                          backgroundColor:
                            ["Total Operating Expenses", "Total Repairs & Maintenance"].includes(category) && "#E8EDF7",
                          borderColor: "#EDEDED",
                        }}
                      >
                        <td style={{ fontWeight: category?.includes("Total") && "bold" }}>{category}</td>
                        {data[category]?.map((item) =>
                          Object.keys(item).map((value) => (
                            <td style={{ fontWeight: value === "total" && "bold" }}>{item[value]}</td>
                          ))
                        )}
                      </tr>
                    </>
                  );
                });
              })}
              <tr style={{ backgroundColor: "#1646AA", borderColor: "#EDEDED" }}>
                {Object.keys(netOperatingIncomeTransaction)?.map((item) => {
                  return (
                    <>
                      <td style={{ color: "#FFFFFF" }}>{item}</td>
                      {netOperatingIncomeTransaction[item]?.map((income) => (
                        <td style={{ color: "#FFFFFF" }}>{income}</td>
                      ))}
                    </>
                  );
                })}
              </tr>
              {/* <tr style={{ backgroundColor: "#FFEEEE", borderColor: "#EDEDED" }}>
                {Object.keys(uncategorized)?.map((item) => {
                  return (
                    <>
                      <td style={{ fontWeight: "bold" }}>{item}</td>
                      {uncategorized[item]?.map((value) => (
                        <td style={{ fontWeight: "bold" }}>{value.total}</td>
                      ))}
                    </>
                  );
                })}
              </tr> */}
            </tbody>
          </Table>
        </div>
      </div>

      <div className="incomeTable">
        <div className="fw-bold mb-3">Mortgage & Loan Expenses</div>
        <div className="mb-5 expensesTable">
          <Table>
            <thead>
              <tr style={{ borderColor: "#ffffff" }}>
                <th style={{ minWidth: "200px" }}></th>
                {transactionMonths?.map((i) => (
                  <th style={{ minWidth: "100px" }}>{i}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ verticalAlign: "middle" }}>
              {Object.keys(mortgageTransaction)?.map((item) => {
                return (
                  <>
                    <tr
                      style={{
                        background: item.includes("Total Mortgages & Loans") && "#E8EDF7",
                        borderColor: "#EDEDED",
                      }}
                      className={`${item?.includes("Total Mortgages & Loans") && "fw-bold"}`}
                    >
                      <td>{item}</td>
                      {mortgageTransaction[item]?.map((mortgage) => (
                        <td>{mortgage}</td>
                      ))}
                    </tr>
                  </>
                );
              })}
            </tbody>
          </Table>
        </div>
      </div>

      <div className="incomeTable">
        <div className="fw-bold mb-3">Capital Expenses</div>
        <div className="mb-5 expensesTable">
          <Table>
            <thead>
              <tr style={{ borderColor: "#ffffff" }}>
                <th style={{ minWidth: "200px" }}></th>
                {transactionMonths?.map((i) => (
                  <th style={{ minWidth: "100px" }}>{i}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ verticalAlign: "middle" }}>
              {Object.keys(capitalTransaction)?.map((item) => {
                return (
                  <>
                    <tr
                      style={{
                        background: item.includes("Total Capital Expenses") && "#E8EDF7",
                        borderColor: "#EDEDED",
                      }}
                      className={`${item?.includes("Total Capital Expenses") && "fw-bold"}`}
                    >
                      <td>{item}</td>
                      {capitalTransaction[item]?.map((mortgage) => (
                        <td>{mortgage}</td>
                      ))}
                    </tr>
                  </>
                );
              })}
              <tr style={{ backgroundColor: "#4FB980", borderColor: "#EDEDED" }}>
                {Object.keys(netCashFlowTransaction)?.map((item) => {
                  return (
                    <>
                      <td style={{ color: "#FFFFFF" }}>{item}</td>
                      {netCashFlowTransaction[item]?.map((cashFlow) => (
                        <td style={{ color: "#FFFFFF" }}>{cashFlow}</td>
                      ))}
                    </>
                  );
                })}
              </tr>
              <tr style={{ backgroundColor: "#FFEEEE", borderColor: "#EDEDED" }}>
                {Object.keys(uncategorizedTransaction)?.map((item) => {
                  return (
                    <>
                      <td style={{ fontWeight: "bold" }}>{item}</td>
                      {uncategorizedTransaction[item]?.map((value) => (
                        <td style={{ fontWeight: "bold" }}>{value.total}</td>
                      ))}
                    </>
                  );
                })}
              </tr>
            </tbody>
          </Table>
        </div>
      </div>

      <div className="incomeTable">
        <div className="fw-bold mb-3">Transfers</div>
        <div className="mb-5 expensesTable">
          <Table>
            <thead>
              <tr style={{ borderColor: "#ffffff" }}>
                <th style={{ minWidth: "200px" }}></th>
                {transactionMonths?.map((i) => (
                  <th style={{ minWidth: "100px" }}>{i}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ verticalAlign: "middle" }}>
              {Object.keys(transferTransaction)?.map((item) => {
                return (
                  <>
                    <tr
                      style={{
                        background: item.includes("Total Transfers") && "#E8EDF7",
                        borderColor: "#EDEDED",
                      }}
                      className={`${item?.includes("Total Transfers") && "fw-bold"}`}
                    >
                      <td>{item}</td>
                      {transferTransaction[item]?.map((transfer) => (
                        <td>{transfer}</td>
                      ))}
                    </tr>
                  </>
                );
              })}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// function CashFlowReport(props) {
//     const {
//         columns, CashFlowColumns1, CashFlowColumns2, CashFlowColumns3, CashFlowColumns4,
//         data, CashFlowData1, CashFlowData2, CashFlowData3, CashFlowData4,
//         label, CashFlowLabel1, CashFlowLabel2, CashFlowLabel3, CashFlowLabel4 } = props
//     return (
//         <div>
//             {data.length > 0 && <h3 className="mt-5">Summary</h3>}
//             <ReportTable columns={columns} data={data} label={label} />
//             <ReportTable columns={CashFlowColumns1} data={CashFlowData1} label={CashFlowLabel1} />
//             <ReportTable columns={CashFlowColumns3} data={CashFlowData3} label={CashFlowLabel3} />
//             <ReportTable columns={CashFlowColumns4} data={CashFlowData4} label={CashFlowLabel4} />
//             <ReportTable columns={CashFlowColumns2} data={CashFlowData2} label={CashFlowLabel2} />
//         </div>
//     )
// }
