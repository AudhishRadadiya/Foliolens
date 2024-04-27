import React, { useState, useRef } from "react";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import ReactDatePicker from "react-datepicker";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { PDFExport } from "@progress/kendo-react-pdf";
import { CSVLink } from "react-csv";
import Select, { components } from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

import Container from "../components/Layout/Container";
import { setLoading } from "../store/reducer";
import { getRdsFN } from "../Utility/ApiService";
import { generateScheduleTable, generateTenantLedgerTable } from "../Utility/reportTablesHtml";
import { ReactComponent as DownloadIcon } from "../Assets/images/icon-download.svg";
import { ReportTable } from "../components/Reports/ReportTable";
import { useNavigate } from "react-router-dom";
import InsuranceInsightReport from "../components/Reports/InsuranceInsightReport";
import IncomeStatement from "../components/Reports/IncomeStatement";
import CashFlowReport from "../components/Reports/CashFlowReport";
import TexInsightReport from "../components/Reports/TexInsightReport";
import GeneralLedgerReport from "../components/Reports/GeneralLedgerReport";
import { formatMoney } from "../Utility";
import RentRollReport from "../components/Reports/RentRollReport";

const reportOptions = [
  {
    type: "Net Cash Flow",
    exportable: true,
    createreport: true,
  },
  {
    type: "Schedule of Real Estate Owned",
    exportable: true,
    createreport: true,
  },
  {
    type: "Tenant Ledger",
    exportable: true,
    createreport: true,
  },
  {
    type: "Property Tax Insight",
    exportable: true,
    createreport: false,
  },
  {
    type: "Income Statement",
    exportable: true,
    createreport: false,
  },
  {
    type: "Property Insurance Insight",
    exportable: true,
    createreport: false,
  },
  {
    type: "General Ledger",
    exportable: true,
    createreport: false,
  },
  {
    type: "Rent Roll",
    exportable: true,
    createreport: false,
  },
];

// const TenantRender = ["Tenant Ledger", "Schedule of Real Estate Owned"]
// const PropertiesRender = ["Income Statement", "Tenant Ledger", "Property Tax Insight", "Net Cash Flow"]
// const PortfolioRender = ["Income Statement", "Net Cash Flow", "Schedule of Real Estate Owned", "Property Insurance Insight"]
const DatePeriod = ["Property Tax Insight", "Income Statement", "Property Insurance Insight", "Net Cash Flow", "General Ledger"]

