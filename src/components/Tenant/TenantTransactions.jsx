import React, { useEffect, useState } from "react";
import { Table, Col, Button, Modal } from "react-bootstrap";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../../store/reducer";
import { getRdsFN } from "../../Utility/ApiService";
import { formatMoney } from "../../Utility";
import moment from "moment";
import AddTenantPayment from "./AddTenantPayment";
import PaginationInput from "../PaginationInput";

const TenantTransactions = ({ tenantId }) => {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [itemOffset, setItemOffset] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const endOffset = itemOffset ? itemOffset + 10 : 10;
  const currentItem = transactions?.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(transactions?.length / 10);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * 10) % transactions?.length;
    setItemOffset(newOffset);
  };

  useEffect(() => {
    if (tenantId) {
      getTransactions();
    }
  }, [tenantId]);

  const getTransactions = async () => {
    try {
      dispatch(setLoading(true));
      let response = await getRdsFN("tenantTransactions", { tenantId });
      response.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      if (response?.length) {
        const balance = [...response].reverse();

        let amount = null;
        balance.reduce((acc, value, i) => {
          if (value.status === "CANCELLED" || value.status === "Failed") {
            amount = acc;
            balance[i] = { ...balance[i], balance: 0 };
            return 0;
          } else {
            const prevAcc = amount !== null ? amount : acc;
            if (amount !== null) {
              amount = null;
            }
            if (value.transaction_type === "DEBIT") {
              balance[i] = { ...balance[i], balance: prevAcc - value.transaction_amount };
              return prevAcc - value.transaction_amount;
            } else {
              balance[i] = { ...balance[i], balance: prevAcc + value.transaction_amount };
              return prevAcc + value.transaction_amount;
            }
          }
        }, 0);

        response = balance.reverse();
      }

      setTransactions(response);
      dispatch(setLoading(false));
    } catch (err) {
      console.log("Something went wrong!", err);
      dispatch(setLoading(false));
    }
  };

  return (
    <div>
      <div className="transaction_table_card">
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <div className="fw-bold">List of Transactions</div>
          <Button className="btn-reset" onClick={() => setShow(true)}>
            + Add Tenant Transaction
          </Button>
        </div>
        <Table responsive="md" borderless={true}>
          <thead>
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
          </thead>
          <tbody className="table-body tenant-transaction">
            {currentItem?.map((field) => (
              <tr style={{ borderBottom: "1px solid #EDEDED", height: "50px" }}>
                <td className="align-middle">
                  <Col>
                    <div>{field?.transaction_payment_id}</div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <div>{moment(field?.date).format("MM/DD/YYYY")}</div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <div>
                      {field.transaction_type === "DEBIT" ? "-" : field?.account_number || field?.payment_mode || "-"}
                    </div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <div>{field?.category}</div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <div className="d-flex" style={{ whiteSpace: "pre" }}>
                      <span>{formatMoney(field?.transaction_amount, field?.transaction_type === "DEBIT")}</span>
                    </div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <div className="one-line-clamp"> {field?.note}</div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    {field.transaction_type === "DEBIT" ? (
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
                <td className="align-middle">{formatMoney(field?.balance)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
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
      <Modal show={show} onHide={() => setShow(false)} centered className="modal-v1 border-radius-16">
        <AddTenantPayment
          onSuccess={() => {
            getTransactions();
            setShow(false);
          }}
          setShow={setShow}
          tenantId={tenantId}
        />
      </Modal>
    </div>
  );
};

export default TenantTransactions;
