import moment from "moment";
import React from "react";
import { Card, ListGroup } from "react-bootstrap";

function OwnerInformation({ owner }) {
  return (
    <div>
      <Card className="mb-4">
        <ListGroup as="ul" className="tenant-detail-group">
          <ListGroup.Item as="li">
            <span className="label">Owner Name</span>{" "}
            {`${owner?.first_name ? owner?.first_name : ""} ${owner?.last_name ? owner?.last_name : ""}`}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Company</span> {owner?.company_name || "-"}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Email Address</span> {owner?.email || "-"}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Mobile Number</span> {owner?.mobile_number || "-"}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Management Agreement - Start Date</span>{" "}
            {owner?.start_date ? moment(owner?.start_date).format("YYYY-MM-DD") : "-"}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Management Agreement - End Date</span>{" "}
            {owner?.end_date ? moment(owner?.end_date).format("YYYY-MM-DD") : "-"}
          </ListGroup.Item>
        </ListGroup>
      </Card>
    </div>
  );
}

export default OwnerInformation;
