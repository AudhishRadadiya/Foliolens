import moment from "moment";
import React from "react";
import { Col, Table } from "react-bootstrap";
import { formatMoney } from "../../Utility";

const RentRollReport = ({ data }) => {
  return (
    <div className="incomeTable">
      {data?.properties?.length > 0 ? (
        <>
          <h4 className="my-4">Rent Roll</h4>
          <div className="expensesTable">
            <Table borderless={true} style={{ minWidth: "1000px" }}>
              <thead>
                <tr className="fw-bold">
                  <td>Unit</td>
                  <td>Bed/Bath</td>
                  <td>Current Tenant</td>
                  <td>Rent</td>
                  <td>Deposit</td>
                  <td>Balance Due</td>
                  <td>Lease Start</td>
                  <td>Lease Expires</td>
                </tr>
              </thead>
              <tbody className="table-body tenant-transaction">
                {data?.properties?.map((item, i) => (
                  <>
                    <tr>
                      <td colSpan={5}>
                        <h4 className="my-4">{item?.portfolio}</h4>
                      </td>
                    </tr>
                    {item?.units?.map((i) => {
                      const tenant_name = `${i.first_name ? i.first_name : ""} ${i.last_name ? i.last_name : ""}`;
                      return (
                        <>
                          <tr key={i}>
                            <td>
                              <Col lg="12">
                                <div>{i?.unit_name}</div>
                              </Col>
                            </td>

                            <td>
                              <Col lg="12">
                                <div>{`${i?.bedrooms ? i?.bedrooms : "-"}/${i?.bathrooms ? i?.bathrooms : "-"}`}</div>
                              </Col>
                            </td>

                            <td>
                              <Col lg="12">
                                <div>{i.first_name || i.last_name ? tenant_name : "-"}</div>
                              </Col>
                            </td>

                            <td>
                              <Col lg="12">
                                <div className="one-line-clamp">{i?.rent ? formatMoney(i?.rent) : "No Lease"}</div>
                              </Col>
                            </td>

                            <td>
                              <Col lg="12">
                                <div>{i?.security_deposit ? formatMoney(i?.security_deposit) : "-"}</div>
                              </Col>
                            </td>

                            <td>
                              <Col lg="12">
                                <div>{i?.total_balance ? formatMoney(i?.total_balance) : "-"}</div>
                              </Col>
                            </td>

                            <td>
                              <Col lg="12">
                                <div>
                                  {i?.rent
                                    ? i?.lease_start
                                      ? moment(i?.lease_start).format("MM/DD/YYYY")
                                      : "-"
                                    : "No Lease"}
                                </div>
                              </Col>
                            </td>

                            <td>
                              <Col lg="12">
                                <div>
                                  {i?.rent
                                    ? i?.lease_type !== "Fixed"
                                      ? "MTV"
                                      : moment(i?.lease_end).format("MM/DD/YYYY")
                                    : "No Lease"}
                                </div>
                              </Col>
                            </td>
                          </tr>
                        </>
                      );
                    })}
                  </>
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
};

export default RentRollReport;
