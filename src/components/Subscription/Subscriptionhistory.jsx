import React, { useState, useEffect } from "react";
import { Form, Col, Row, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import ReactDatePicker from "react-datepicker";
import moment from "moment";

import SubscriptionHistoryEntry from "./SubscriptionHistoryEntry";
import { formatDate } from "../../Utility";

export default function Subscriptionhistory() {
  const stripePaymentHistory = useSelector(({ stripePaymentHistory }) => stripePaymentHistory);
  const [filterDates, setfilterDates] = useState({
    startDate: "",
    endDate: "",
  });
  const [paymentHistoryArr, setPaymentHistoryArr] = useState([]);

  useEffect(() => {
    if (filterDates.endDate && filterDates.startDate) {
      const startDate = moment(filterDates.startDate).format("YYYY-MM-DD");
      const endDate = moment(filterDates.endDate).format("YYYY-MM-DD");
      const filteredArr = stripePaymentHistory
        .filter((t) => {
          const date = moment(new Date(t.created * 1000)).format("YYYY-MM-DD");
          return date >= startDate && date <= endDate;
        })
        .reverse();
      setPaymentHistoryArr(filteredArr);
    } else {
      setPaymentHistoryArr(stripePaymentHistory);
    }
  }, [filterDates, stripePaymentHistory]);

  const resetHistory = () => {
    setfilterDates({});
    setPaymentHistoryArr(stripePaymentHistory);
  };

  return (
    <div className="subscription-history">
      <Form>
        <Row>
          <Col xs lg="3">
            <Form.Group className="mb-3">
              <Form.Label>From</Form.Label>
              <ReactDatePicker
                className="form-control"
                selected={filterDates.startDate}
                onChange={(date) => setfilterDates({ ...filterDates, startDate: date })}
                format="MM/DD/YYYY"
                placeholderText="MM/DD/YYYY"
              />
            </Form.Group>
          </Col>
          <Col xs lg="3">
            <Form.Group className="mb-3">
              <Form.Label>To</Form.Label>
              <ReactDatePicker
                className="form-control"
                selected={filterDates.endDate}
                onChange={(date) => setfilterDates({ ...filterDates, endDate: date })}
                format="MM/DD/YYYY"
                placeholderText="MM/DD/YYYY"
              />
            </Form.Group>
          </Col>
          <Col xs lg="2" className="d-flex align-items-center">
            <Button className="btn-reset mt-2" onClick={resetHistory}>
              Cancel
            </Button>
          </Col>
        </Row>
      </Form>

      <div className="entries">
        <div className="entries-header">
          <Row>
            <Col md="4">Date</Col>
            <Col md="4">Type</Col>
            <Col md="4">Receipt No</Col>
          </Row>
        </div>

        {paymentHistoryArr?.map((payment, i) => (
          <SubscriptionHistoryEntry
            key={i}
            date={formatDate(new Date(payment.created * 1000))}
            type={payment?.lines?.data[0].plan?.interval === "month" ? "Monthly" : "Annual"}
            receipt={payment.invoice_pdf}
          />
        ))}
      </div>
    </div>
  );
}
