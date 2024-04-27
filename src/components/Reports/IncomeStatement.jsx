import moment from "moment";
import React, { useEffect, useState } from "react";
import { Col, Row, Table } from "react-bootstrap";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLegend } from "victory";

const colorScale = ["#2445A4", "#8444EC", "#4FB980", "#FFA450", "#FF5050"];
const colorScale2 = ["#FFA450", "#8444EC", "#4FB980"];
const colorScale3 = ["#FFA450", "#8444EC", "#4FB980", "#25D4D4", "#FFE144"];

const IncomeStatement = (props) => {
  let { incomeData, startDate, endDate } = props;

  // data?.sort((a, b) => parseInt(new Date(a?.date).getTime()) - parseInt(new Date(b?.date).getTime()));
  // const [data, setData] = useState();
  const [transactionMonths, setTransactionMonths] = useState();
  const [incomeChartData, setIncomeChartData] = useState([]);
  const [incomeCategoryChart, setIncomeCategoryChart] = useState([]);
  const [expenseCategoryChart, setExpenseCategoryChart] = useState([]);
  const [alertAmount, setAlertAmount] = useState(0);
  const [alertMessage, setAlertMessage] = useState();
  const [operatingIncomeChartRange, setOperatingIncomeChartRange] = useState();
  const [incomeCategoryChartRange, setIncomeCategoryChartRange] = useState();
  const [expenseCategoryChartRange, setExpenseCategoryChartRange] = useState();
  const [operatingExpensesTransaction, setOperatingExpensesTransaction] = useState();
  const [netOperatingIncome, setNetOperatingIncome] = useState({});
  const [income, setIncome] = useState({});
  const [uncategorized, setUncategorized] = useState({});
  const [transfers, setTransfers] = useState();
  const [display, setDisplay] = useState(false);

  const operatingIncomeCategory = [
    { name: "Total Income", symbol: { fill: colorScale[0] } },
    { name: "Total Operating Expenses", symbol: { fill: colorScale[1] } },
    { name: "Net Operating Income", symbol: { fill: colorScale[2] } },
  ];
  const operatingIncomeCategory1 = [
    { name: "Total Transfers", symbol: { fill: colorScale[3] } },
    { name: "Uncategorized Transactions", symbol: { fill: colorScale[4] } },
  ];
  const totalIncomeCategory = [
    { name: "Rents", symbol: { fill: colorScale2[0] } },
    { name: "General income", symbol: { fill: colorScale2[1] } },
    { name: "Misc interest", symbol: { fill: colorScale2[2] } },
  ];
  const expenseCategory = [
    { name: "Admin & Other", symbol: { fill: colorScale3[0] } },
    { name: "Repairs & Maintenance", symbol: { fill: colorScale3[1] } },
    { name: "Management Fees", symbol: { fill: colorScale3[2] } },
  ];
  const expenseCategory1 = [
    { name: "Legal & Professional", symbol: { fill: colorScale3[3] } },
    { name: "Total Utilities", symbol: { fill: colorScale3[4] } },
  ];

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

  function roundToNearest10(number) {
    return Math.ceil(number / 10) * 10;
  }

  function sliceArrayIntoChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
    }
    return res;
  }

  function getMonthBetweenDates(startDate, endDate) {
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
  }

  const generateChartTicks = (start, end, parts) => {
    let oldStart;
    if (start > 0) {
      start = 0;
    }
    if (start < 0) {
      oldStart = start;
    }

    start += Math.ceil(start * 0.1);
    end += Math.ceil(end * 0.1);

    var result = [],
      delta = roundToNearest10((end - start) / (parts - 1));

    while (start < end) {
      result.push(start);
      start += delta;
    }

    result.push(start);
    const isZeroExists = result.includes(0);
    if (!isZeroExists) {
      delta = roundToNearest10((end - oldStart) / (parts - 2));
      start = delta * Math.floor(result[0] / delta);
      result = [];
      while (start < end) {
        result.push(start);
        start += delta;
      }
    }
    return result;
  };

  const numFormatter = (num) => {
    num = Math.round(num);
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  useEffect(() => {
    const sortingData = incomeData?.sort(
      (a, b) => parseInt(new Date(a?.date).getTime()) - parseInt(new Date(b?.date).getTime())
    );
    // setData(sortingData);
    if (sortingData?.length > 0) {
      incomeStatementReport(sortingData);
    }
  }, [incomeData]);

  const incomeStatementReport = (data) => {
    const transactionMonths = getMonthBetweenDates(startDate, endDate);
    setTransactionMonths(transactionMonths);
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

    const transferSummary = {};

    // let administrationMiscTransactions = {};
    // let insuranceTransactions = {};
    // let maintenanceTransactions = {};
    // let taxesTransactions = {};
    // let managementFeesTransactions = {};
    // let legalProfessionalTransactions = {};
    // let utilitiesTransactions = {};

    let expenseTransactions = {};
    let operatingIncomeTransactions = {};
    // let uncategorizedTransactions = {};

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

    let operatingIncomeChartRange = {
      min: 0,
      max: 0,
    };
    let incomeCategoryChartRange = {
      min: 0,
      max: 0,
    };

    let expenseCategoryChartRange = {
      min: 0,
      max: 0,
    };

    let currentYearIncome = 0;
    let lastYearIncome = 0;

    transactionMonths.map((m) => {
      const chartMonth = moment(m).format("MMM YY");
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
    });

    data?.map((t) => {
      const key = moment(t?.date).format("YYYY-MM");
      const chartMonth = moment(t?.date).format("MMM YY");

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
          administrationMiscSummary[key]["total"]["amount"] =
            administrationMiscSummary[key]["total"]["amount"] + amount;
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

    // transactionMonths?.map((m) => {
    //   const income = {};
    //   Object.keys(availableCategories["income"])?.map((key) => {
    //     if (!incomeSummary[m]) {
    //       income[key] = "-";
    //     } else {
    //       income[key] = incomeSummary[m][key] ? formatMoney(incomeSummary[m][key]["amount"]) : "-";
    //     }
    //   });
    //   incomeTransactions[m] = income;

    //   const administrationMisc = {};
    //   Object.keys(availableCategories["is_administration_misc"])?.map((key) => {
    //     if (!administrationMiscSummary[m]) {
    //       administrationMisc[key] = "-";
    //     } else {
    //       administrationMisc[key] = administrationMiscSummary[m][key]
    //         ? formatMoney(administrationMiscSummary[m][key]["amount"])
    //         : "-";
    //     }
    //   });
    //   administrationMiscTransactions[m] = administrationMisc;

    //   const insurance = {};
    //   Object.keys(availableCategories["is_insurance"])?.map((key) => {
    //     if (!insuranceSummary[m]) {
    //       insurance[key] = "-";
    //     } else {
    //       insurance[key] = insuranceSummary[m][key] ? formatMoney(insuranceSummary[m][key]["amount"]) : "-";
    //     }
    //   });
    //   insuranceTransactions[m] = insurance;

    //   const maintenance = {};
    //   Object.keys(availableCategories["is_maintenance_repairs"])?.map((key) => {
    //     if (!maintenanceSummary[m]) {
    //       maintenance[key] = "-";
    //     } else {
    //       maintenance[key] = maintenanceSummary[m][key] ? formatMoney(maintenanceSummary[m][key]["amount"]) : "-";
    //     }
    //   });
    //   maintenanceTransactions[m] = maintenance;

    //   const managementFees = {};
    //   Object.keys(availableCategories["is_management_fee"])?.map((key) => {
    //     if (!managementFeesSummary[m]) {
    //       managementFees[key] = "-";
    //     } else {
    //       managementFees[key] = managementFeesSummary[m][key]
    //         ? formatMoney(managementFeesSummary[m][key]["amount"])
    //         : "-";
    //     }
    //   });
    //   managementFeesTransactions[m] = managementFees;

    //   const tax = {};
    //   Object.keys(availableCategories["is_tax"])?.map((key) => {
    //     if (!taxesSummary[m]) {
    //       tax[key] = "-";
    //     } else {
    //       tax[key] = taxesSummary[m][key] ? formatMoney(taxesSummary[m][key]["amount"]) : "-";
    //     }
    //   });
    //   taxesTransactions[m] = tax;

    //   const legalProfessional = {};
    //   Object.keys(availableCategories["is_professional_due"])?.map((key) => {
    //     if (!legalProfessionalSummary[m]) {
    //       legalProfessional[key] = "-";
    //     } else {
    //       legalProfessional[key] = legalProfessionalSummary[m][key]
    //         ? formatMoney(legalProfessionalSummary[m][key]["amount"])
    //         : "-";
    //     }
    //   });
    //   legalProfessionalTransactions[m] = legalProfessional;

    //   const utility = {};
    //   Object.keys(availableCategories["is_utilities"])?.map((key) => {
    //     if (!utilitiesSummary[m]) {
    //       utility[key] = "-";
    //     } else {
    //       utility[key] = utilitiesSummary[m][key] ? formatMoney(utilitiesSummary[m][key]["amount"]) : "-";
    //     }
    //   });
    //   utilitiesTransactions[m] = utility;

    //   const transfer = {};
    //   Object.keys(availableCategories["is_transfer"])?.map((key) => {
    //     if (!transferSummary[m]) {
    //       transfer[key] = "-";
    //     } else {
    //       transfer[key] = transferSummary[m][key] ? formatMoney(transferSummary[m][key]["amount"]) : "-";
    //     }
    //   });
    //   transferTransactions[m] = transfer;

    //   const uncategorized = {};
    //   Object.keys(availableCategories["is_uncategorized"])?.map((key) => {
    //     if (!uncategorizedSummary[m]) {
    //       uncategorized[key] = "-";
    //     } else {
    //       uncategorized[key] = uncategorizedSummary[m][key]
    //         ? formatMoney(uncategorizedSummary[m][key]["amount"])
    //         : "-";
    //     }
    //   });
    //   uncategorizedTransactions[m] = uncategorized;
    // });

    let totalOperatingExpense = {};
    let netOperatingIncome = {
      "Net operating Income": [],
    };

    Object.values(availableCategories["expense"]).map((i) => {
      totalOperatingExpense[i] = [];
    });

    transactionMonths?.map((m, i) => {
      const currentIndex = i + 1;
      const month = moment(m).format("MMM YY");
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
      expenseTransactions = {
        ...expenseTransactions,
        [m]: { total: findExpense ? formatMoney(findExpense?.y) : "-" },
      };

      Object.entries(availableCategories["expense"])?.map((key) => {
        if (!findExpense?.y) {
          totalOperatingExpense[key[1]]?.push({ [key[0]]: "$0.00" });
        } else {
          totalOperatingExpense[key[1]]?.push({ [key[0]]: findExpense ? formatMoney(findExpense?.y) : "$0.00" });
        }
      });

      operatingIncomeTransactions = {
        ...operatingIncomeTransactions,
        [m]: { total: netIncomeObj?.y ? formatMoney(netIncomeObj?.y) : "$0.00" },
      };

      if (!netIncomeObj?.y) {
        netOperatingIncome["Net operating Income"]?.push({ ["net_Income"]: "$0.00" });
      } else {
        netOperatingIncome["Net operating Income"]?.push({
          ["net_Income"]: netIncomeObj ? formatMoney(netIncomeObj?.y) : "$0.00",
        });
      }

      if (currentYear.includes(m)) {
        currentYearIncome += netIncomeObj?.y ? netIncomeObj?.y : 0;
      }
      if (lastYear.includes(m)) {
        lastYearIncome += netIncomeObj?.y ? netIncomeObj?.y : 0;
      }
      totalNetOperatingIncome.push(netIncomeObj);

      operatingIncomeChartRange = {
        min: Math.min(
          operatingIncomeChartRange.min,
          totalIncome[i].y,
          totalOperatingExpenses[i].y,
          totalUncategorized[i].y,
          totalTransfer[i].y,
          netIncomeObj.y
        ),
        max: Math.max(
          operatingIncomeChartRange.max,
          totalIncome[i].y,
          totalOperatingExpenses[i].y,
          totalUncategorized[i].y,
          totalTransfer[i].y,
          netIncomeObj.y
        ),
      };

      setOperatingIncomeChartRange(operatingIncomeChartRange);

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

      incomeCategoryChartRange = {
        min: Math.min(incomeCategoryChartRange.min, totalRent[i].y, totalOtherIncome[i].y, totalMisc[i].y),
        max: Math.max(incomeCategoryChartRange.max, totalRent[i].y, totalOtherIncome[i].y, totalMisc[i].y),
      };

      setIncomeCategoryChartRange(incomeCategoryChartRange);

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
      expenseCategoryChartRange = {
        min: Math.min(
          expenseCategoryChartRange.min,
          totalAdminOther[i].y,
          totalRepair[i].y,
          totalManagement[i].y,
          totalLegal[i].y,
          totalUtility[i].y
        ),
        max: Math.max(
          expenseCategoryChartRange.max,
          totalAdminOther[i].y,
          totalRepair[i].y,
          totalManagement[i].y,
          totalLegal[i].y,
          totalUtility[i].y
        ),
      };
      setExpenseCategoryChartRange(expenseCategoryChartRange);
    });

    setNetOperatingIncome(netOperatingIncome);

    const operatingIncomeChartData = [
      totalIncome,
      totalOperatingExpenses,
      totalNetOperatingIncome,
      totalTransfer,
      totalUncategorized,
    ];
    setIncomeChartData(operatingIncomeChartData);

    const incomeCategoryChartData = [totalRent, totalOtherIncome, totalMisc];
    setIncomeCategoryChart(incomeCategoryChartData);

    const expenseCategoryChartData = [totalAdminOther, totalRepair, totalManagement, totalLegal, totalUtility];
    setExpenseCategoryChart(expenseCategoryChartData);

    const alertAmount = currentYearIncome - lastYearIncome;
    const alertMessage =
      alertAmount > 0
        ? `Your YoY Net Operating Income have increased by ${formatMoney(alertAmount)}`
        : `Your YoY Net Operating Income have decreased by ${formatMoney(Math.abs(alertAmount))}
    `;
    setAlertAmount(alertAmount);
    setAlertMessage(alertMessage);

    const income = {};
    const administrationMisc = {};
    const insurance = {};
    const maintenance = {};
    const managementFees = {};
    const taxes = {};
    const legalProfessional = {};
    const utilities = {};
    const transfer = {};
    const uncategorized = {};

    Object.values(availableCategories["income"]).map((i) => {
      income[i] = [];
    });

    Object.values(availableCategories["is_administration_misc"]).map((i) => {
      administrationMisc[i] = [];
    });

    Object.values(availableCategories["is_insurance"]).map((i) => {
      insurance[i] = [];
    });

    Object.values(availableCategories["is_maintenance_repairs"]).map((i) => {
      maintenance[i] = [];
    });

    Object.values(availableCategories["is_management_fee"]).map((i) => {
      managementFees[i] = [];
    });

    Object.values(availableCategories["is_tax"]).map((i) => {
      taxes[i] = [];
    });

    Object.values(availableCategories["is_professional_due"]).map((i) => {
      legalProfessional[i] = [];
    });

    Object.values(availableCategories["is_utilities"]).map((i) => {
      utilities[i] = [];
    });

    Object.values(availableCategories["is_transfer"]).map((i) => {
      transfer[i] = [];
    });

    Object.values(availableCategories["is_uncategorized"]).map((i) => {
      uncategorized[i] = [];
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
          administrationMisc[key[1]]?.push({ [key[0]]: "-" });
        } else {
          administrationMisc[key[1]]?.push({
            [key[0]]: administrationMiscSummary[m][key[0]]
              ? formatMoney(administrationMiscSummary[m][key[0]]["amount"])
              : "-",
          });
        }
      });

      Object.entries(availableCategories["is_insurance"])?.map((key) => {
        if (!insuranceSummary[m]) {
          insurance[key[1]]?.push({ [key[0]]: "-" });
        } else {
          insurance[key[1]]?.push({
            [key[0]]: insuranceSummary[m][key[0]] ? formatMoney(insuranceSummary[m][key[0]]["amount"]) : "-",
          });
        }
      });

      Object.entries(availableCategories["is_maintenance_repairs"])?.map((key) => {
        if (!maintenanceSummary[m]) {
          maintenance[key[1]]?.push({ [key[0]]: "-" });
        } else {
          maintenance[key[1]]?.push({
            [key[0]]: maintenanceSummary[m][key[0]] ? formatMoney(maintenanceSummary[m][key[0]]["amount"]) : "-",
          });
        }
      });

      Object.entries(availableCategories["is_management_fee"])?.map((key) => {
        if (!managementFeesSummary[m]) {
          managementFees[key[1]]?.push({ [key[0]]: "-" });
        } else {
          managementFees[key[1]]?.push({
            [key[0]]: managementFeesSummary[m][key[0]] ? formatMoney(managementFeesSummary[m][key[0]]["amount"]) : "-",
          });
        }
      });

      Object.entries(availableCategories["is_tax"])?.map((key) => {
        if (!taxesSummary[m]) {
          taxes[key[1]]?.push({ [key[0]]: "-" });
        } else {
          taxes[key[1]]?.push({
            [key[0]]: taxesSummary[m][key[0]] ? formatMoney(taxesSummary[m][key[0]]["amount"]) : "-",
          });
        }
      });

      Object.entries(availableCategories["is_professional_due"])?.map((key) => {
        if (!legalProfessionalSummary[m]) {
          legalProfessional[key[1]]?.push({ [key[0]]: "-" });
        } else {
          legalProfessional[key[1]]?.push({
            [key[0]]: legalProfessionalSummary[m][key[0]]
              ? formatMoney(legalProfessionalSummary[m][key[0]]["amount"])
              : "-",
          });
        }
      });

      Object.entries(availableCategories["is_utilities"])?.map((key) => {
        if (!utilitiesSummary[m]) {
          utilities[key[1]]?.push({ [key[0]]: "-" });
        } else {
          utilities[key[1]]?.push({
            [key[0]]: utilitiesSummary[m][key[0]] ? formatMoney(utilitiesSummary[m][key[0]]["amount"]) : "-",
          });
        }
      });

      Object.entries(availableCategories["is_transfer"])?.map((key) => {
        if (!transferSummary[m]) {
          transfer[key[1]]?.push({ [key[0]]: "-" });
        } else {
          transfer[key[1]]?.push({
            [key[0]]: transferSummary[m][key[0]] ? formatMoney(transferSummary[m][key[0]]["amount"]) : "-",
          });
        }
      });

      Object.entries(availableCategories["is_uncategorized"])?.map((key) => {
        if (!uncategorizedSummary[m]) {
          uncategorized[key[1]]?.push({ [key[0]]: "-" });
        } else {
          uncategorized[key[1]]?.push({
            [key[0]]: uncategorizedSummary[m][key[0]] ? formatMoney(uncategorizedSummary[m][key[0]]["amount"]) : "-",
          });
        }
      });
    });

    setIncome(income);
    setUncategorized(uncategorized);

    const Transfers = [{ data: transfer, c: "is_transfer" }];
    setTransfers(Transfers);

    const operatingExpensesTransaction = [
      { data: administrationMisc, c: "is_administration_misc" },
      { data: insurance, c: "is_insurance" },
      { data: maintenance, c: "is_maintenance_repairs" },
      { data: taxes, c: "is_tax" },
      { data: managementFees, c: "is_management_fee" },
      { data: legalProfessional, c: "is_professional_due" },
      { data: utilities, c: "is_utilities" },
      { data: totalOperatingExpense, c: "expense" },
    ];
    setOperatingExpensesTransaction(operatingExpensesTransaction);

    // const dat = transactionMonths?.map((m, i) => {
    //   let arr = {};
    //   // operatingExpensesTransaction.map((o, i) => {
    //   if (i === 0) {
    //     arr = { ["category"]: m };
    //   } else {
    //     arr = { ...arr, [m]: m };
    //   }
    //   return arr;
    // });
    // return arr
    // });

    setTimeout(() => {
      setDisplay(true);
    }, [2000]);
  };

  // Alerts data...
  let icon = require("../../Assets/images/icon-help.svg");
  let bgColor = "#FEF8F0";
  let iconColor = "#06122B";

  if (alertAmount > 0) {
    icon = require("../../Assets/images/taskIcon.svg");
    iconColor = "#1BAE99";
    bgColor = "#EEF8F3";
  } else if (alertAmount <= 0) {
    icon = require("../../Assets/images/ReportAlert.svg");
    iconColor = "#FF5A5A";
    bgColor = "#FFEEEE";
  }

  let chartOptions = {
    offset: 6.5,
    style: {
      data: { width: 5 },
      labels: { fontFamily: "DMSans-Medium" },
    },
  };

  let chartContainerOptions = {
    // horizontal: true,
    // height: transactionMonths.length * 50 + 10,
    height: 600,
    width: 1700,
    domain: { x: [0, transactionMonths?.length] },
    animate: {
      easing: "quadInOut",
    },
  };

  let incomeChartContainerOptions = {
    horizontal: true,
    height:
      (incomeCategoryChart?.length && Object.values(...incomeCategoryChart)?.length <= 5) ||
      (expenseCategoryChart?.length && Object.values(...expenseCategoryChart)?.length <= 5)
        ? 230
        : transactionMonths?.length * 31,
    width: 650,
    domain: { x: [0, transactionMonths?.length] },
    animate: {
      easing: "quadInOut",
    },
  };

  const chartStyle = {
    axis: { stroke: "#EDEDED" },
    axisLabel: { fontSize: 20, padding: 30 },
    grid: {
      stroke: ({ tick }) => (tick === 0 ? "#747474" : "#EDEDED"),
    },
    ticks: { stroke: "#EDEDED", size: 5 },
    tickLabels: { fontSize: 12, padding: 5 },
  };

  const chartGridStyle = {
    axis: { stroke: "#EDEDED" },
    axisLabel: { fontSize: 20, padding: 30 },
    grid: {
      stroke: ({ tick }) => (tick === 0 ? "#747474" : "#EDEDED"),
    },
    ticks: { stroke: "#EDEDED", size: 5 },
    tickLabels: { fontSize: 17, padding: 5 },
  };

  return (
    <>
      {alertAmount !== 0 && (
        <div className="mt-5">
          <h3 className="mb-4">Alerts</h3>
          <Row className="gap-3 px-3">
            <Col
              lg="3"
              md="4"
              sm="12"
              className="d-flex p-3"
              style={{ background: bgColor, width: "270px", borderRadius: "12px" }}
            >
              <div className="me-2" style={{ color: iconColor }}>
                <img src={icon.default} alt="" />
              </div>
              <span>
                <div>{alertMessage?.trim()}</div>
              </span>
            </Col>
          </Row>
        </div>
      )}

      {(display || incomeChartData.flat()?.length > 0) && (
        <div>
          <Row>
            <Col>
              <h3 className="mt-5">Total Operating Income Breakdown</h3>
              {incomeChartData.flat()?.length > 0 && (
                <div className="mb-5 operating-income-graph">
                  <div style={{ width: "100%" }}>
                    <VictoryChart
                      {...chartContainerOptions}
                      domainPadding={20}
                      style={chartGridStyle}
                      padding={{ top: 80, bottom: 50, left: 100, right: 50 }}
                    >
                      <VictoryAxis style={chartGridStyle} offsetY={35} />
                      <VictoryAxis
                        dependentAxis
                        tickValues={generateChartTicks(
                          operatingIncomeChartRange?.min,
                          operatingIncomeChartRange?.max,
                          7
                        )}
                        tickFormat={(y) => numFormatter(y)}
                        standalone={false}
                        style={chartGridStyle}
                        tickCount={7}
                        offsetX={85}
                      />
                      <VictoryGroup {...chartOptions} colorScale={colorScale}>
                        {incomeChartData.map((data, index) => (
                          <VictoryBar
                            data={data.map((i) => {
                              return { ...i, y: parseInt(i?.y) };
                            })}
                            cornerRadius={3}
                            key={`${index}-${Math.random()}`}
                          />
                        ))}
                      </VictoryGroup>
                    </VictoryChart>
                  </div>

                  <div className="py-4">
                    <div className="d-flex justify-content-center align-items-center">
                      {operatingIncomeCategory?.map((item) => {
                        return (
                          <ul className="round">
                            <li>
                              <span className="round-bullet" style={{ background: item.symbol.fill }}></span>
                              <span>{item.name}</span>
                            </li>
                          </ul>
                        );
                      })}
                    </div>
                    <div className="pt-1 d-flex justify-content-center align-items-center">
                      {operatingIncomeCategory1?.map((item) => {
                        return (
                          <ul className="round">
                            <li>
                              <span className="round-bullet" style={{ background: item.symbol.fill }}></span>
                              <span>{item.name}</span>
                            </li>
                          </ul>
                        );
                      })}
                    </div>
                  </div>

                  {/* <div
                    style={{
                      height: 50,
                      // marginBottom: 30,
                    }}
                  >
                    <VictoryLegend
                      x={80}
                      orientation="horizontal"
                      itemsPerRow={3}
                      gutter={10}
                      // rowGutter={{ top: 0, bottom: 0 }}
                      // centerTitle
                      // titleOrientation="left"
                      y={180}
                      style={{
                        labels: {
                          fontFamily: "DMSans-Medium",
                          fontWeight: "600",
                          fontSize: "70",
                        },
                        parent: {
                          padding: 0,
                          margin: 0,
                        },
                      }}
                      data={operatingIncomeCategory}
                    />
                  </div>
                  <div
                    style={{
                      height: 50,
                      marginBottom: 30,
                    }}
                  >
                    <VictoryLegend
                      x={-700}
                      orientation="horizontal"
                      itemsPerRow={2}
                      gutter={100}
                      // rowGutter={{ top: 0, bottom: 0 }}
                      // centerTitle
                      // titleOrientation="left"
                      y={50}
                      style={{
                        labels: {
                          fontFamily: "DMSans-Medium",
                          fontWeight: "600",
                          fontSize: "80",
                          // color: colors.text,
                        },
                        parent: {
                          padding: 0,
                          margin: 0,
                        },
                      }}
                      data={operatingIncomeCategory1}
                    />
                  </div> */}
                </div>
              )}
            </Col>
          </Row>
          <Row className="d-flex gap-5 mb-5">
            <Col>
              <div style={{ width: "100%" }}>
                <h3>Total Income Category Breakdown</h3>
                {incomeCategoryChart.flat()?.length > 0 && (
                  <div className="operating-income-graph">
                    <VictoryChart {...incomeChartContainerOptions}>
                      <VictoryAxis style={chartStyle} offsetX={50} />
                      <VictoryAxis
                        dependentAxis
                        tickValues={generateChartTicks(incomeCategoryChartRange?.min, incomeCategoryChartRange?.max, 7)}
                        tickFormat={(y) => numFormatter(y)}
                        standalone={false}
                        style={chartStyle}
                        tickCount={7}
                      />
                      <VictoryGroup {...chartOptions} colorScale={colorScale2}>
                        {incomeCategoryChart.map((data, index) => (
                          <VictoryBar
                            data={data.map((i) => {
                              return { ...i, y: parseInt(i?.y) };
                            })}
                            cornerRadius={3}
                            key={`${index}-${Math.random()}`}
                          />
                        ))}
                      </VictoryGroup>
                    </VictoryChart>

                    <div className="pb-5">
                      <div className="d-flex justify-content-center">
                        {totalIncomeCategory?.map((item) => {
                          return (
                            <ul className="round">
                              <li>
                                <span className="round-bullet" style={{ background: item.symbol.fill }}></span>
                                <span>{item.name}</span>
                              </li>
                            </ul>
                          );
                        })}
                      </div>
                    </div>

                    {/* <div
                      style={{
                        height: 80,
                        marginLeft: -180,
                      }}
                    >
                      <VictoryLegend
                        // x={1}
                        y={30}
                        orientation="horizontal"
                        itemsPerRow={3}
                        gutter={20}
                        style={{
                          labels: {
                            fontFamily: "DMSans-Medium",
                            fontWeight: "600",
                            fontSize: "48",
                            // color: colors.text,
                          },
                        }}
                        data={totalIncomeCategory}
                      />
                    </div> */}
                  </div>
                )}
              </div>
            </Col>
            <Col>
              <div style={{ width: "100%" }}>
                <h3>Total Expense Category Breakdown</h3>
                {expenseCategoryChart.flat()?.length > 0 && (
                  <div className="operating-income-graph">
                    <VictoryChart {...incomeChartContainerOptions}>
                      <VictoryAxis style={chartStyle} offsetX={50} />
                      <VictoryAxis
                        dependentAxis
                        tickValues={generateChartTicks(
                          expenseCategoryChartRange?.min,
                          expenseCategoryChartRange?.max,
                          7
                        )}
                        tickFormat={(y) => numFormatter(y)}
                        style={chartStyle}
                        tickCount={7}
                      />
                      <VictoryGroup {...chartOptions} colorScale={colorScale3}>
                        {expenseCategoryChart.map((data, index) => (
                          <VictoryBar
                            // data={data.map((i) => {
                            //   return { ...i, y: parseInt(i?.y) };
                            // })}
                            data={data}
                            cornerRadius={3}
                            key={`${index}-${Math.random()}`}
                          />
                        ))}
                      </VictoryGroup>
                    </VictoryChart>

                    <div className="pb-4">
                      <div className="d-flex justify-content-center align-items-center">
                        {expenseCategory?.map((item) => {
                          return (
                            <ul className="round">
                              <li>
                                <span className="round-bullet" style={{ background: item.symbol.fill }}></span>
                                <span>{item.name}</span>
                              </li>
                            </ul>
                          );
                        })}
                      </div>
                      <div className="pt-1 d-flex justify-content-center align-items-center">
                        {expenseCategory1?.map((item) => {
                          return (
                            <ul className="round">
                              <li>
                                <span className="round-bullet" style={{ background: item.symbol.fill }}></span>
                                <span>{item.name}</span>
                              </li>
                            </ul>
                          );
                        })}
                      </div>
                    </div>

                    {/* <div
                      style={{
                        height: 35,
                        marginLeft: -360,
                      }}
                    >
                      <VictoryLegend
                        // x={10}
                        y={100}
                        orientation="horizontal"
                        itemsPerRow={3}
                        gutter={180}
                        style={{
                          labels: {
                            fontFamily: "DMSans-Medium",
                            fontWeight: "600",
                            fontSize: "110",
                          },
                        }}
                        data={expenseCategory}
                      />
                    </div>
                    <div
                      style={{
                        height: 50,
                        marginLeft: -150,
                      }}
                    >
                      <VictoryLegend
                        y={30}
                        orientation="horizontal"
                        itemsPerRow={3}
                        gutter={80}
                        style={{
                          labels: {
                            fontFamily: "DMSans-Medium",
                            fontWeight: "600",
                            fontSize: "80",
                          },
                        }}
                        data={expenseCategory1}
                      />
                    </div> */}
                  </div>
                )}
              </div>
            </Col>
          </Row>

          <h3 className="mb-5">Summary</h3>
          <div className="incomeTable">
            <div className="fw-bold mb-3">Income</div>
            <div className="mb-5 expensesTable">
              <Table>
                <thead>
                  <tr style={{ borderColor: "#ffffff" }}>
                    <th style={{ minWidth: "100px" }}></th>
                    {transactionMonths?.map((m) => (
                      <th style={{ minWidth: "100px" }}>{moment(m).format("MMM YY")}</th>
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
                    {transactionMonths?.map((m) => (
                      <th style={{ minWidth: "100px" }}>{moment(m).format("MMM YY")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operatingExpensesTransaction?.map(({ data, c }) => {
                    return Object.keys(data)?.map((category) => {
                      return (
                        <>
                          <tr
                            style={{
                              backgroundColor:
                                ["Total Operating Expenses", "Total Repairs & Maintenance"].includes(category) &&
                                "#E8EDF7",
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
                    {Object.keys(netOperatingIncome)?.map((item) => {
                      return (
                        <>
                          <td style={{ color: "#FFFFFF" }}>{item}</td>
                          {netOperatingIncome[item]?.map((income) => (
                            <td style={{ color: "#FFFFFF" }}>{income.net_Income}</td>
                          ))}
                        </>
                      );
                    })}
                  </tr>
                  <tr style={{ backgroundColor: "#FFEEEE", borderColor: "#EDEDED" }}>
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
                  </tr>
                </tbody>
              </Table>
            </div>
          </div>

          <div className="incomeTable">
            <div className="fw-bold">Transfers</div>
            <div className="mb-3 expensesTable">
              <Table>
                <thead>
                  <tr style={{ borderColor: "#ffffff" }}>
                    <th style={{ minWidth: "100px" }}></th>
                    {transactionMonths?.map((m) => (
                      <th style={{ minWidth: "100px" }}>{moment(m).format("MMM YY")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transfers?.map(({ data, c }) => {
                    return Object.keys(data)?.map((category) => {
                      return (
                        <>
                          <tr
                            style={{
                              backgroundColor: category?.includes("Total Transfers") && "#E8EDF7",
                              borderColor: "#EDEDED",
                            }}
                            className={`${category?.includes("Total Transfers") && "fw-bold"}`}
                          >
                            <td>{category}</td>
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
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IncomeStatement;