const Reports = () => {
  const csvLink = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pdfExportComponent = React.useRef(null);

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const [reportTypes, setReportTypes] = useState("");

  // const reportType =
  //   loggedUserData.user_role !== "Property Manager"
  //     ? reportOptions.filter((item) => item.type !== "Net Cash Flow")
  //     : reportOptions;

  const [selectedPortfolio, setSelectedPortfolio] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedExport, setSelectedExport] = useState("");
  const [isLoad, setIsLoad] = useState(false);
  const [tblData, setTblData] = useState([]);
  const [tblCoulmns, setTblCoulmns] = useState([]);
  const [tblTotal, setTblTotal] = useState({ data: [], columns: [], columns2: [], data2: [] });

  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const currentdata = [{ portfolio_id: "All", portfolio_name: "All Portfolios" }, ...sharedPortfolio, ...allPortfolio];

  const exportExcel = () => {
    csvLink?.current?.link.click();
  };

  const DropdownIndicator = (props) => {
    return (
      components.DropdownIndicator && (
        <components.DropdownIndicator {...props}>
          <FontAwesomeIcon icon={props.selectProps.menuIsOpen ? faAngleUp : faAngleDown} />
        </components.DropdownIndicator>
      )
    );
  };

  const { Option } = components;
  const IconOption = (props) => (
    <Option {...props} className="d-flex justify-content-between">
      {props.data.label}
      {props.data.icon ? <img src={props.data.icon} alt={props.data.label} /> : ""}
    </Option>
  );

  const PropertyAdd = (row) => {
    const data = [row?.address1, row?.address2, row?.city, row?.state, row?.zip];
    return data.filter((d) => d)?.join(", ");
  };

  const handleSubmit = async () => {
    try {
      dispatch(setLoading(true));
      let payloadName = {};
      const propData = [];
      let params = { userId: loggedUserData.id };

      if (selectedPortfolio?.portfolio_id !== "All") {
        params["portfolioId"] = selectedPortfolio?.portfolio_id;
      }
      if (selectedPeriod.startDate && selectedPeriod.endDate) {
        params["startDate"] = moment(selectedPeriod.startDate).format("YYYY-MM-DD");
        params["endDate"] = moment(selectedPeriod.endDate).format("YYYY-MM-DD");
      }

      // if (reportTypes?.type === "Property Insurance Insight" || reportTypes?.type === "Income Statement") {
      //   if (selectedPortfolio?.portfolio_id !== "All") {
      //     params = {
      //       ...params,
      //       userId: loggedUserData.id,
      //       portfolioId: selectedPortfolio?.portfolio_id,
      //     };
      //   } else {
      //     params = {
      //       ...params,
      //       userId: loggedUserData.id,
      //     };
      //   }

      //   if (selectedPeriod.startDate && selectedPeriod.endDate) {
      //     params = {
      //       ...params,
      //       startDate: moment(selectedPeriod.startDate).format("YYYY-MM-DD"),
      //       endDate: moment(selectedPeriod.endDate).format("YYYY-MM-DD"),
      //     };
      //   }
      // } else {
      //   if (selectedPortfolio?.portfolio_id === "All") {
      //     params = { userId: loggedUserData.id };
      //   } else {
      //     params = { userId: loggedUserData.id, portfolioId: selectedPortfolio?.portfolio_id };
      //   }

      //   if (
      //     (reportTypes.type === "Net Cash Flow" || reportTypes.type === "Property Insurance Insight") &&
      //     selectedPeriod.endDate &&
      //     selectedPeriod.startDate
      //   ) {
      //     params = {
      //       ...params,
      //       startDate: moment(selectedPeriod.startDate).format("YYYY-MM-DD"),
      //       endDate: moment(selectedPeriod.endDate).format("YYYY-MM-DD"),
      //     };
      //   }
      //   if (reportTypes.type === "Property Tax Insight" && selectedPeriod.endDate && selectedPeriod.startDate) {
      //     params = {
      //       ...params,
      //       startDate: moment(selectedPeriod.startDate).format("YYYY-MM-DD"),
      //       endDate: moment(selectedPeriod.endDate).format("YYYY-MM-DD"),
      //     };
      //   }
      // }

      switch (reportTypes?.type) {
        case "Schedule of Real Estate Owned":
          payloadName = "scheduleReport";
          break;
        case "Net Cash Flow":
          payloadName = "cashFlow";
          break;
        case "Tenant Ledger":
          payloadName = "tenantLedger";
          break;
        case "Property Tax Insight":
          payloadName = "taxInsight";
          break;
        case "Property Insurance Insight":
          payloadName = "insuranceInsight";
          break;
        case "Income Statement":
          payloadName = "incomeStatement";
          break;
        case "General Ledger":
          payloadName = "generalLedger";
          break;
        case "Rent Roll":
          payloadName = "rentRoll";
          break;
        default:
          payloadName = "scheduleReport";
      }

      const data = await getRdsFN(payloadName, params);

      if (reportTypes.type === "Schedule of Real Estate Owned" || reportTypes.type === "Property Insurance Insight") {
        data?.forEach((prop) => {
          const porpId = `p-${prop.property_id}`;
          if (propData.hasOwnProperty(porpId)) {
            propData[porpId].push(prop);
          } else {
            propData[porpId] = [prop];
          }
        });
      }

      let tableData = [];
      switch (reportTypes.type) {
        case "Schedule of Real Estate Owned":
          tableData = generateScheduleTable(propData);
          setTblCoulmns([
            {
              Header: "Properties",
              columns: [
                {
                  Header: "Property Address",
                  accessor: (row) => PropertyAdd(row),
                },
              ],
            },
            {
              Header: "Property info",
              columns: [
                {
                  Header: "Type",
                  accessor: "property_type",
                },
                {
                  Header: "#Units",
                  accessor: "units",
                },
                {
                  Header: "Occ",
                  accessor: "occupied_units",
                },
                {
                  Header: "%Owned",
                  accessor: "owner",
                  padding: "0.5rem 0",
                  Cell: (props) => <span style={{ whiteSpace: "break-spaces" }}>{props.value}</span>,
                  minWidth: 150,
                },
              ],
            },
            {
              Header: "Acquisition",
              columns: [
                {
                  Header: "Acq Date",
                  accessor: "year",
                },
                {
                  Header: "Acq Price",
                  accessor: "assessedValue",
                },
              ],
            },
            {
              Header: "Current Financing",
              columns: [
                {
                  Header: "Lender",
                  padding: "0",
                  accessor: "mortgage_lender_name",
                  whiteSpace: "nowrap",
                },
                {
                  Header: "Rate",
                  padding: "0",
                  accessor: "interest_rate",
                },
                {
                  Header: "Maturity",
                  padding: "0",
                  accessor: "maturity_date",
                },
                {
                  Header: "Market Value",
                  accessor: "property_value",
                },
                {
                  Header: "Loan Balance",
                  padding: "0",
                  accessor: "original_balance",
                },
                {
                  Header: "LTV",
                  padding: "0",
                  accessor: "loan_to_value",
                },
              ],
            },
            {
              Header: "Monthly Pro Forma",
              columns: [
                {
                  Header: "Income",
                  accessor: "income",
                },
                {
                  Header: "Mortgage",
                  accessor: "mortgageAmount",
                },
                {
                  Header: "Prop taxes",
                  accessor: "tax_amount",
                },
                {
                  Header: "Insurance",
                  accessor: "annual_premium",
                },
                {
                  Header: "Other Exp",
                  accessor: "other_expenses",
                },
                {
                  Header: "Cash Flow",
                  accessor: "cashflow",
                },
              ],
            },
          ]);
          setTblData(tableData.rows);
          setTblTotal({
            data: tableData.totalData,
            columns: [
              {
                Header: "",
                accessor: "label",
              },
              {
                Header: "Market Values",
                accessor: "marketVal",
              },
              {
                Header: "Loan Balance",
                accessor: "loanBalance",
              },
              {
                Header: "Mortgage",
                accessor: "mortgage",
              },
              {
                Header: "Income",
                accessor: "income",
              },
              {
                Header: "Tax",
                accessor: "tax",
              },
              {
                Header: "Insurance",
                accessor: "insurance",
              },
              {
                Header: "Cash Flow",
                accessor: "cashflow",
              },
              {
                Header: "Loan To Value",
                accessor: "loanToValue",
              },
              {
                Header: "Expenses",
                accessor: "expenses",
              },
            ],
            data2: [],
            columns2: [],
          });
          break;
        case "Net Cash Flow":
          setTblData(data);
          // const incomeData = await getRdsFN("cashFlowIncomeExpense", params);
          // const expData = await getRdsFN("cashFlowExpense", params);
          // tableData = generateCashFlowTable(
          //   data,
          //   incomeData,
          //   expData,
          //   selectedPeriod.startDate,
          //   selectedPeriod.endDate
          // );
          // setTblData(tableData.propertyTableRows);
          // setTblCoulmns([
          //   {
          //     Header: "Property",
          //     accessor: "address1",
          //   },
          //   {
          //     Header: "Ownership",
          //     accessor: "ownership",
          //   },
          //   {
          //     Header: "End Date",
          //     accessor: "",
          //   },
          //   {
          //     Header: "Primary",
          //     accessor: "first_name",
          //   },
          //   {
          //     Header: "Amount",
          //     accessor: "credit",
          //   },
          //   {
          //     Header: "Paid  Thru",
          //     accessor: "payment_date",
          //   },
          // ]);
          // setTblTotal({
          //   data: tableData.incomeTableRows,
          //   columns: [
          //     {
          //       Header: "Lease",
          //       accessor: "address1",
          //     },
          //     {
          //       Header: "Transaction Name",
          //       accessor: "purpose",
          //     },
          //     {
          //       Header: "Total Paid",
          //       accessor: "amount",
          //     },
          //     {
          //       Header: "Management Fees & Taxes",
          //       accessor: "managementExpense",
          //     },
          //     {
          //       Header: "Amount to Owner",
          //       accessor: "ownerAmount",
          //     },
          //   ],
          //   data2: tableData.expenseTableRows,
          //   columns2: [
          //     {
          //       Header: "Date",
          //       accessor: "year",
          //     },
          //     {
          //       Header: "Check",
          //       accessor: "",
          //     },
          //     {
          //       Header: "Transaction name",
          //       accessor: "transaction_name",
          //     },
          //     {
          //       Header: "Payee",
          //       accessor: "first_name",
          //     },
          //     {
          //       Header: "Owner Amount",
          //       accessor: "other_expenses",
          //     },
          //   ],
          // });
          break;
        case "Tenant Ledger":
          tableData = generateTenantLedgerTable(data);
          setTblCoulmns([
            {
              Header: "Date",
              accessor: "payment_date",
            },
            {
              Header: "Property",
              accessor: "address1",
            },
            {
              Header: "Tenant",
              accessor: "first_name",
            },
            {
              Header: "Charges",
              accessor: (row) => (row.transaction_type === "DEBIT" ? row.amount : 0),
            },
            {
              Header: "Payments",
              accessor: (row) => (row.transaction_type === "CREDIT" ? row.amount : 0),
            },
            {
              Header: "Balance",
              accessor: "balance",
            },
          ]);
          setTblData(tableData.rows);
          setTblTotal({
            columns: [
              {
                Header: "Charges",
                accessor: (props) => {
                  return props.charges.toFixed(2);
                },
              },
              {
                Header: "Payments",
                accessor: (props) => {
                  return props.payments.toFixed(2);
                },
              },
              {
                Header: "Balance",
                accessor: (props) => {
                  return props.balance.toFixed(2);
                },
              },
            ],
            data: [tableData.totalData],
            data2: [],
            columns2: [],
          });
          break;
        case "Property Tax Insight":
          setTblData(data);
          break;
        case "Income Statement":
          setTblData(data);
          break;
        case "Property Insurance Insight":
          setTblData(propData);
          break;
        case "General Ledger":
          setTblData(data);
          break;
        case "Rent Roll":
          setTblData(data);
          break;
        default:
          break;
      }

      setTimeout(() => {
        setIsLoad(true);
      }, 200);
      dispatch(setLoading(false));
    } catch (err) {
      console.log("Error while fetching report data", err);
      dispatch(setLoading(false));
    }
  };

  const customersData = () => {
    if (["Property Insurance Insight", "Property Tax Insight", "Net Cash Flow"]?.includes(reportTypes.type)) {
      return tblData;
    } else if (reportTypes.type === "General Ledger") {
      const exportLedgerData = [];
      tblData?.map((i) => {
        let Obj = {};
        Obj["Date"] = moment(i.payment_date?.split("T")[0]).format("MM/DD/YYYY");
        Obj["Payer/Payee"] = i.payee_name;
        Obj["Description"] = i.note;
        Obj["Payment Method"] = i?.transaction_id ? "BANK" : "CASH";
        Obj["Parent Category"] = i.parent_category;
        Obj["Sub-Category"] = i.category;
        Obj["Amount"] = formatMoney(i.amount);
        Obj["Portfolio"] = i.portfolio_name;
        Obj["Property"] = i.address1;
        Obj["Unit"] = i.unit_name;
        Obj["Source Bank"] = i.bank_name;
        Obj["Bank Account Name"] = i.card_name;
        exportLedgerData.push(Obj);
      });
      return exportLedgerData;
    } else if (reportTypes.type === "Rent Roll") {
      const exportLedgerData = [];

      tblData?.properties?.map((item) => {
        exportLedgerData.push({ "Unit": item.portfolio }); // portfolio title
        item?.units?.map((i) => {
          let Obj = {};
          const tenant_name = `${i.first_name ? i.first_name : ""} ${i.last_name ? i.last_name : ""}`;
          Obj["Unit"] = i.unit_name;
          Obj["Bed/Bath"] = `${i?.bedrooms ? i?.bedrooms : "-"}/${i?.bathrooms ? i?.bathrooms : "-"}`;
          Obj["Current Tenant"] = i.first_name || i.last_name ? tenant_name : "-";
          Obj["Rent"] = i?.rent ? formatMoney(i?.rent) : "No Lease";
          Obj["Deposit"] = i?.security_deposit ? formatMoney(i?.security_deposit) : "-";
          Obj["Balance Due"] = i?.total_balance ? formatMoney(i?.total_balance) : "-";
          Obj["Lease Start"] = i?.rent
            ? i?.lease_start
              ? moment(i?.lease_start).format("MM/DD/YYYY")
              : "-"
            : "No Lease";
          Obj["Lease Expires"] = i?.rent
            ? i?.lease_type !== "Fixed"
              ? "MTV"
              : moment(i?.lease_end).format("MM/DD/YYYY")
            : "No Lease";
          exportLedgerData.push(Obj);
        });
      })
      return exportLedgerData;
    } else {
      return tblTotal.data, tblData;
    }
  };

  const exportPDF = () => {
    if (reportTypes.type === "Income Statement") {
      document.getElementById("exportDiv").style.width = "3000px";
    } else if (reportTypes.type === "Property Tax Insight") {
      document.getElementById("exportDiv").style.width = "1500px";
    } else {
      document.getElementById("exportDiv").style.width = "2000px";
    }
    pdfExportComponent.current.save();
    document.getElementById("exportDiv").style.width = "100%";
  };

  const disabledReport = () => {
    if (
      ["Property Insurance Insight", "Property Tax Insight", "Income Statement", "Net Cash Flow", "General Ledger", "Rent Roll"]?.includes(
        reportTypes.type
      )
    ) {
      return Object.keys(Object.assign({}, tblData))?.length <= 0;
    } else if (["Schedule of Real Estate Owned", "Tenant Ledger"]?.includes(reportTypes.type)) {
      return Object.keys(Object.assign({}, tblData))?.length <= 0 && tblTotal.data.length === 0;
    } else if (["Owner Statement", "Income Statement"]?.includes(reportTypes.type)) {
      return (
        Object.keys(Object.assign({}, tblData))?.length <= 0 &&
        tblTotal.data.length === 0 &&
        tblTotal.data2.length === 0
      );
      // }
      //  else if (reportTypes.type === "Net Cash Flow") {
      //   return Object.keys(Object.assign({}, tblData))?.length <= 0 && tblTotal.data.length === 0 &&
      //     tblTotal.data2.length === 0 && subTblData.subData.length === 0 && subTblData.subData2.length === 0
      // }
    } else {
      return true;
    }
  };

  return (
    <Container title="Reports">
      <Row>
        <Col md="6" lg="4" xl="3">
          <Form.Group className="mb-3">
            <Form.Label>Report Type*</Form.Label>
            <Select
              options={reportOptions.map((item) => ({ label: item.type, value: item.type }))}
              placeholder="Select Report Type"
              onChange={(data) => {
                setTblData([]);
                setIsLoad(false);
                setTblTotal({
                  data: [],
                  columns: [],
                  columns2: [],
                  data2: [],
                });
                setReportTypes(reportOptions.find((item) => item.type === data.value));
              }}
              value={reportTypes.type ? { label: reportTypes.type } : null}
              components={{ DropdownIndicator }}
              isClearable
              isSearchable
              classNamePrefix="form-select"
            />
          </Form.Group>
        </Col>
        <Col md="6" lg="4" xl="3">
          <Form.Label>Portfolio*</Form.Label>
          <Select
            options={[
              ...currentdata.map((item) => ({
                label: item.portfolio_name,
                icon: item?.is_collaborator === 1 ? require("../Assets/images/sharedIcon.svg").default : "",
                value: item.portfolio_id,
              })),
              { label: "+ Add new Portfolio", value: "add portfolio" },
            ]}
            placeholder="Select Portfolio"
            onChange={(data) => {
              if (data?.value === "add portfolio") {
                navigate("/PortfolioAdd");
              } else {
                setSelectedPortfolio(currentdata.find((item) => item?.portfolio_id === data?.value));
              }
            }}
            value={selectedPortfolio?.label}
            components={{
              DropdownIndicator,
              Option: IconOption,
            }}
            isClearable
            isSearchable
            classNamePrefix="form-select"
          />
        </Col>

        {DatePeriod.includes(
          reportTypes.type
        ) && (
            <>
              <Col md="6" lg="4" xl="3">
                <Form.Group className="mb-3">
                  <Form.Label>From</Form.Label>
                  <ReactDatePicker
                    className="form-control"
                    selected={selectedPeriod.startDate}
                    placeholderText="mm/dd/yyyy"
                    onChange={(date) => setSelectedPeriod({ ...selectedPeriod, startDate: date })}
                  />
                </Form.Group>
              </Col>
              <Col md="6" lg="4" xl="3">
                <Form.Group className="mb-3">
                  <Form.Label>To</Form.Label>
                  <ReactDatePicker
                    className="form-control"
                    selected={selectedPeriod.endDate}
                    placeholderText="mm/dd/yyyy"
                    onChange={(date) => setSelectedPeriod({ ...selectedPeriod, endDate: date })}
                  />
                </Form.Group>
              </Col>
            </>
          )}

        {reportTypes.exportable && (
          <Col md="6" lg="4" xl="3">
            <Form.Group className="mb-3">
              <Form.Label>Export as</Form.Label>
              <Form.Select value={selectedExport} onChange={(e) => setSelectedExport(e.target.value)}>
                <option hidden>Select Type</option>
                <option value="PDF">PDF</option>
                <option value="Excel">Excel or CSV</option>
              </Form.Select>
            </Form.Group>
          </Col>
        )}
        <Col md="3" lg="2" xl="1" className="d-flex mt-2 align-items-center">
          <Button className="w-100p ps-lg-4" onClick={() => handleSubmit(true)}>
            Load
          </Button>
        </Col>
        {reportTypes?.exportable && (
          <Col md="3" lg="4" xl="2" className="d-flex mt-2 align-items-center">
            <Button
              className="ms-2 btn-reset btn-Download"
              size="sm"
              onClick={() => (selectedExport === "PDF" ? exportPDF() : exportExcel())}
              // disabled={(tblTotal.data || tblTotal.data2).length === 0 || tblData.length === 0 || !selectedExport}
              disabled={disabledReport()}
            >
              <DownloadIcon />
            </Button>
            <CSVLink
              data={customersData()}
              filename={`${reportTypes?.type?.replaceAll(" ", "")}.csv`}
              className="hidden"
              ref={csvLink}
              target="_blank"
            />
            <Button
              className="ms-2 btn-reset btn-Download"
              disabled={(tblTotal.data || tblTotal.data2).length === 0 || tblData.length === 0 || !selectedExport}
              size="sm"
            // onClick={() => {
            //   window.open(`mailto:user@example.com?subject=${reportTypes.type}&body=${reportTypes.type}`, "_blank");
            // }}
            >
              Send Report
            </Button>
          </Col>
        )}
      </Row>

      <PDFExport
        paperSize="auto"
        margin="0.5cm"
        fileName={`${reportTypes?.type?.replaceAll(" ", "")}.pdf`}
        ref={pdfExportComponent}
      >
        <div id="exportDiv">
          {reportTypes.type === "Property Insurance Insight" ? (
            <InsuranceInsightReport chartData={tblData} />
          ) : reportTypes.type === "Income Statement" ? (
            <IncomeStatement
              incomeData={tblData}
              startDate={selectedPeriod?.startDate}
              endDate={selectedPeriod?.endDate}
            // setIncomeCSV={setIncomeCSV}
            />
          ) : reportTypes.type === "Net Cash Flow" ? (
            isLoad && (
              <CashFlowReport data={tblData} startDate={selectedPeriod?.startDate} endDate={selectedPeriod?.endDate} />
            )
          ) : reportTypes.type === "Property Tax Insight" ? (
            <TexInsightReport data={tblData} />
          ) : reportTypes.type === "General Ledger" ? (
            <GeneralLedgerReport data={tblData} />
          ) : reportTypes.type === "Rent Roll" ? (
            <RentRollReport data={tblData} />
          ) : (
            <>
              <ReportTable columns={tblCoulmns} data={tblData} />
              <ReportTable
                columns={tblTotal.columns}
                data={tblTotal.data}
                label={reportTypes.type === "Net Cash Flow" ? "Income" : "Total"}
              />

              {reportTypes.type === "Net Cash Flow" && (
                <ReportTable columns={tblTotal.columns2} data={tblTotal.data2} label={"Expenses/Others"} />
              )}
            </>
          )}
        </div>
      </PDFExport>
    </Container>
  );
};

export default Reports;
