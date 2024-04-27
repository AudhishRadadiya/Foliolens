import { formatDate } from ".";

const dateFormat = (s) => (s ? formatDate(s) : "-");

const formatMoney = (amount) => {
  if (!amount) {
    return "-";
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    return 0;
  }
  // var absAmt = Math.abs(parsedAmount);
  const formattedValue =
    // absAmt.toLocaleString("en-US", {
    //   maximumFractionDigits: 2,
    // }) || 0;
    String(parseFloat(parsedAmount?.toFixed(2)))?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || 0;

  return parsedAmount < 0 ? "$ (" + formattedValue + ")" : "$" + formattedValue;
  // return amount.toLocaleString('en-US', {
  //   style: 'currency',
  //   currency: 'USD',
  // });
};

export const generateScheduleTable = (data) => {
  const rows = [];
  let totalMarketVal = 0;
  let totalLoanBalance = 0;
  let totalMortgage = 0;
  let totalIncome = 0;
  let totalTax = 0;
  let totalInsurance = 0;
  let totalCashflow = 0;
  let totalLoanToValue = 0;
  let proRataMarketVal = 0;
  let proRataLoanBalance = 0;
  let proRataMortgage = 0;
  let proRataIncome = 0;
  let propRataTax = 0;
  let proRataInsurance = 0;
  let proRataCashflow = 0;
  let proRataLoanToValue = 0;
  let totalProperties = 0;
  let totalExpenses = 0;
  let proRataExpenses = 0;
  Object.keys(data).map((key) => {
    if (data[key].length > 1) {
      let multipleRow = {};

      data[key].map((item) => {
        let cashflow = 0;
        let mortgageAmount = 0;

        mortgageAmount = data[key].reduce(
          (prevVal, currValue) => parseFloat(prevVal || 0) + parseFloat(currValue.payment_amount || 0),
          0
        );

        cashflow =
          parseFloat(item.income || 0) -
          (parseFloat(mortgageAmount || 0) +
            parseFloat(item.tax_amount || 0) +
            parseFloat(item.annual_premium || 0) +
            parseFloat(item.other_expenses || 0));

        multipleRow = {
          ...item,
          occupied_units: item?.occupancy ? parseFloat(item?.occupancy?.toFixed(2)) + "%" : "-",
          assessedValue: formatMoney(item.assessedValue),
          maturity_date: multipleRow.maturity_date
            ? [...multipleRow.maturity_date, dateFormat(item.maturity_date) + "\n"]
            : [dateFormat(item.maturity_date) + "\n"],
          property_value: formatMoney(item.property_value),
          loan_to_value: multipleRow.loan_to_value
            ? [
                ...multipleRow.loan_to_value,
                item.loan_to_value ? parseFloat(item.loan_to_value?.toFixed(2)) + "%" + "\n" : "-",
              ]
            : [item.loan_to_value ? parseFloat(item.loan_to_value?.toFixed(2)) + "%" + "\n" : "-"],
          owner: item?.owner ? item?.owner?.replaceAll("|", "%\n") + "%" : "-",
          interest_rate: multipleRow.interest_rate
            ? [...multipleRow.interest_rate, item.interest_rate ? item.interest_rate + "%\n" : "-"]
            : [item.interest_rate ? item.interest_rate + "%" + "\n" : "-"],
          mortgage_lender_name: item.mortgage_lender_name
            ? multipleRow.mortgage_lender_name
              ? [...multipleRow.mortgage_lender_name, item.mortgage_lender_name + "\n"]
              : [item.mortgage_lender_name + "\n"]
            : "-",
          income: formatMoney(item.income),
          original_balance: multipleRow.original_balance
            ? [...multipleRow.original_balance, formatMoney(item.original_balance) + "\n"]
            : [formatMoney(item.original_balance) + "\n"],
          mortgageAmount: formatMoney(mortgageAmount),
          annual_premium: formatMoney(item.annual_premium),
          tax_amount: formatMoney(item.tax_amount),
          other_expenses: formatMoney(item.other_expenses),
          cashflow: formatMoney(cashflow),
        };
      });
      rows.push(multipleRow);
    } else {
      data[key].map((item, index) => {
        totalProperties += 1;
        const ownership = parseFloat(item.ownership || 100);

        let cashflow = 0;
        let mortgageAmount = 0;

        if (index === 0) {
          mortgageAmount = data[key].reduce(
            (prevVal, currValue) => parseFloat(prevVal || 0) + parseFloat(currValue.payment_amount || 0),
            0
          );

          cashflow =
            parseFloat(item.income || 0) -
            (parseFloat(mortgageAmount || 0) +
              parseFloat(item.tax_amount || 0) +
              parseFloat(item.annual_premium || 0) +
              parseFloat(item.other_expenses || 0));

          totalMortgage += mortgageAmount;
          totalIncome += parseFloat(item.income || 0);

          totalCashflow += cashflow;
          proRataMortgage += mortgageAmount / (100 / ownership);
          proRataIncome += parseFloat(item.income || 0) / (100 / ownership);
          proRataCashflow += cashflow / (100 / ownership);
        }
        totalTax += parseFloat(item.tax_amount || 0);
        totalExpenses += parseFloat(item.other_expenses || 0);
        totalInsurance += parseFloat(item.annual_premium || 0);
        totalMarketVal += parseFloat(item.property_value || 0);
        totalLoanToValue += parseFloat(item.loan_to_value || 0);
        totalLoanBalance += parseFloat(data[key][index].original_balance || 0);

        propRataTax += parseFloat(item.tax_amount || 0) / (100 / ownership);
        proRataExpenses += parseFloat(item.other_expenses || 0) / (100 / ownership);
        proRataInsurance += parseFloat(item.annual_premium || 0) / (100 / ownership);
        proRataMarketVal += parseFloat(item.property_value || 0) / (100 / ownership);
        proRataLoanBalance += parseFloat(data[key][index].original_balance || 0) / (100 / ownership);
        proRataLoanToValue += parseFloat(item.loan_to_value || 0) / (100 / ownership);

        rows.push({
          ...item,
          // occupied_units:
          //   item?.occupied_units && item.units ? Math.round((item.occupied_units * 100) / item.units || 0) + "%" : "-",
          occupied_units: item?.occupancy ? parseFloat(item?.occupancy?.toFixed(2)) + "%" : "-",
          assessedValue: formatMoney(item.assessedValue),
          maturity_date: item?.maturity_date ? formatDate(item.maturity_date) : "-",
          property_value: formatMoney(item.property_value),
          loan_to_value: item?.loan_to_value ? parseFloat(item.loan_to_value?.toFixed(2)) + "%" : "-",
          owner: item?.owner ? item?.owner?.replaceAll("|", "%\n") + "%" : "-",
          // owner: item?.owner ? item?.owner?.split("|")?.join("% \n") + "%" : "-",
          interest_rate: item?.interest_rate ? item.interest_rate + "%" : "-",
          mortgage_lender_name: item.mortgage_lender_name ? item.mortgage_lender_name : "-",
          income: formatMoney(item.income),
          original_balance: formatMoney(item.original_balance),
          mortgageAmount: formatMoney(mortgageAmount),
          annual_premium: formatMoney(item.annual_premium),
          tax_amount: formatMoney(item.tax_amount),
          other_expenses: formatMoney(item.other_expenses),
          cashflow: formatMoney(cashflow),
        });
      });
    }
  });

  const totalData = [
    {
      label: "Total",
      marketVal: formatMoney(totalMarketVal),
      loanBalance: formatMoney(totalLoanBalance),
      mortgage: formatMoney(totalMortgage),
      income: formatMoney(totalIncome),
      tax: formatMoney(totalTax),
      insurance: formatMoney(totalInsurance),
      cashflow: formatMoney(totalCashflow),
      // loanToValue: totalLoanToValue ? parseFloat(totalLoanToValue?.toFixed(2)) + "%" : "-",
      loanToValue:
        totalLoanBalance / totalMarketVal
          ? parseFloat(((totalLoanBalance / totalMarketVal) * 100)?.toFixed(2)) + "%"
          : "-",
      expenses: formatMoney(totalExpenses),
    },
    {
      label: "Pro-Rata Share",
      marketVal: formatMoney(proRataMarketVal),
      loanBalance: formatMoney(proRataLoanBalance),
      mortgage: formatMoney(proRataMortgage),
      income: formatMoney(proRataIncome),
      tax: formatMoney(propRataTax),
      insurance: formatMoney(proRataInsurance),
      cashflow: formatMoney(proRataCashflow),
      // loanToValue: proRataLoanToValue ? parseFloat(proRataLoanToValue?.toFixed(2)) + "%" : "-",
      loanToValue:
        proRataLoanBalance / proRataMarketVal
          ? parseFloat(((proRataLoanBalance / proRataMarketVal) * 100)?.toFixed(2)) + "%"
          : "-",
      expenses: formatMoney(proRataExpenses),
    },
  ];
  return { rows, totalData };
};

