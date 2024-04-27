import React, { useEffect, useState } from "react";
import { Col, Modal, Form, Row, Button, Card, Dropdown, ListGroup, Breadcrumb } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { formatNumber, getId } from "../../Utility";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Select, { components } from "react-select";
import { ReactComponent as IconPdf } from "../../Assets/images/icon-pdf.svg";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { useCSVReader } from "react-papaparse";
import InstructionIcon from "../../Assets/images/danger.svg";
import UpdateImportTransaction from "./UpdateImportTransaction";
import { importTransactions } from "../../graphql/mutations";
import { API, graphqlOperation } from "aws-amplify";
import { setLoading } from "../../store/reducer";
import { fetchTransactions } from "../../Utility/ApiService";
import { getRdsData } from "../../graphql/queries";

const DropdownIndicator = (props) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <FontAwesomeIcon icon={props.selectProps.menuIsOpen ? faAngleUp : faAngleDown} />
      </components.DropdownIndicator>
    )
  );
};

const ImportTransaction = ({ showImport, setShowImport, categories, allTransactionCategories, allCategories }) => {
  const dispatch = useDispatch();
  const [selectedProperty, setSelectedProperty] = useState();
  const [acceptedFiles1, setAcceptedFiles] = useState();
  const [fetchedTransactions, setFetchedTransactions] = useState({});
  const [fileData, setFileData] = useState();
  const [transactionsData, setTransactionsData] = useState([]);
  const [importTransactionModal, setImportTransactionModal] = useState(false);

  const [importError, setImportError] = useState({
    counts: {
      success: 0,
      categoryFailed: 0,
      dateFailed: 0,
      portfolioFailed: 0,
      amountFailed: 0,
      propertyFailed: 0,
      duplicate: 0,
    },
    errors: {},
  });
  const [transactionRecordModal, setTransactionRecordModal] = useState(false);
  const [importAlertData, setImportAlertData] = useState({
    importSuccessAlertData: "",
    importErrorAlertData: [],
  });
  const [updateTransactionModal, setUpdateTransactionModal] = useState(false);
  const [updateTransactionData, setUpdateTransactionData] = useState();
  const [renderImportSuccessModal, setRenderImportSuccessModal] = useState(false);
  const [allPropertyArr, setAllPropertyArr] = useState([]);

  const allTransactions = useSelector(({ allTransactions }) => allTransactions);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const allPortfolio = useSelector(({ allPortfolioList }) => allPortfolioList);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const selectDocumentProperty = allProperties.find((i) => i.id === selectedProperty?.value);
  const selectedPortfolio = allPortfolio.find((p) => p.id === selectDocumentProperty?.portfolio_id);

  const { CSVReader } = useCSVReader();

  function formatAmount(amount) {
    const ab = Math.abs(amount);
    if (amount < 0) {
      return "-" + formatNumber(ab);
    } else {
      return formatNumber(amount);
    }
  }

  useEffect(() => {
    getAllUserProperty();
  }, []);

  useEffect(() => {
    const transactions = {};
    allTransactions?.map((t) => {
      if (transactions[t?.amount]) {
        transactions[t?.amount].push(t);
      } else {
        transactions[t?.amount] = [t];
      }
    });
    setFetchedTransactions(transactions);
  }, [allTransactions]);

  const getAllUserProperty = async () => {
    try {
      let portfolios = [];
      const res = await API.graphql(
        graphqlOperation(getRdsData, {
          name: loggedUserData.user_role === "Property Owner" ? "sharedPortfolioOwner" : "sharedPortfolio",
          data: JSON.stringify({
            userId: loggedUserData.id,
            email: loggedUserData.email,
          }),
        })
      );
      portfolios = JSON.parse(res.data.getRdsData.response);

      if (portfolios.length > 0) {
        const portfolioIds = [];
        const portfolioInfo = portfolios.map((p) => {
          portfolioIds.push(p.id);
          return {
            ...p,
            text: p.portfolio_name,
          };
        });

        const propertyWithUnits = await API.graphql(
          graphqlOperation(getRdsData, {
            name: "propertyWithUnits",
            data: JSON.stringify({
              portfolioIds: portfolioIds,
            }),
          })
        );
        const isPropertyExists = {};
        const propertyArr = [];
        let props = JSON.parse(propertyWithUnits.data.getRdsData.response);

        props?.map((property) => {
          if (!isPropertyExists[property.id]) {
            isPropertyExists[property.id] = true;
            propertyArr.push({
              text: property.address1,
              id: property.id,
              portfolio_id: property.portfolio_id,
              property_type: property.property_type,
              portfolio_name: property?.portfolio_name,
              address1: property.address1,
              city: property.city,
              state: property.state,
              zipcode: property.zipcode,
            });
          }
        });

        setAllPropertyArr(propertyArr);
      }
    } catch (err) {
      console.log("List Portfolios Error", err);
    } finally {
      setLoading(false);
    }
  };

  const fileSize = (bytes) => {
    const k = 1000;
    const sizes = ["bytes", "kb", "mb", "gb", "tb", "pb", "eb", "zb", "yb"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const PortfolioOptions = () => {
    var results = allProperties.reduce(function (results, org) {
      (results[org.portfolio_id] = results[org.portfolio_id] || []).push(org);
      return results;
    }, {});

    if (results) {
      const SubOptions = Object.keys(results)?.map((key) => {
        const propertyGroup = results[key]?.map((d) => {
          return { label: d.address1, value: d.id };
        });
        const findPortfolioData = allPortfolio.find((item) => item.id === Number(key));
        return { ["portfolio_name"]: findPortfolioData?.portfolio_name, ["options"]: propertyGroup };
      });

      var portfolioGroup = SubOptions?.map((item) => {
        if (item?.portfolio_name) {
          return { label: item?.portfolio_name, options: item?.options ? item?.options : [] };
        }
      });
    }
    return portfolioGroup?.filter((data) => data);
  };

  const readImportData = async () => {
    try {
      const transactions = [];
      const data = fileData?.data;
      data.pop();

      if (data.length <= 1) {
        toast.error("No transactions found!");
      }

      const headers = {};
      data[0]?.forEach((h, i) => {
        switch (h?.toLowerCase()) {
          case "date":
            headers["date"] = i;
            break;
          case "category":
            headers["category"] = i;
            break;
          case "amount":
            headers["amount"] = i;
            break;
          case "property":
            headers["property"] = i;
            break;
          case "portfolio":
            headers["portfolio"] = i;
            break;
          case "description":
            headers["description"] = i;
            break;
          default:
            break;
        }
      });

      let allImportErrors = {};
      let errorCounts = {
        success: 0,
        categoryFailed: 0,
        dateFailed: 0,
        portfolioFailed: 0,
        amountFailed: 0,
        propertyFailed: 0,
        duplicate: 0,
      };

      let existedTransactions = {};
      for (let i = 1; i < data.length; i++) {
        let importedDate = data[i][headers.date]?.toString()?.trim();
        let importedProperty = data[i][headers.property]?.toString()?.trim();
        let importedPortfolio = data[i][headers.portfolio]?.toString()?.trim();

        let importedCategory = data[i][headers.category]?.toString()?.trim();
        let importedAmount = data[i][headers.amount]?.toString()?.trim();
        importedAmount = parseFloat(importedAmount?.includes("$") ? importedAmount?.split("$")[1] : importedAmount);
        let importedNote = data[i][headers.description]?.toString()?.trim();
        importedProperty = !importedProperty && !importedPortfolio ? selectedProperty?.label : importedProperty;
        importedPortfolio =
          selectedProperty?.value && !importedPortfolio ? selectedPortfolio?.portfolio_name : importedPortfolio;

        let transactionErrors = {};

        let date = null;
        let property = null;
        let portfolio = null;
        let category = null;
        let findProp = null;
        let hasError = false;
        let transactionId = getId();

        if (!importedDate) {
          transactionErrors["date"] = "Date is required";
        } else {
          const d = moment(importedDate);
          if (d.isValid()) {
            importedDate = d.format("MM/DD/YYYY");
            date = d;
          } else {
            transactionErrors["date"] = "Invalid date";
          }
        }

        if (importedProperty) {
          findProp = null;
          allPropertyArr?.map((p) => {
            const importedAddress = importedProperty?.toLowerCase();
            const checkAddress = p?.text?.toLowerCase();
            const checkCity = p?.state?.toLowerCase();
            const checkZip = p?.zipcode;
            const checkPortfolio = p?.portfolio_name?.toLowerCase();

            if (importedAddress?.includes(checkAddress)) {
              let checkingPoints = 1;
              if (importedAddress?.includes(checkCity)) {
                checkingPoints += 1;
              }
              if (importedAddress?.includes(checkZip)) {
                checkingPoints += 1;
              }
              if (importedPortfolio?.toLowerCase()?.includes(checkPortfolio)) {
                checkingPoints += 1;
              }
              if (!findProp || (findProp && findProp?.checkingPoints < checkingPoints)) {
                findProp = { ...p, checkingPoints };
              }
            }
          });

          if (findProp) {
            property = findProp;
            if (!importedPortfolio) {
              portfolio = {
                id: findProp.portfolio_id,
                name: findProp?.portfolio_name,
                text: findProp?.portfolio_name,
                portfolio_id: findProp.portfolio_id,
              };
            }
          } else {
            transactionErrors["property"] = "Invalid property";
          }
        }

        if (importedProperty && importedPortfolio) {
          if (findProp?.portfolio_name?.toLowerCase() !== importedPortfolio?.toLowerCase()) {
            transactionErrors["portfolio"] = "Invalid property or portfolio";
          }
        }

        if (!selectedProperty?.label && !importedProperty) {
          transactionErrors["property"] = "Property is required";
        }

        if (importedPortfolio) {
          const finPortfolio = allPortfolio?.find(
            (p) => p?.portfolio_name?.toLowerCase() === importedPortfolio?.toLowerCase()
          );
          if (finPortfolio) {
            portfolio = finPortfolio;
          } else {
            transactionErrors["portfolio"] = "Invalid portfolio";
          }
        }

        if (!importedAmount) {
          transactionErrors["amount"] = "Amount is required";
        }
        if (importedAmount === 0) {
          transactionErrors["amount"] = "Invalid amount";
        }

        if (importedCategory) {
          const findCat = allTransactionCategories?.find(
            (c) => c?.category?.toLowerCase() === importedCategory?.toLowerCase() && c?.parent
          );
          if (findCat) {
            category = findCat;
          } else {
            transactionErrors["category"] = "Invalid category";
          }
        }

        // else {
        //   transactionErrors['category'] = 'Category is required';
        // }

        if (Object.keys(transactionErrors).length) {
          const errorKeys = Object.keys(transactionErrors);
          if (errorKeys.includes("category")) {
            errorCounts = {
              ...errorCounts,
              categoryFailed: errorCounts.categoryFailed + 1,
            };
          }
          if (errorKeys.includes("date")) {
            errorCounts = {
              ...errorCounts,
              dateFailed: errorCounts.dateFailed + 1,
            };
          }
          if (errorKeys.includes("property") || errorKeys.includes("portfolio")) {
            errorCounts = {
              ...errorCounts,
              propertyFailed: errorCounts.propertyFailed + 1,
            };
          }
          // if (errorKeys.includes('portfolio')) {
          //   errorCounts = {
          //     ...errorCounts,
          //     portfolioFailed: errorCounts.portfolioFailed + 1
          //   };
          // }
          if (errorKeys.includes("amount")) {
            errorCounts = {
              ...errorCounts,
              amountFailed: errorCounts.amountFailed + 1,
            };
          }
          hasError = true;
        }
        allImportErrors[transactionId] = transactionErrors;

        let isDuplicate = false;
        if (fetchedTransactions[String(Math.abs(importedAmount))] && !hasError) {
          const duplicateTransaction = fetchedTransactions[String(Math.abs(importedAmount))]?.find((t) => {
            let transactionDate = t?.payment_date?.split("T")[0];
            let duplicateDate = date?.format("YYYY-MM-DD");

            const dateMatch = transactionDate === duplicateDate;
            const amountMatch = importedAmount === t?.amount;
            const propertyMatch = String(t?.property_id) === String(property?.id);
            const categoryMatch = String(t?.transaction_category_id) === String(category?.id);

            return dateMatch && amountMatch && propertyMatch && categoryMatch;
          });
          if (duplicateTransaction) {
            isDuplicate = true;
          }
        }

        let existedTransactionKey = "";
        if (date && category?.id && String(Math.abs(importedAmount)) && property?.id) {
          existedTransactionKey = `${date}-${category?.id}-${importedAmount}-${property?.id}`;
          let isExists = existedTransactions[existedTransactionKey];
          if (isExists) {
            isDuplicate = true;
          } else {
            existedTransactions[existedTransactionKey] = true;
          }
        }
        if (date && !category?.id && String(Math.abs(importedAmount)) && property?.id) {
          existedTransactionKey = `${date}-${importedAmount}-${property?.id}`;
          let isExists = existedTransactions[existedTransactionKey];
          if (isExists) {
            isDuplicate = true;
          } else {
            existedTransactions[existedTransactionKey] = true;
          }
        }

        errorCounts = {
          ...errorCounts,
          duplicate: isDuplicate ? errorCounts.duplicate + 1 : errorCounts.duplicate,
          success: !hasError && !isDuplicate ? errorCounts.success + 1 : errorCounts.success,
        };

        transactions.push({
          id: transactionId,
          importedDate,
          importedAmount,
          importedCategory,
          importedProperty,
          importedPortfolio,
          importedNote,
          date: date,
          amount: importedAmount ? String(Math.abs(importedAmount)) : null,
          category: category?.id,
          property: property?.id,
          portfolio: portfolio?.id,
          note: importedNote,
          type: importedAmount > 0 ? "0" : "1",
          selectedProperty: property,
          selectedPortfolio: portfolio,
          selectedCategory: category,
          hasError,
          isDuplicate,
          index: i - 1,
        });
      }
      setImportError({
        counts: errorCounts,
        errors: allImportErrors,
      });
      setTransactionsData(transactions);
      setImportTransactionModal(true);
      // setTransactionData({ importTransaction: transactions, importTransactionModal: true });
      setShowImport(false);
    } catch (e) {
      console.log("Error while reading csv", e);
    }
  };

  const handleUpload = async () => {
    await readImportData();
  };

  const handleEdit = (item) => {
    setUpdateTransactionData(item);
    setUpdateTransactionModal(true);
    // setTransactionData({ ...transactionData, importTransactionModal: false });
    setImportTransactionModal(false);
  };

  const editTransaction = (editPayload) => {
    let isDuplicate = false;
    // const transactionId = editPayload?.id;
    const transactionId = updateTransactionData?.id;

    if (fetchedTransactions[String(Math.abs(editPayload.amount))]) {
      const duplicateTransaction = fetchedTransactions[String(Math.abs(editPayload.amount))]?.find((t) => {
        let transactionDate = t?.payment_date?.split("T")[0];
        let duplicateDate = moment(editPayload.date)?.format("YYYY-MM-DD");

        const dateMatch = transactionDate === duplicateDate;
        const amountMatch = String(Math.abs(editPayload.amount)) === String(t?.amount);
        const propertyMatch = String(t?.property_id) === String(editPayload?.property);
        let categoryMatch = String(t?.transaction_category_id) === String(editPayload?.category?.label);
        return dateMatch && amountMatch && propertyMatch && categoryMatch;
      });
      if (duplicateTransaction) {
        isDuplicate = true;
      }
    }
    // let duplicateDate = moment(editPayload.date)?.format("YYYY-MM-DD");

    const findDuplicateFromCsv = transactionsData?.find((t, idx) => {
      if (editPayload?.index === idx) {
        return false;
      }
      const dateMatch = moment(editPayload.date).format("X") === moment(t?.date).format("X");
      const propertyMatch = Number(editPayload?.property) == t?.property;
      const amountMatch = String(Math.abs(editPayload.amount)) == String(Math.abs(t.amount));
      let categoryMatch = true;
      if (editPayload?.category?.label) {
        categoryMatch = editPayload?.category?.label == t?.category;
      }
      return dateMatch && propertyMatch && amountMatch && categoryMatch;
    });

    if (findDuplicateFromCsv) {
      isDuplicate = true;
    }

    const updatedData = transactionsData?.find((i) => i.id === updateTransactionData?.id);
    const findProperty = allProperties.find((i) => i.id === Number(editPayload?.property));
    const findPortfolio = allPortfolio.find((i) => i.id === Number(editPayload?.portfolio));

    Object.keys(editPayload).map((key) => {
      switch (key) {
        case "amount":
          updatedData["amount"] = Number(editPayload[key]);
          updatedData["importedAmount"] = Number(editPayload[key]);
          break;

        case "category":
          updatedData["category"] = editPayload[key].value;
          updatedData["importedCategory"] = editPayload[key].label;
          // selectedCategory
          break;

        case "portfolio":
          updatedData["portfolio"] = findPortfolio?.id;
          updatedData["importedPortfolio"] = findPortfolio?.portfolio_name;
          break;

        case "property":
          updatedData["property"] = findProperty?.id;
          updatedData["importedProperty"] = findProperty?.address1;
          break;

        case "date":
          updatedData["date"] = moment(editPayload[key]).format("MM/DD/YYYY");
          updatedData["importedDate"] = moment(editPayload[key]).format("MM/DD/YYYY");
          break;

        case "note":
          updatedData["note"] = editPayload[key];
          updatedData["importedNote"] = editPayload[key];
          break;
      }
    });

    const editIndex = transactionsData?.findIndex((i) => i.id === updateTransactionData?.id);
    // const editIndex = editPayload?.index;
    const transactions = [...transactionsData];
    const isDuplicateTransaction = transactions[editIndex]?.isDuplicate;

    transactions[editIndex] = {
      ...updatedData,
      hasError: false,
      isDuplicate,
      ...(!updatedData?.category && { importedCategory: "" }),
    };

    // setTransactionData({
    //   ...transactionData,
    //   importTransaction: transactions,
    // });

    setTransactionsData(transactions);

    let errorCounts = {
      ...importError.counts,
    };

    if (isDuplicateTransaction && !isDuplicate) {
      errorCounts = {
        ...errorCounts,
        duplicate: errorCounts.duplicate - 1,
        success: errorCounts.success + 1,
      };
    } else if (!isDuplicateTransaction && isDuplicate) {
      errorCounts = {
        ...errorCounts,
        duplicate: errorCounts.duplicate + 1,
        success: errorCounts.success - 1,
      };
    }

    const errorFields = Object.keys(importError?.errors[transactionId]);

    if (errorFields.length) {
      if (errorFields.includes("category")) {
        errorCounts = {
          ...errorCounts,
          categoryFailed: errorCounts?.categoryFailed - 1,
        };
      }
      if (errorFields.includes("amount")) {
        errorCounts = {
          ...errorCounts,
          amountFailed: errorCounts?.amountFailed - 1,
        };
      }
      if (errorFields.includes("property")) {
        errorCounts = {
          ...errorCounts,
          propertyFailed: errorCounts?.propertyFailed - 1,
        };
      }
      if (errorFields.includes("portfolio")) {
        errorCounts = {
          ...errorCounts,
          portfolioFailed: errorCounts?.portfolioFailed - 1,
        };
      }
      if (errorFields.includes("date")) {
        errorCounts = {
          ...errorCounts,
          dateFailed: errorCounts?.dateFailed - 1,
        };
      }

      errorCounts = {
        ...errorCounts,
        success: errorCounts?.success + 1,
      };
    }

    setImportError({
      counts: errorCounts,
      errors: { ...importError.errors, [transactionId]: {} },
    });
    setUpdateTransactionData();
  };

  const removeTransaction = (item) => {
    const transactions = [...transactionsData];
    let errorCounts = {
      ...importError.counts,
    };
    // const deleteTransaction = transactions[item?.index];
    const errorData = { ...importError.errors };
    const transactionId = item?.id;

    if (item?.hasError || item?.isDuplicate) {
      const errorFields = Object.keys(errorData[transactionId]);
      if (errorFields.length) {
        if (errorFields.includes("category")) {
          errorCounts = {
            ...errorCounts,
            categoryFailed: errorCounts?.categoryFailed - 1,
          };
        }
        if (errorFields.includes("amount")) {
          errorCounts = {
            ...errorCounts,
            amountFailed: errorCounts?.amountFailed - 1,
          };
        }
        if (errorFields.includes("property")) {
          errorCounts = {
            ...errorCounts,
            propertyFailed: errorCounts?.propertyFailed - 1,
          };
        }
        if (errorFields.includes("portfolio")) {
          errorCounts = {
            ...errorCounts,
            portfolioFailed: errorCounts?.portfolioFailed - 1,
          };
        }
        if (errorFields.includes("date")) {
          errorCounts = {
            ...errorCounts,
            dateFailed: errorCounts?.dateFailed - 1,
          };
        }
        delete errorData[transactionId];
      }
      if (item?.isDuplicate) {
        errorCounts = {
          ...errorCounts,
          duplicate: errorCounts?.duplicate - 1,
        };
      }
    } else {
      errorCounts = {
        ...errorCounts,
        success: errorCounts?.success - 1,
      };
      delete errorData[transactionId];
    }

    setImportError({
      counts: errorCounts,
      errors: errorData,
    });

    const filteredData = transactions.filter((i) => {
      return i.id !== item?.id;
    });

    // setTransactionData({ ...transactionData, importTransaction: filteredData });
    setTransactionsData(filteredData);

    if (filteredData?.length <= 0) {
      setShowImport(true);
      // setTransactionData({ importTransactionModal: false });
      setImportTransactionModal(false);
    }
  };

  const checkImportedTransactions = () => {
    let importErrorAlert = [];
    try {
      // setTransactionData({ ...transactionData, importTransactionModal: false });
      setImportTransactionModal(false);

      setTransactionRecordModal(true);

      importError?.counts?.portfolioFailed + importError?.counts?.propertyFailed > 0 &&
        importErrorAlert.push({
          message: "Could not find portfolio or property",
          totalRecords: importError?.counts?.portfolioFailed + importError?.counts?.propertyFailed,
        });

      importError?.counts?.categoryFailed > 0 &&
        importErrorAlert.push({
          message: "Could not find Transaction Categories",
          totalRecords: importError?.counts?.categoryFailed,
        });

      importError?.counts?.dateFailed > 0 &&
        importErrorAlert.push({
          message: "Could not find Dates",
          totalRecords: importError?.counts?.dateFailed,
        });

      importError?.counts?.amountFailed > 0 &&
        importErrorAlert.push({
          message: "Could not find Amounts",
          totalRecords: importError?.counts?.amountFailed,
        });

      importError?.counts?.duplicate > 0 &&
        importErrorAlert.push({
          message: "Duplicate transactions identified",
          totalRecords: importError?.counts?.duplicate,
        });

      setImportAlertData({
        importSuccessAlertData: importError?.counts?.success,
        importErrorAlertData: importErrorAlert,
      });
    } catch (e) {
      console.log("Error while validating transactions =>", e);
    }
  };

  const TransactionRecordSubmit = async () => {
    try {
      dispatch(setLoading(true));
      const validTransactions = [];
      transactionsData?.map((t) => {
        if (!t.hasError && !t.isDuplicate) {
          validTransactions.push({
            category: t?.category,
            property: t?.property,
            note: t?.note?.trim(),
            date: moment(t?.date).format("YYYY-MM-DD"),
            portfolio: t?.portfolio,
            type: t?.type,
            amount: Math.abs(t?.amount),
          });
        }
      });

      if (validTransactions?.length === transactionsData?.length) {
        let res = await API.graphql(
          graphqlOperation(importTransactions, {
            userId: loggedUserData.id,
            timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
            transactions: JSON.stringify(validTransactions),
          })
        );
        res = res?.data?.importTransactions;

        if (res.status === 200) {
          res = JSON.parse(res.response);
          setRenderImportSuccessModal(true);
          setImportError({
            counts: {
              success: res?.importedRecords,
              categoryFailed: 0,
              dateFailed: 0,
              portfolioFailed: 0,
              amountFailed: 0,
              propertyFailed: 0,
            },
            errors: {},
          });
        } else {
          toast.error("Something went wrong!");
        }
        setTransactionRecordModal(false);
      } else {
        toast.error("Please fix the transactions!");
      }
      dispatch(fetchTransactions());
      // setTransactionRecordModal(false);
      dispatch(setLoading(false));
    } catch (e) {
      dispatch(setLoading(false));
      toast.error("Something went wrong!");
      console.log("Error on submit", e);
    }
  };
  const [showTooplip, setshowTooplip] = useState(false);
  const handleClose = () => setshowTooplip(false);
  const handleShow = () => setshowTooplip(true);

  return (
    <div>
      <Modal show={showImport} onHide={() => setShowImport(false)} centered className="modal-v1 border-radius-16">
        <Modal.Header className="">
          <Modal.Title as="h3" className="w-100 text-center">
            Import Transactions
          </Modal.Title>
          <img
            src={require("../../Assets/images/tooltip.svg").default}
            className="position-absolute pointer"
            style={{ right: "22%" }}
            onClick={() => handleShow(true)}
          />
        </Modal.Header>
        <Modal.Body className="import-transaction">
          <CSVReader
            header={true}
            onUploadAccepted={(results) => {
              setFileData(results);
            }}
          >
            {({ getRootProps, acceptedFile, ProgressBar, getRemoveFileProps }) => {
              return (
                <>
                  <div {...getRootProps()} className="form-file-upload upload-docs mb-3">
                    <Form.Label className="label-file-upload 546">
                      <div>
                        <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                      </div>
                      <div style={{ display: "inline-grid" }}>
                        <span>Upload Document</span>
                        <span style={{ fontSize: "11px", fontWeight: 100 }}>
                          (CSV and Excel are the only file types supported)
                        </span>
                      </div>
                    </Form.Label>
                  </div>
                  {acceptedFiles1 || acceptedFile ? (
                    <div className="d-flex mb-3 justify-content-between align-items-center">
                      <div>
                        <IconPdf />
                      </div>
                      <div className="d-flex mx-2 align-items-center">
                        <span>{acceptedFile?.name}</span>
                        {setAcceptedFiles(acceptedFile)}
                        <span className="text-muted ms-2">{fileSize(acceptedFile?.size)}</span>
                      </div>
                      <div
                        className="pointer"
                        onMouseDown={() => {
                          // const sortedFile = acceptedFiles1?.filter((item) => item !== acceptedFiles1[index]);
                          setAcceptedFiles();
                        }}
                        {...getRemoveFileProps()}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M0.73624 0.731357C0.345722 1.12188 0.345743 1.75507 0.73624 2.14557L3.56467 4.974L0.73624 7.80242C0.345722 8.19294 0.345743 8.82614 0.73624 9.21664C1.12674 9.60714 1.75994 9.60716 2.15045 9.21664L4.97888 6.38821L7.80731 9.21664C8.1978 9.60714 8.831 9.60716 9.22152 9.21664C9.61204 8.82612 9.61202 8.19292 9.22152 7.80242L6.39309 4.974L9.22152 2.14557C9.61204 1.75505 9.61202 1.12185 9.22152 0.731357C8.83102 0.34086 8.19783 0.340839 7.80731 0.731357L4.97888 3.55978L2.15045 0.731357C1.75996 0.34086 1.12676 0.340839 0.73624 0.731357Z"
                            fill="#FF5050"
                          />
                        </svg>
                      </div>
                    </div>
                  ) : null}
                </>
              );
            }}
          </CSVReader>

          <div className="mt-4">Assign all transactions in this file to the following Portfolio or Property:</div>
          <Col md="12" xl="12">
            <Form.Group className="mb-3">
              <Select
                options={PortfolioOptions()}
                placeholder="Select Property"
                onChange={(data) => {
                  setSelectedProperty(data);
                }}
                components={{ DropdownIndicator }}
                isClearable
                isSearchable
                // isMulti
                closeMenuOnSelect={true}
                classNamePrefix="form-select"
              />
            </Form.Group>
          </Col>
        </Modal.Body>
        <Modal.Footer>
          <div className="container m-0 p-0">
            <Row>
              <Col xs={6}>
                <Button
                  className="btn-reset w-100"
                  onClick={() => {
                    setShowImport(false);
                    setAcceptedFiles();
                  }}
                >
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="w-100" onClick={handleUpload} disabled={acceptedFiles1?.name ? false : true}>
                  Upload File
                </Button>
              </Col>
            </Row>
          </div>
        </Modal.Footer>
      </Modal>
      <Modal show={showTooplip} onHide={handleClose} centered className="confirm-model modal-v1 border-radius-16">
        <Modal.Header closeButton>
          <Modal.Title as="h3" className="w-100 text-center">
            Import Transactions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            CSV files are the only file types supported at this time. For success imports kindly verify that your import
            file matches the Foliolens import template accessible from the knowledge base.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleClose} className="w-100">
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={importTransactionModal}
        // onHide={() => setTransactionData({ importTransactionModal: false })}
        centered
        className="modal-v1 border-radius-16"
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Import Transactions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="import-transaction">
          {transactionsData?.length !== importError?.counts?.success && (
            <div className="fw-bold mb-3" style={{ color: "#FF5050" }}>
              {"We processed your file but some items need your \nattention. Fix these by editing the transaction."}
            </div>
          )}
          {transactionsData?.map((item, index) => {
            const error = importError?.errors[item?.id];
            return (
              <Card
                key={index}
                className="mb-3 border-0"
                style={{
                  backgroundColor: item?.hasError ? "#FFEEEE" : item?.isDuplicate ? "#FEF8F0" : "#FFFFFF",
                }}
              >
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between align-items-start">
                      <div className="fw-bold" style={{ color: "#FF5050", fontSize: "12px" }}>
                        {item?.isDuplicate ? "Duplicate identified" : ""}
                      </div>
                      <div>
                        <Dropdown className="no-caret">
                          <Dropdown.Toggle className="p-0 no-clr">
                            <img src={require("../../Assets/images/icon-toggle-btn.svg").default} alt="" />
                          </Dropdown.Toggle>

                          <Dropdown.Menu align="end">
                            <Dropdown.Item className="edit" onClick={() => handleEdit(item)}>
                              <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item className="delete" onClick={() => removeTransaction(item)}>
                              <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                              Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item className="pt-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold">
                          Date
                          {error?.date && (
                            <img
                              src={InstructionIcon}
                              alt=""
                              className="pointer"
                              style={{
                                marginLeft: "5px",
                                width: "15px",
                              }}
                            />
                          )}
                        </span>
                        <span className="text-end">{item?.importedDate}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item className="pt-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold">
                          Amount
                          {error?.amount && (
                            <img
                              src={InstructionIcon}
                              alt=""
                              className="pointer"
                              style={{
                                marginLeft: "5px",
                                width: "15px",
                              }}
                            />
                          )}
                        </span>
                        <span className="text-end">{formatAmount(item?.importedAmount) || ""}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item className="pt-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold">
                          Category
                          {error?.category && (
                            <img
                              src={InstructionIcon}
                              alt=""
                              className="pointer"
                              style={{
                                marginLeft: "5px",
                                width: "15px",
                              }}
                            />
                          )}
                        </span>
                        <span className="text-end">{item?.importedCategory}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item className="pt-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold">
                          Property
                          {error?.property && (
                            <img
                              src={InstructionIcon}
                              alt=""
                              className="pointer"
                              style={{
                                marginLeft: "5px",
                                width: "15px",
                              }}
                            />
                          )}
                        </span>
                        <span className="text-end">{item?.importedProperty}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item className="pt-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold">
                          Portfolio
                          {error?.portfolio && (
                            <img
                              src={InstructionIcon}
                              alt=""
                              className="pointer"
                              style={{
                                marginLeft: "5px",
                                width: "15px",
                              }}
                            />
                          )}
                        </span>
                        <span className="text-end">{item?.importedPortfolio}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item className="pt-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold">Description</span>
                        <span className="text-end">{item?.importedNote}</span>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <div className="container m-0 p-0">
            <Row>
              <Col xs={6}>
                <Button
                  className="btn-reset w-100"
                  onClick={() => {
                    // setTransactionData({ importTransactionModal: false });
                    setImportTransactionModal(false);
                    setTransactionsData([]);
                    setSelectedProperty();
                  }}
                >
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="w-100" onClick={checkImportedTransactions}>
                  Next
                </Button>
              </Col>
            </Row>
          </div>
        </Modal.Footer>
      </Modal>

      <UpdateImportTransaction
        updateTransactionModal={updateTransactionModal}
        setUpdateTransactionModal={setUpdateTransactionModal}
        updateTransactionData={updateTransactionData}
        categories={categories}
        allCategories={allCategories}
        editTransaction={editTransaction}
        setImportTransactionModal={setImportTransactionModal}
        setUpdateTransactionData={setUpdateTransactionData}
      />

      <Modal show={transactionRecordModal} centered className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Import Transactions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="import-transaction">
          <Card className="mb-2">
            <Card.Body className="p-0">
              <ListGroup>
                <ListGroup.Item className="d-flex justify-content-between">
                  <div>
                    <span>
                      <img src={require("../../Assets/images/taskIcon.svg").default} />
                    </span>
                    <span className="ms-2">Records without Errors</span>
                  </div>
                  <span className="fw-bold">{importAlertData?.importSuccessAlertData}</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          {importAlertData.importErrorAlertData?.length > 0 &&
            importAlertData.importErrorAlertData.map((i) => {
              return (
                <Card className="mb-2">
                  <Card.Body className="p-0">
                    <ListGroup>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div>
                            <img src={require("../../Assets/images/Instruction-error.svg").default} />
                          </div>
                          <div className="ms-2">
                            <span>Records with Potential Errors</span>
                            <div
                              style={{
                                color: "#FF5050",
                                fontSize: "12px",
                                fontWeight: 400,
                              }}
                            >
                              {i.message}
                            </div>
                          </div>
                        </div>
                        <span className="fw-bold" style={{ color: "#FF5050" }}>
                          {i.totalRecords}
                        </span>
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              );
            })}
          <p
            style={{
              fontWeight: "500",
              fontSize: 12,
            }}
            className="text-secondary pt-1"
          >
            Please fix errors before attempting to import the file or click Next to import records without errors
          </p>
        </Modal.Body>
        <Modal.Footer>
          <div className="container m-0 p-0">
            <Row>
              <Col xs={6}>
                <Button
                  className="btn-reset w-100"
                  onClick={() => {
                    setTransactionRecordModal(false);
                    // setTransactionData({ ...transactionData, importTransactionModal: true });
                    setImportTransactionModal(true);
                    // setSelectedProperty();
                  }}
                >
                  Back
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="w-100" onClick={TransactionRecordSubmit}>
                  Next
                </Button>
              </Col>
            </Row>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal
        show={renderImportSuccessModal}
        onHide={() => setRenderImportSuccessModal(false)}
        centered
        className="modal-v1 border-radius-16"
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Import Transactions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="import-transaction">
          <Card className="mb-2">
            <Card.Body className="p-0">
              <ListGroup>
                <ListGroup.Item className="d-flex justify-content-between">
                  <div>
                    <span>
                      <img src={require("../../Assets/images/taskIcon.svg").default} />
                    </span>
                    <span className="ms-2">Records have been imported successfully!</span>
                  </div>
                  <span className="fw-bold">{importAlertData?.importSuccessAlertData}</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <div className="container m-0 p-0">
            <Row>
              {/* <Col xs={6}>
                <Button
                  className="btn-reset w-100"
                  onClick={() => {
                    setSelectedProperty();
                    setRenderImportSuccessModal(false);
                  }}
                >
                  Back
                </Button>
              </Col> */}
              <Col xs={12}>
                <Button
                  className="w-100"
                  onClick={() => {
                    setSelectedProperty();
                    setRenderImportSuccessModal(false);
                  }}
                >
                  Done
                </Button>
              </Col>
            </Row>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ImportTransaction;
