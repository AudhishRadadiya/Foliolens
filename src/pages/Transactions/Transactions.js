import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Card, Col, Dropdown, ListGroup, Row, Table, Form } from "react-bootstrap";
import moment from "moment";
import Select, { components } from "react-select";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import ReactPaginate from "react-paginate";
import toast from "react-hot-toast";
import { API, graphqlOperation } from "aws-amplify";
import ReactDatePicker from "react-datepicker";
import { CSVLink } from "react-csv";

import PortfolioDropDown from "../../components/Portfolios/PortfolioDropDown";
import Container from "../../components/Layout/Container";
import { fetchTransactions, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import SearchBox from "../../components/Portfolios/SearchBox";
import AddEditTransaction from "./AddEditTransaction";
import rightArrow from "../../Assets/images/right-mini-arrow.jpg";
import { setLoading } from "../../store/reducer";
import { listLambdaResolver } from "../../graphql/queries";
import ImportTransaction from "./ImportTransaction";
import { useconfirmAlert } from "../../Utility/Confirmation";
import { ROLES, formatMoney } from "../../Utility";

const validationSchema = yup
  .object({
    categories: yup.string().required("Please select categories type for the transaction"),
    amounts: yup.string().required("Please select amounts type for the transaction"),
    selected_row: yup.array().of(yup.object().required()),
  })
  .required();

const DropdownIndicator = (props) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <FontAwesomeIcon icon={props.selectProps.menuIsOpen ? faAngleUp : faAngleDown} />
      </components.DropdownIndicator>
    )
  );
};