export const generateTenantLedgerTable = (data) => {
  let rows = [],
    charges = 0,
    payments = 0,
    balance = 0;
  data.map((row) => {
    if (row.transaction_type === "DEBIT") {
      balance = balance - row.amount;
      charges = charges + row.amount;
    } else {
      payments = payments + row.amount;
      balance = balance + row.amount;
    }
    rows.push({
      ...row,
      payment_date: formatDate(row.payment_date),
      balance: formatMoney(balance),
      amount: formatMoney(row.amount),
    });
  });
  return {
    rows,
    totalData: {
      charges,
      payments,
      balance,
    },
  };
};

const generateCashFlowTotalRows = (data, expData, startDate, endDate) => {
  let totalPayments = 0,
    totalExpenses = 0,
    totalIncome = 0,
    totalOwnerPayment = 0,
    totalManagementFees = 0;
  data.map((item) => {
    if (item.credit > 0) {
      const managementExpense = Number(
        parseFloat(item.credit) * (parseFloat(item.property_management_fee) / 100)
      ).toFixed(2);
      const ownerAmount = parseFloat(item.credit) - managementExpense;
      totalIncome += parseFloat(item.credit);
      totalManagementFees += parseFloat(managementExpense);
      totalOwnerPayment += parseFloat(ownerAmount);
    }
  });
  totalExpenses += expData.reduce((prev, item) => prev + parseFloat(item.other_expenses), 0);
  return [
    {
      dateDiff: formatDate(startDate) - formatDate(endDate),
      totalIncome: formatMoney(totalIncome),
      totalManagementFees: formatMoney(totalManagementFees),
      totalExpenses: formatMoney(totalExpenses),
      totalPayments: formatMoney(totalPayments),
      totalOwnerPayment: formatMoney(totalOwnerPayment),
    },
  ];
};

