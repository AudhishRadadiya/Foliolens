import React from "react";
import { Button, Row, Col } from "react-bootstrap";

export default function OwnersResetNextBtn({ goBack }) {
  return (
    <Row>
      <Col>
        <Button className="btn-md btn-reset" onClick={goBack}>
          Cancel
        </Button>
      </Col>
      <Col className="text-end">
        <Button type="submit" className="btn-md">
          Save
        </Button>
      </Col>
    </Row>
  );
}
