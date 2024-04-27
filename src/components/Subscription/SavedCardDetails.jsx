import React, { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

export default function SavedCardDetails({ item, deletePaymentMethode, onDefaultCardChange }) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div className="card mb-3">
      <Row>
        <Col md="6">
          <div className="card-name mb-2">
            <img src={require("../../Assets/images/visaCardIcon.png")} alt="" />
            {item?.card_type}
          </div>
        </Col>
        <Col xs md="2">
          <div className="card-number mb-2">
            <span className="label">Card Number</span>• • • • {item?.card_last4}
          </div>
        </Col>
        <Col xs md="2">
          <div className="card-number mb-2">{`${item?.expiry_month}/${item?.expiry_year}`}</div>
        </Col>

        <Col xs md="1">
          <div className="d-flex justify-content-between">
            <div className="card-selected mb-2">
              <span className="label">Default</span>
              <div className="list-view-switch">
                <label className="theme-switch">
                  <input
                    type="checkbox"
                    checked={item?.default_payment_method === 1}
                    onChange={(e) => onDefaultCardChange(item, e.target.checked)}
                  />
                  <span className="theme-slider theme-round"></span>
                </label>
              </div>
            </div>
            <div className="pointer">
              <img src={require("../../Assets/images/icon-delete.svg").default} alt="" onClick={handleShow} />
            </div>
          </div>
        </Col>
      </Row>

      {item?.default_payment_method === 1 ? (
        <Modal className="modal-v1 border-radius-16" centered show={show} onHide={handleClose}>
          <Modal.Body className="text-center mb-3 mt-2">
            You cannot delete this card as this is the default card. Please set another card as default before deleting
            this card
          </Modal.Body>
          <Modal.Footer>
            <Container className="m-0">
              <Row>
                <Col>
                  <Button className="btn-reset w-100" onClick={handleClose}>
                    Ok
                  </Button>
                </Col>
              </Row>
            </Container>
          </Modal.Footer>
        </Modal>
      ) : (
        <Modal show={show} onHide={handleClose} centered className="modal-v1 border-radius-16">
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              Delete this card?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center mb-3">
            Are you sure you want to delete your card? This action cannot be undone.
          </Modal.Body>
          <Modal.Footer>
            <Container className="m-0">
              <Row>
                <Col xs={6}>
                  <Button className="btn-reset w-100" onClick={handleClose}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    className="btn-delete w-100"
                    onClick={() => {
                      deletePaymentMethode(item);
                      handleClose();
                    }}
                  >
                    Yes, I’m Sure
                  </Button>
                </Col>
              </Row>
            </Container>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
