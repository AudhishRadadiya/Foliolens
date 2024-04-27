import React from "react";
import { Col, Row } from "react-bootstrap";

export default function InsightAlert({ type, message, percentage, propertyName }) {
  let icon = require("../../Assets/images/icon-help.svg");
  let bgColor = "#FEF8F0";
  let iconColor = "#06122B";
  if (type === "success") {
    icon = require("../../Assets/images/taskIcon.svg");
    iconColor = "#1BAE99";
    bgColor = "#EEF8F3";
  } else if (type === "error") {
    icon = require("../../Assets/images/ReportAlert.svg");
    iconColor = "#FF5A5A";
    bgColor = "#FFEEEE";
  }
  return (
    <Row className="gap-3 px-3">
      <Col lg="3" md="4" sm="12" className="p-3" style={{ background: bgColor, width: "270px", borderRadius: "12px" }}>
        <div className="d-flex">
          <div className="me-2" style={{ color: iconColor }}>
            <img src={icon.default} alt="" />
          </div>

          <div>
            <div className="d-flex gap-2 mb-2">
              <span>{message}</span>
              {percentage ? (
                <div style={{ fontWeight: "700", color: "#06122B" }}>{Math.round(Math.abs(percentage))}%</div>
              ) : (
                ""
              )}
            </div>

            {propertyName ? (
              <div className="d-flex gap-2">
                <img src={require("../../Assets/images/propertyIcon.svg").default} alt="" />
                <span style={{ fontSize: "13px" }}>{propertyName}</span>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </Col>
    </Row>
  );
}
