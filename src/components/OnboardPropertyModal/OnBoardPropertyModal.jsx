import React from "react";
import { Button, Row, Col, Modal } from "react-bootstrap";
import styles from "./OnBoardPropertyModal.module.scss";

export default function OnBoardPropertyModal({ show, setShow, handleOnboardNewProperty }) {
  return (
    <Modal show={show} onHide={() => setShow(false)} centered className="modal-v1 border-radius-16">
      <Modal.Header closeButton closeLabel="ds" className={styles.headerCloseBtn}></Modal.Header>
      <Modal.Title as="h6" className="w-100 text-center">
        <h3 classNam={styles.top_text}>A matching property record</h3>
        <h3 classNam={styles.top_text}>was not found</h3>
      </Modal.Title>
      <Modal.Body className={styles.centered_text}>
        <p>Please choose an option to proceed</p>
      </Modal.Body>

      <Modal.Footer>
        <div className="container m-0 p-0">
          <Row>
            <Col xs={6}>
              <div
                className={styles.btn}
                onClick={() => {
                  setShow(false);
                  handleOnboardNewProperty();
                }}
              >
                <img src={require("../../Assets/images/onBoardPropImg.svg").default} />
                <div className="mt-2 pointer">
                  <p className={styles.middle_txt}>Onboard a</p>
                  <p className={styles.middle_txt}>a new property</p>
                </div>
              </div>
            </Col>
            <Col xs={6}>
              <div
                className={styles.btn}
                onClick={() => {
                  setShow(false);
                }}
              >
                <img src={require("../../Assets/images/folder.svg").default} />
                <div className="mt-2 pointer">
                  <p className={styles.middle_txt}>Categories this</p>
                  <p className={styles.middle_txt}>document to a</p>
                  <p className={styles.middle_txt}>different property?</p>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
