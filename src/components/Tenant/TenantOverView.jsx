import moment from "moment";
import React from "react";
import { Card, ListGroup } from "react-bootstrap";
import { formatNumber } from "../../Utility";
import monthdays from "../../Utility/monthdays.json";

function TenantOverView({ tenant }) {
  const paymentDueDate = monthdays.find((i) => i.id === Number(tenant?.payment_due_date));
  return (
    <div>
      <ListGroup as="ul" className="amenities ms-3 mt-2">
        <div className="d-flex">
          <ListGroup.Item as="li">
            <img src={require("../../Assets/images/portfolio-icon.svg").default} alt="" />
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <img src={require("../../Assets/images/icon-house.svg").default} alt="" />
            {tenant?.unit_name ? "#" + tenant?.unit_name : ""}
          </ListGroup.Item>
        </div>
      </ListGroup>

      <Card className="mb-4">
        <ListGroup as="ul" className="tenant-detail-group">
          <ListGroup.Item as="li">
            <span className="label">Rent(Monthly)</span> {formatNumber(tenant?.rent)}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Security Deposit</span> {formatNumber(tenant?.security_deposit)}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Payment Due Date</span> {paymentDueDate?.name}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Lease Type</span> {tenant?.lease_type}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Start Date</span>{" "}
            {tenant?.lease_start
              ? moment(tenant?.lease_start)
                  .subtract(moment(tenant?.lease_start).utcOffset(), "minutes")
                  .format("MM/DD/YYYY")
              : ""}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">End Date</span>{" "}
            {tenant?.lease_end
              ? moment(tenant?.lease_end)
                  .subtract(moment(tenant?.lease_end).utcOffset(), "minutes")
                  .format("MM/DD/YYYY")
              : ""}
          </ListGroup.Item>
          <ListGroup.Item className="tenant-group-list-item" as="li">
            <span className="label">Grace Period</span> {tenant?.grace_period}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Email Address</span> {tenant?.email || "-"}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Phone Number</span> {tenant?.phone || "-"}
          </ListGroup.Item>
        </ListGroup>
      </Card>
    </div>
  );
}

export default TenantOverView;
