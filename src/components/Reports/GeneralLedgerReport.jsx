import moment from "moment";
import React from "react";
import { Col, Table } from "react-bootstrap";

function GeneralLedgerReport({ data }) {
  return (
    <div className="incomeTable">
      {data.length > 0 ? (
        <>
          <h4 className="my-4">General Ledger Details</h4>
          <div className="expensesTable">
            <Table borderless={true} style={{ minWidth: "2000px" }}>
              <thead>
                <tr className="fw-bold text-capitalize text-center">
                  <td>Date</td>
                  <td>Payer/Payee Name</td>
                  <td>Description</td>
                  <td>Payment Method</td>
                  <td>Parent Category</td>
                  <td>Sub-Category</td>
                  <td>Amount</td>
                  <td>Portfolio</td>
                  <td>Property</td>
                  <td>Unit</td>
                  <td>Source Bank</td>
                  <td>Bank Account Name</td>
                </tr>
              </thead>
              <tbody className="table-body tenant-transaction">
                {data?.map((item, i) => (
                  <tr key={i} className="text-capitalize text-center">
                    <td>
                      <Col lg="12">
                        <div>{moment(item?.payment_date?.split("T")[0]).format("MM/DD/YYYY")}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12">
                        <div>{item?.payee_name}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12">
                        <div>{item?.note}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12">
                        <div className="one-line-clamp">{item?.transaction_id ? "BANK" : "CASH"}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12">
                        <div>{item?.parent_category}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12">
                        <div>{item?.category}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12" className="p-0 text-capitalize text-center">
                        <div>{item?.amount}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12" className="p-0 text-capitalize text-center">
                        <div>{item?.portfolio_name}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12" className="p-0 text-capitalize text-center">
                        <div>{item?.address1}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12" className="p-0 text-capitalize text-center">
                        <div>{item?.unit_name}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12" className="p-0 text-capitalize text-center">
                        <div>{item?.bank_name}</div>
                      </Col>
                    </td>

                    <td>
                      <Col lg="12" className="p-0 text-capitalize text-center">
                        <div>{item?.card_name}</div>
                      </Col>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      ) : (
        <div className="empty text-center py-5">
          <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}
    </div>
  );
}

export default GeneralLedgerReport;
