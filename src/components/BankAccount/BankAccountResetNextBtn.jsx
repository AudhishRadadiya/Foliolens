import React from "react";
import { Button, Col, Row } from "react-bootstrap";

export default function BankAccountResetNextBtn({ resetMethod }) {
  return (
    <Row className="pt-5">
      <Col>
        <Button onClick={() => resetMethod.reset()} type="reset" className="btn-md btn-reset">
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