const generateCashFlowIncomeRows = (data) => {
  let totalAmount = 0;
  let totalManagementExpense = 0;
  let totalOwnerAmount = 0;
  const rows = [];

  data.map((item) => {
    if (item.transaction_type === "CREDIT") {
      const managementExpense = Number(
        parseFloat(item.amount) * (parseFloat(item.property_management_fee) / 100)
      ).toFixed(2);
      const ownerAmount = parseFloat(item.amount) - managementExpense;
      totalAmount += parseFloat(item.amount);
      totalManagementExpense += parseFloat(managementExpense);
      totalOwnerAmount += ownerAmount;
      rows.push({
        ...item,
        amount: formatMoney(item.amount),
        managementExpense: formatMoney(managementExpense),
        ownerAmount: formatMoney(ownerAmount),
        purpose: item.purpose.toLowerCase(),
      });
    }
  });

  rows.push({
    address1: "Total",
    purpose: "",
    amount: formatMoney(totalAmount),
    managementExpense: formatMoney(totalManagementExpense),
    ownerAmount: formatMoney(totalOwnerAmount),
  });

  return rows;
};

export const generateCashFlowTable = (data, incomeData, expData, startDate, endDate) => {
  const totalTableRows = generateCashFlowTotalRows(data, expData, startDate, endDate);
  const propertyTableRows = data
    .map(
      (item) =>
        item.credit > 0 && {
          ...item,
          credit: formatMoney(item.credit),
          payment_date: formatDate(item.payment_date),
          ownership: "100%",
        }
    )
    .filter((item) => item);

  const incomeTableRows = generateCashFlowIncomeRows(incomeData);

  const expenseTableRows = expData
    .map((item) => ({
      year: item.year || "",
      first_name: item.first_name,
      other_expenses: formatMoney(item.other_expenses),
      transaction_name: "Other Expenses",
    }))
    .concat({
      year: "Total Expenses",
      first_name: "",
      other_expenses: formatMoney(expData.reduce((n, { other_expenses }) => n + parseFloat(other_expenses || 0), 0)),
      transaction_name: "",
    });

  return {
    expenseTableRows,
    incomeTableRows,
    propertyTableRows,
    totalTableRows,
  };
};
