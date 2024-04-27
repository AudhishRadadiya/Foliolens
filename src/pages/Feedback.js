import React from "react";
import Container from "../components/Layout/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

export default function Feedback() {
  return (
    <Container title="Feedback" isBack>
      <div className="feedback">
        <Row>
          <Col md={4}>
            <Form>
              <Form.Group className="mb-3" controlId="">
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" placeholder="Enter Name" />
              </Form.Group>
              <Form.Group className="mb-3" controlId="">
                <Form.Label>Email Address</Form.Label>
                <Form.Control type="email" placeholder="Enter Address" />
              </Form.Group>
              <Form.Group className="mb-3" controlId="">
                <Form.Label>Message</Form.Label>
                <Form.Control as="textarea" rows={3} />
              </Form.Group>
              <Button variant="primary" type="submit" className="mt-5">
                Submit
              </Button>
            </Form>
          </Col>
        </Row>
      </div>
    </Container>
  );
}
