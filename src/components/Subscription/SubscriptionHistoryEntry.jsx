import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default function SubscriptionHistoryEntry(props) {
  return (
    <div className="card mb-2">
      <Row>
        <Col xs md="4">
          <div className="mb-3 mb-md-2">
            <span className="label">Date</span>
            {props.date}
          </div>
        </Col>
        <Col xs md="4">
          <div className="mb-3 mb-md-2">
            <span className="label">Type</span>
            {props.type}
          </div>
        </Col>
        <Col md="4">
          <div
            className="mb-2 pointer text-primary"
            onClick={() => {
              window.open(props.receipt);
            }}
          >
            <span className="label">Receipt No</span>
            Download
          </div>
        </Col>
      </Row>
    </div>
  );
}