export default function Transactions() {
  const csvLink = useRef();
  const dispatch = useDispatch();

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });

  const { watch, setValue } = methods;

  const amount = watch("amounts");
  const categoriesFormVal = watch("categories");
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [show, setShow] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editData, setEditData] = useState();
  const [itemOffset, setItemOffset] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("All");
  const [checkedValues, setCheckedValues] = useState({});
  const [selectedName, setSelectedName] = useState([]);
  const [selected, setSelected] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: "",
    endDate: "",
  });
  const [allTransactionCategories, setAllTransactionCategories] = useState([]);
  const [deleteData, setDeleteData] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [collabData, setCollabData] = useState();
  const [exportCSVData, setExportCSVData] = useState([]);
  const [startDateError, setStartDateError] = useState(false)
  const [endDateError, setEndDateError] = useState(false)


  const allTransactions = useSelector(({ allTransactions }) => allTransactions);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const checkPermission = loggedUserData?.user_role === ROLES.Collaborator && collabData?.permission !== "Manage";

  const filterTransactions =
    selectedPortfolioId === "All"
      ? allTransactions
      : allTransactions.filter((t) => t.portfolio_id === selectedPortfolioId);

  const endOffset = itemOffset + 10 || 10;
  const currentItems = filterTransactions?.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(filterTransactions?.length / 10);
  const handlePageClick = (event) => {
    const newOffset = (event.selected * 10) % filterTransactions.length;
    setItemOffset(newOffset);
  };

  const searchData = currentItems?.filter(
    (item) =>
      ["address1", "payee_name", "portfolio_name"]
        .map((key) => (item[key] ? item[key]?.toLowerCase().includes(searchText?.toLowerCase()?.trim()) : ""))
        .filter((item) => item).length > 0
  );
  const allDatas = searchData?.map((office) => office.id);

  const resetFilter = () => {
    setSearchText("");
    setSelectedPeriod({
      startDate: "",
      endDate: "",
    });
    setValue("amounts", "");
    setValue("categories", "");
  };

  useEffect(() => {
    (async () => {
      try {
        dispatch(setLoading(true))
        if (selectedPeriod.startDate && selectedPeriod.endDate) {
          let params = { userId: loggedUserData.id };
          if (selectedPortfolioId !== "All") {
            params['portfolioId'] = selectedPortfolioId;
          }
          if (selectedPeriod.startDate && selectedPeriod.endDate) {
            params['startDate'] = moment(selectedPeriod.startDate).format('YYYY-MM-DD');
            params['endDate'] = moment(selectedPeriod.endDate).format('YYYY-MM-DD');
          }
          const ledgerData = await getRdsFN("generalLedger", params)
          const exportData = [];
          ledgerData?.map((i) => {
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
            exportData.push(Obj);
          });
          setExportCSVData(exportData);
        }
        dispatch(setLoading(false))
      } catch (error) {
        console.log("error", error);
        dispatch(setLoading(false))
      }
    })();
  }, [selectedPeriod]);

  const exportExcel = async () => {
    if (!selectedPeriod.startDate || !selectedPeriod.endDate) {
      setStartDateError(true)
      setEndDateError(true)
      return;
    }

    if (exportCSVData.length > 0) {
      csvLink?.current?.link.click();
    }
  };

  useEffect(() => {
    dispatch(fetchTransactions());
    getCategories();
    getCollaboratorData();
  }, []);

  const getCollaboratorData = async () => {
    const res = await getRdsFN("tbSelect", {
      source: "coll",
      email: loggedUserData.email,
    });
    setCollabData(res[0]);
  };

  const getCategories = async () => {
    try {
      let fetchedCategories = {};
      const res = await API.graphql(graphqlOperation(listLambdaResolver, { table: "TransactionCategory" }));
      const result = JSON.parse(res?.data?.listLambdaResolver?.response);

      if (result.length > 0) {
        const parentCategories = result?.filter((c) => !c.parent);
        const allCategory = result?.filter((c) => c.parent);
        setAllCategories(allCategory);
        parentCategories.map((parentCategory) => {
          fetchedCategories[parentCategory.id] = {
            name: parentCategory.category,
          };
        });

        result.map((c) => {
          if (c.parent) {
            fetchedCategories = {
              ...fetchedCategories,
              [c.parent]: {
                ...fetchedCategories[c.parent],
                [c.id]: { ...c },
              },
            };
          }
        });
      }
      setCategories(fetchedCategories);
      setAllTransactionCategories(result);
    } catch (err) {
      console.log("List categories Error", err);
    }
  };

  useEffect(() => {
    const dataIds = searchData.map((office) => office?.id);
    const checked = Object.assign(...dataIds.map((k) => ({ [k]: false })), { All: false });
    setCheckedValues(checked);
  }, [allTransactions]);

  const handleEdit = (item) => {
    if (checkPermission) {
      toast.error("You have been granted View Only permissions for this portfolio.");
    } else {
      setShow(true);
      setEditData(item);
    }
  };

  const filterData = () => {
    let amountData = [];

    const filteredData =
      selectedPeriod?.startDate && selectedPeriod?.endDate
        ? searchData.filter(
          (i) =>
            new Date(i.payment_date) >= new Date(selectedPeriod?.startDate) &&
            new Date(i.payment_date) <= new Date(selectedPeriod?.endDate)
        )
        : searchData;

    const categoryFilter = filteredData.filter((i) => (categoriesFormVal ? i.category === categoriesFormVal : true));
    if (amount === "0 - $100") {
      amountData = categoryFilter.filter((i) => i.amount >= 0 && i.amount <= 100);
    } else if (amount === "$100 - $500") {
      amountData = categoryFilter.filter((i) => i.amount >= 100 && i.amount <= 500);
    } else if (amount === "$500 - $2000") {
      amountData = categoryFilter.filter((i) => i.amount >= 500 && i.amount <= 2000);
    } else if (amount === "$2000 +") {
      amountData = categoryFilter.filter((i) => i.amount >= 2000);
    } else {
      amountData = categoryFilter;
    }
    return amountData;
  };

  const filteredData = filterData();

  const CategoryOptions = () => {
    let option1 = [];
    let option2 = [];
    let option3 = [];
    let option4 = [];

    Object.keys(categories)?.map((i) => {
      if (categories[i].name === "Income") {
        Object.keys(categories[i])?.map((item) => {
          categories[i][item]?.category &&
            option1.push({ label: categories[i][item]?.category, value: categories[i][item]?.category });
        });
      } else if (categories[i].name === "Expenses") {
        Object.keys(categories[i])?.map((item) => {
          categories[i][item]?.category &&
            option2.push({ label: categories[i][item]?.category, value: categories[i][item]?.category });
        });
      } else if (categories[i].name === "Transfer") {
        Object.keys(categories[i])?.map((item) => {
          categories[i][item]?.category &&
            option3.push({ label: categories[i][item]?.category, value: categories[i][item]?.category });
        });
      } else {
        Object.keys(categories[i])?.map((item) => {
          categories[i][item]?.category &&
            option4.push({ label: categories[i][item]?.category, value: categories[i][item]?.category });
        });
      }
    });

    return [
      { label: "Income", options: option1 },
      { label: "Expenses", options: option2 },
      { label: "Transfer", options: option3 },
      { label: "Security Deposit", options: option4 },
    ];
  };

  const handleDelete = (item) => {
    setDeleteData(item);
    setDeleteModal(true);
  };

  const deleteTransactionData = async (deleteData) => {
    try {
      dispatch(setLoading(true));
      await Promise.all(
        deleteData.length > 0 &&
        deleteData?.map((item) => {
          return updateRecordTB("Transaction", {
            id: item.id,
            active: 0,
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_by: loggedUserData?.id,
          });
        })
      );
      dispatch(fetchTransactions());
      setDeleteModal(false);
      dispatch(setLoading(false));
      setSelected([]);
    } catch (error) {
      console.log(error);
      dispatch(setLoading(false));
      setDeleteModal(false);
      toast.error("Please try again for delete the transaction");
    }
  };

  const handleAllCheck = () => {
    const checkedData = checkedValues;
    const keys = Object.keys(checkedValues);
    if (checkedData["All"] === true) {
      setSelected([]);
      setSelectedName([]);
      keys.forEach((element) => {
        if (element === "All") {
          checkedData[element] = false;
        } else {
          checkedData[element] = false;
        }
      });
    } else {
      setSelected(searchData);
      setSelectedName(["All", ...allDatas]);
      keys.forEach((element) => {
        if (element === "All") {
          checkedData[element] = true;
        } else {
          checkedData[element] = true;
        }
      });
    }
    setCheckedValues(checkedData);
  };

  const handleCheckbox = (e) => {
    if (e.target.name === "All") {
      handleAllCheck();
    } else {
      if (selectedName.includes("All")) {
        setSelected(selected.filter((i) => ![Number(e.target.name)].includes(i.id)));
        setSelectedName(selectedName.filter((i) => !["All", Number(e.target.name)].includes(i)));
        const checkedData = checkedValues;
        checkedData.All = false;
        checkedData[e.target.name] = false;
        setCheckedValues(checkedData);
      } else if (selectedName.includes(Number(e.target.name))) {
        setSelected(selected.filter((value) => value.id !== Number(e.target.value)));
        setSelectedName(selectedName.filter((value) => value !== Number(e.target.name)));
        const checkedData = checkedValues;
        checkedData[e.target.name] = false;
        setCheckedValues(checkedData);
      } else {
        setSelected([...selected, searchData.find((value) => value.id === Number(e.target.value))]);
        setSelectedName([...selectedName, Number(e.target.name)]);
        const checkedData = checkedValues;
        checkedData[e.target.name] = true;
        setCheckedValues(checkedData);
      }
    }
  };
  // const optionForCat = CategoryOptions();
  // const SelectCategoriesStyles = {
  //   control: (styles) => ({ ...styles }),
  //   option: (styles) => {
  //     return {
  //       ...styles,
  //       padding: "0px",
  //       paddingLeft: "10px",
  //       lineHeight: "46px",
  //     };
  //   },
  // };
  const onDelete = (deleteData) => {
    useconfirmAlert({
      onConfirm: () => {
        if (checkPermission) {
          toast.error("You have been granted View Only permissions for this portfolio.");
        } else {
          deleteTransactionData(deleteData);
        }
      },
      isDelete: true,
      title: "Delete Transaction?",
      dec: "Are you sure you want to delete this transaction? This action cannot be undone.",
    });
  };

  return (
    <Container title="Transactions ">
      <div className="mb-3 transactions">
        <div className="d-xl-flex justify-content-between align-items-center mb-0 mb-lg-4">
          <div className="mb-4 mb-xl-0">
            <PortfolioDropDown
              selectedPortfolioId={selectedPortfolioId}
              setSelectedPortfolioId={setSelectedPortfolioId}
            />
          </div>
          <div className="d-flex  mx-0 mx-xl-3">
            <SearchBox
              placeholder={"Search for a property or portfolio or Payer/Payee	"}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
          </div>
          <div className="transaction-content-btn d-flex mt-lg-3 mt-xl-0 mb-4 mb-xl-0 mt-0">
            <Button
              className={`btn btn-reset ${filterTransactions.length <= 0 && "opacity-50"} ${checkPermission && "text-white"
                }`}
              onClick={() => filterTransactions?.length > 0 && exportExcel()}
              disabled={checkPermission}
            >
              Export
            </Button>
            <CSVLink
              data={exportCSVData}
              filename={"Transactions.csv"}
              className="hidden"
              ref={csvLink}
              target="_blank"
            />
            <Button
              className={`mx-3 btn btn-reset ${checkPermission && "text-white"}`}
              onClick={() => setShowImport(true)}
              disabled={checkPermission}
            >
              Import
            </Button>
            <Button className="transaction-add-btn" onClick={() => setShow(true)} disabled={checkPermission}>
              Add
            </Button>
          </div>
        </div>
        <Row>
          <Col md="6" lg="4" xl="4">
            <Form.Group className={`mb-4 check ${startDateError ? "is-invalid" : ""}`}>
              <Form.Label>Start Date</Form.Label>
              <ReactDatePicker
                className="form-control"
                selected={selectedPeriod?.startDate}
                onChange={(date) => {
                  date && setStartDateError(false);
                  setSelectedPeriod({ ...selectedPeriod, startDate: date || "" })
                }}
                placeholderText="Select Start Date"
              />
              <Form.Text className="text-danger ml-2">{startDateError ? "Please select Start Date" : ""}</Form.Text>
            </Form.Group>
          </Col>
          <Col md="6" lg="4" xl="4">
            <Form.Group className={`mb-4 check ${endDateError ? "is-invalid" : ""}`}>
              <Form.Label>End Date</Form.Label>
              <ReactDatePicker
                className="form-control"
                selected={selectedPeriod?.endDate}
                onChange={(date) => {
                  date && setEndDateError(false);
                  setSelectedPeriod({ ...selectedPeriod, endDate: date || "" })
                }
                }
                placeholderText="Select End Date"
              />
              <Form.Text className="text-danger ml-2">{endDateError ? "Please select End Date" : ""}</Form.Text>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md="6" lg="4" xl="4">
            <Form.Group className="mb-4">
              <Select
                options={CategoryOptions()}
                placeholder="Select Categories"
                onChange={(data) => {
                  setValue("categories", data?.value, { shouldValidate: true });
                }}
                value={categoriesFormVal ? categoriesFormVal?.value : ""}
                components={{ DropdownIndicator }}
                isClearable
                isSearchable
                classNamePrefix="form-select"
              />
            </Form.Group>
          </Col>
          <Col md="6" lg="4" xl="4">
            <Form.Group className="mb-4">
              <Select
                options={[
                  {
                    label: "All Amounts",
                    options: [
                      { label: "0 - $100", value: "0 - $100" },
                      { label: "$100 - $500", value: "$100 - $500" },
                      { label: "$500 - $2000", value: "$500 - $2000" },
                      { label: "$2000 +", value: "$2000 +" },
                    ],
                  },
                ]}
                placeholder="Select Amounts"
                onChange={(data) => {
                  setValue("amounts", data?.value, { shouldValidate: true });
                }}
                value={amount ? amount?.value : ""}
                components={{ DropdownIndicator }}
                isClearable
                isSearchable
                classNamePrefix="form-select"
              />
            </Form.Group>
          </Col>
          <Col md="6" lg="4" xl="4">
            <Button className="btn-reset" onClick={resetFilter}>
              Reset Filter
            </Button>
          </Col>
        </Row>
      </div>
      <div className="mb-3 fw-bold d-flex justify-content-between">
        <div>List of Transactions</div>
        <div className="d-flex gap-3">
          <div
            className={selected.length <= 0 && "opacity-50"}
            style={{ color: "#FF5050", cursor: selected.length > 0 && "pointer" }}
            onClick={() => selected?.length > 0 && onDelete(selected)}
          >
            Delete
          </div>
          <div style={{ color: "#1646AA", cursor: "pointer" }} onClick={handleAllCheck}>
            {selected.length <= 0 ? "Select All" : "Unselect All"}
          </div>
        </div>
      </div>
      <div className="p-3 transaction_table_card">
        {filterTransactions.length > 0 ? (
          window.innerWidth > 1302 ? (
            <>
              <Table responsive="md" borderless={true}>
                <thead>
                  <tr className="text-muted ">
                    <td>
                      <Form.Check
                        name="All"
                        value={searchData.map(({ id }) => id)}
                        checked={checkedValues["All"]}
                        onChange={(e) => handleCheckbox(e)}
                      />
                    </td>
                    <td>Date</td>
                    <td>Description</td>
                    <td>Category</td>
                    <td>Property</td>
                    <td>Amount</td>
                    <td>Payer/Payee</td>
                    <td>Status</td>
                  </tr>
                </thead>
                <tbody className="table-body tenant-transaction">
                  {filteredData?.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <Col lg="12">
                          <Form.Check
                            name={item?.id}
                            value={item?.id}
                            checked={checkedValues[item?.id]}
                            onChange={(e) => handleCheckbox(e)}
                          />
                        </Col>
                      </td>
                      <td>
                        <Col lg="12">
                          <div>{moment(item?.payment_date?.split("T")[0]).format("MM/DD/YYYY")}</div>
                        </Col>
                      </td>

                      <td>
                        <Col lg="12">
                          <div>
                            <strong style={{ fontSize: "14px" }} className="one-line-clamp ">
                              {item?.note}
                            </strong>
                          </div>
                        </Col>
                      </td>

                      <td>
                        <Col lg="12">
                          {item?.parent_category ? (
                            <div>
                              <span>{item?.parent_category}</span>
                              <div>
                                <img src={rightArrow} alt="" className="me-1" />
                                <span style={{ fontSize: "12px" }} className="text-secondary">
                                  {item?.category}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span>{"Uncategorized"}</span>
                            </div>
                          )}
                        </Col>
                      </td>

                      <td>
                        <Col lg="12">
                          <div className="one-line-clamp">{item?.address1}</div>
                        </Col>
                      </td>

                      <td>
                        <Col lg="12">
                          <div>{formatMoney(item?.amount, item?.is_paid === 1)}</div>
                        </Col>
                      </td>

                      <td>
                        <Col lg="12">
                          <div>{item?.payee_name}</div>
                        </Col>
                      </td>

                      <td>
                        <Col lg="12" className="p-0 text-capitalize text-center">
                          <div
                            className="transaction-status"
                            style={{
                              color:
                                item?.status === "FAILED"
                                  ? "#FF5050"
                                  : item?.status === "CANCELLED"
                                    ? "#FF5050"
                                    : item?.status === "PENDING"
                                      ? "#B5A300"
                                      : item?.status === "SCHEDULED" && "#B5A300",
                              background:
                                item?.status === "FAILED"
                                  ? "#FFEEEE"
                                  : item?.status === "CANCELLED"
                                    ? "#FFEEEE"
                                    : item?.status === "PENDING"
                                      ? "#FBF8DD"
                                      : item?.status === "SCHEDULED" && "#FBF8DD",
                            }}
                          >
                            {item?.status?.toLowerCase()}
                          </div>
                        </Col>
                      </td>

                      <td>
                        <Col lg="12">
                          <Dropdown className="no-caret">
                            <Dropdown.Toggle className="p-0 no-clr" disabled={checkPermission}>
                              <img src={require("../../Assets/images/icon-toggle-btn.svg").default} alt="" />
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end">
                              <Dropdown.Item className="edit" onClick={() => handleEdit(item)}>
                                <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item
                                className="delete"
                                onClick={() => {
                                  if (item?.status !== "COMPLETED") {
                                    toast.error(
                                      "You cannot delete this transaction as it is being processed by the payment processor at this time."
                                    );
                                  } else {
                                    onDelete([item]);
                                  }
                                }}
                              >
                                {" "}
                                <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                                Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </Col>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {filteredData.length <= 0 && (
                <p style={{ color: "#DC3545" }} className="m-0 p-2 text-center">
                  No Transaction.
                </p>
              )}
            </>
          ) : (
            <div className="owner-list grid">
              {searchData.map((item, i) => (
                <Card className="owner-card border-0">
                  <Card.Body className="p-0">
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <Form.Check
                          name={item?.id}
                          value={item?.id}
                          checked={checkedValues[item?.id]}
                          onChange={(e) => handleCheckbox(e)}
                        />
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <div className="title text-secondary d-flex justify-content-between">
                          Date
                          <Dropdown className="no-caret">
                            <Dropdown.Toggle className="p-0 no-clr" disabled={checkPermission}>
                              <img src={require("../../Assets/images/icon-toggle-btn.svg").default} alt="" />
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end">
                              <Dropdown.Item className="edit" onClick={() => handleEdit(item)}>
                                <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item
                                className="delete"
                                onClick={() => {
                                  if (item?.status !== "COMPLETED") {
                                    toast.error(
                                      "You cannot delete this transaction as it is being processed by the payment processor at this time."
                                    );
                                  } else {
                                    // deleteTransactionData([item]);
                                    onDelete([item]);
                                  }
                                }}
                              >
                                <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                                Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                        <div> {item?.payment_date?.split("T")[0]} </div>
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <div className="title text-secondary">Description</div>
                        <div>{item?.note}</div>
                        <div style={{ fontSize: "12px" }} className="text-secondary">
                          {item?.note}
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <div className="title text-secondary">Category</div>
                        <span>{item?.parent_category}</span>
                        <div>
                          <img src={rightArrow} alt="" className="me-1" />
                          <span style={{ fontSize: "12px" }} className="text-secondary">
                            {item?.category}
                          </span>
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <div className="title text-secondary">Property</div>
                        <div>{item?.address1}</div>
                      </ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <ListGroup.Item>
                          <div className="title text-secondary">Amount</div>
                          <div>{`$${item?.amount}`}</div>
                          <div
                            className="transaction-status"
                            style={{
                              color:
                                item?.status === "FAILED"
                                  ? "#FF5050"
                                  : item?.status === "CANCELLED"
                                    ? "#FF5050"
                                    : item?.status === "PENDING"
                                      ? "#B5A300"
                                      : item?.status === "SCHEDULED" && "#B5A300",
                              background:
                                item?.status === "FAILED"
                                  ? "#FFEEEE"
                                  : item?.status === "CANCELLED"
                                    ? "#FFEEEE"
                                    : item?.status === "PENDING"
                                      ? "#FBF8DD"
                                      : item?.status === "SCHEDULED" && "#FBF8DD",
                            }}
                          >
                            {item?.status?.toLowerCase()}
                          </div>
                        </ListGroup.Item>
                        <div>
                          <ListGroup.Item className="d-flex gap-3">
                            <div>
                              <div className="title text-secondary">Payer/Payee</div>
                              <div className="d-flex gap-5">{item?.payee_name}</div>
                            </div>
                          </ListGroup.Item>
                        </div>
                      </div>
                    </ListGroup>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="empty text-center py-5">
            <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
          </div>
        )}
      </div>

      <AddEditTransaction
        show={show}
        setShow={setShow}
        editData={editData}
        setEditData={setEditData}
        allCategories={allCategories}
        CategoryOptions={CategoryOptions()}
      />

      <ImportTransaction
        showImport={showImport}
        setShowImport={setShowImport}
        categories={categories}
        allCategories={allCategories}
        allTransactionCategories={allTransactionCategories}
      />

      <div className="d-flex align-items-center gap-4">
        <ReactPaginate
          disabledClassName="disabled"
          initialPage={0}
          breakLabel="..."
          nextLabel=">"
          onPageChange={handlePageClick}
          pageCount={pageCount}
          pageRangeDisplayed={2}
          previousLabel="<"
          renderOnZeroPageCount={null}
          activeClassName="active"
          subContainerClassName="pages pagination"
          breakLinkClassName="page-link"
          containerClassName="pagination"
          pageClassName="page-item"
          pageLinkClassName="page-link"
          previousClassName="page-item"
          previousLinkClassName="page-link"
          nextClassName="page-item"
          nextLinkClassName="page-link"
        />
        {searchData.length > 0 && (
          <div className="text-secondary">{`${searchData?.length} of ${filterTransactions?.length} rows`}</div>
        )}
      </div>
    </Container>
  );
}
