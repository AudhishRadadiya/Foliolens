import React, { useEffect, useState } from "react";
import { Table, Col, Button, Modal, Card, ListGroup, Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../../store/reducer";
import { fetchBankAccounts, getRdsFN } from "../../Utility/ApiService";
import moment from "moment";
import PaginationInput from "../PaginationInput";
import AddOwnerPayment from "./AddOwnerPayment";
import OwnerSchedule from "./OwnerSchedule";
import { formatMoney } from "../../Utility";

const OwnerTransactions = ({ editOwnersData }) => {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [itemOffset, setItemOffset] = useState(0);
  const [transactionToggle, setTransactionToggle] = useState(false);
  const [ownerBanks, setOwnerBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sentAmountModal, setSentAmountModal] = useState(false);
  const [updateAmount, setUpdateAmount] = useState();

  const ownerId = editOwnersData?.id;
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);

  const endOffset = itemOffset ? itemOffset + 10 : 10;
  const currentItem = transactions?.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(transactions?.length / 10);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * 10) % transactions?.length;
    setItemOffset(newOffset);
  };

  useEffect(() => {
    if (ownerId) {
      getOwnerBankAccount();
      dispatch(fetchBankAccounts());
    }
    if (transactionToggle === true) {
      getScheduleTransactions();
    } else {
      getOwnerTransactions();
    }
  }, [ownerId]);

  const getOwnerTransactions = async () => {
    try {
      dispatch(setLoading(true));
      let response = await getRdsFN("pOwnerTransactions", {
        owner_id: ownerId,
      });

      if (response?.length) {
        let balance = [...response].reverse();
        balance.reduce((acc, value, i) => {
          if (value.transaction_type === "DEBIT") {
            balance[i] = { ...balance[i], balance: acc - value.transaction_amount };
            return acc - value.transaction_amount;
          } else {
            balance[i] = { ...balance[i], balance: acc + value.transaction_amount };
            return acc + value.transaction_amount;
          }
        }, 0);
        balance.reverse();
        setTransactions(balance);
      }

      dispatch(setLoading(false));
    } catch (err) {
      console.log("Something went wrong!", err);
      dispatch(setLoading(false));
    }
  };

  const getScheduleTransactions = async () => {
    try {
      dispatch(setLoading(true));
      const response = await getRdsFN("pScheduleTransactions", {
        owner_id: ownerId,
      });
      setTransactions(response);
      dispatch(setLoading(false));
    } catch (err) {
      console.log("Something went wrong!", err);
      dispatch(setLoading(false));
    }
  };

  const getOwnerBankAccount = async () => {
    const res = await getRdsFN("poBankAccounts", {
      owner_id: ownerId,
    });
    setOwnerBanks(res);
  };

  return (
    <div>
      <div className="transaction_table_card">
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <div className="d-flex gap-2 fw-bold mx-2">
            <div>Posted</div>
            <div className="notification-list-switch">
              <label className="theme-switch">
                <input
                  type="checkbox"
                  value={transactionToggle}
                  checked={transactionToggle}
                  onChange={(e) => {
                    setTransactions([]);
                    setTransactionToggle(e.target.checked);
                    if (e.target.checked) {
                      getScheduleTransactions();
                    } else {
                      getOwnerTransactions();
                    }
                  }}
                />
                <span className="theme-slider theme-round"></span>
              </label>
            </div>
            <div>Scheduled</div>
          </div>

          <div className="d-flex gap-4">
            <Button className="btn-reset" onClick={() => setScheduleModal(true)}>
              + Schedule Owner Distribution
            </Button>
            <Button className="btn-reset" onClick={() => setShow(true)}>
              + Add Owner Transaction
            </Button>
          </div>
        </div>
        {transactions?.length > 0 ? (
          <Table responsive="md" borderless={true}>
            <thead>
              {transactionToggle ? (
                <tr className="text-muted ">
                  <td>Transaction Number</td>
                  <td>Date</td>
                  <td>Distribution Date</td>
                  <td>Property management fee</td>
                  <td>Portfolio</td>
                  <td>Notes</td>
                  <td>Status</td>
                  <td>Balance</td>
                  <td>Updated balance</td>
                </tr>
              ) : (
                <tr className="text-muted ">
                  <td>Transaction Number</td>
                  <td>Date</td>
                  <td>Account</td>
                  <td>Transaction Category</td>
                  <td>Amount</td>
                  <td>Notes</td>
                  <td>Status</td>
                  <td>Balance</td>
                </tr>
              )}
            </thead>
            <tbody className="table-body tenant-transaction">
              {currentItem?.map((field) => (
                <tr style={{ borderBottom: "1px solid #EDEDED", height: "50px" }}>
                  <td className="align-middle">
                    <Col>
                      <div>{transactionToggle ? field?.id : field?.transaction_payment_id}</div>
                    </Col>
                  </td>
                  <td className="align-middle">
                    <Col>
                      <div>{moment(transactionToggle ? field?.created_at : field?.date).format("MM/DD/YYYY")}</div>
                    </Col>
                  </td>
                  <td className="align-middle">
                    <Col>
                      <div>
                        {transactionToggle
                          ? field?.distribution_date
                            ? moment(field?.distribution_date).format("MM/DD/YYYY")
                            : "-"
                          : field.transaction_type === "DEBIT"
                          ? "-"
                          : field?.account_number || field?.payment_mode || "-"}
                      </div>
                    </Col>
                  </td>
                  <td className="align-middle">
                    <Col>
                      <div>{transactionToggle ? field?.property_management_fee : field?.category}</div>
                    </Col>
                  </td>
                  <td className="align-middle">
                    <Col>
                      {transactionToggle ? (
                        <div>{allPortfolio.find((i) => i.id === field?.portfolio_id)?.portfolio_name}</div>
                      ) : (
                        <div className="d-flex" style={{ whiteSpace: "pre" }}>
                          <span>{formatMoney(field?.transaction_amount, field.transaction_type === "DEBIT")}</span>
                        </div>
                      )}
                    </Col>
                  </td>
                  <td className="align-middle">
                    <Col>
                      <div className="one-line-clamp">{transactionToggle ? field?.description : field?.note}</div>
                    </Col>
                  </td>
                  <td className="align-middle">
                    <Col>
                      {transactionToggle ? (
                        <span className="tenant-transactions-status">{field?.status?.toLowerCase()}</span>
                      ) : field.transaction_type === "DEBIT" ? (
                        <span className="tenant-transactions-status">-</span>
                      ) : (
                        <span
                          className="tenant-transactions-status"
                          style={{
                            backgroundColor:
                              field?.status?.toLowerCase() === "completed"
                                ? "#EEF8F3"
                                : ["cancelled", "failed"].includes(field?.status?.toLowerCase())
                                ? "#FFEEEE"
                                : field?.status?.toLowerCase() === "processed"
                                ? "#ffcc00"
                                : field?.status?.toLowerCase() === "pending" && "#ededed",
                            color:
                              field?.status?.toLowerCase() === "completed"
                                ? "#4FB980"
                                : ["cancelled", "failed"].includes(field?.status?.toLowerCase())
                                ? "#FF5050"
                                : field?.status?.toLowerCase() === "processed"
                                ? "#000000"
                                : field?.status?.toLowerCase() === "pending" && "#8c8c8c",
                          }}
                        >
                          {field?.status?.toLowerCase()}
                        </span>
                      )}
                    </Col>
                  </td>
                  <td className="align-middle">
                    <Col>
                      <div className={`${transactionToggle === false && "one-line-clamp"}`}>
                        {" "}
                        {formatMoney(field?.balance)}
                      </div>
                    </Col>
                  </td>
                  {transactionToggle && (
                    <td className="align-middle">
                      <Col>
                        <div> {field?.updated_balance_amount}</div>
                      </Col>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="empty text-center py-5">
            <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
          </div>
        )}

        <div className="d-flex align-items-center">
          <div>
            <PaginationInput pageCount={pageCount} handleClick={handlePageClick} />
          </div>
          <div>
            {transactions?.length > 0 && (
              <div className="text-secondary">{`${currentItem?.length} of ${transactions?.length} rows`}</div>
            )}
          </div>
        </div>
      </div>
      <Modal show={scheduleModal} onHide={() => setScheduleModal(false)} centered className="modal-v1 border-radius-16">
        <OwnerSchedule
          ownerBanks={ownerBanks}
          setUpdateAmount={setUpdateAmount}
          setScheduleModal={setScheduleModal}
          setSentAmountModal={setSentAmountModal}
          setTransactionToggle={setTransactionToggle}
          getScheduleTransactions={getScheduleTransactions}
        />
      </Modal>
      <Modal show={show} onHide={() => setShow(false)} centered className="modal-v1 border-radius-16">
        <AddOwnerPayment
          setShow={setShow}
          getOwnerTransactions={getOwnerTransactions}
          setTransactionToggle={setTransactionToggle}
        />
      </Modal>
      <Modal
        className="modal-v1 border-radius-16"
        show={sentAmountModal}
        onHide={() => setSentAmountModal(false)}
        centered
      >
        <Modal.Header className="fw-bold justify-content-center">
          <h5>Distribution Sent Successfully</h5>
        </Modal.Header>
        <Modal.Body className="text-center">
          <Card className="mb-2">
            <Card.Body className="p-0">
              <ListGroup>
                <ListGroup.Item className="d-flex justify-content-between">
                  <div className="ms-2">Amount Sent</div>
                  <div>{formatMoney(updateAmount)}</div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button className="w-100" variant="secondary" onClick={() => setSentAmountModal(false)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OwnerTransactions;
