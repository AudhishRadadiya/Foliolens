import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { setLoading } from "../../store/reducer";
import moment from "moment";
import { Dropdown } from "react-bootstrap";
import { updateRecordTB } from "../../Utility/ApiService";

export default function CollaboratorCard({ item, fetchData, handelEdit, resendEmail }) {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const deleteCollaborator = async () => {
    try {
      handleClose();
      dispatch(setLoading(true));
      await updateRecordTB("Collaborator", {
        id: item.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      fetchData();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error deleteTenant tenant", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  return (
    <div className="card mb-2">
      <Row className="align-items-center">
        <Col xs md="3">
          <div>{<strong>{item?.portfolios?.map(({ portfolio_name }) => ` ${portfolio_name}`).toString()}</strong>}</div>
        </Col>
        <Col xs md="3">
          <div>
            <div>
              {item?.first_name || item?.last_name
                ? (item?.first_name ? item.first_name : "") + " " + (item?.last_name ? item.last_name : "")
                : "-"}
            </div>
          </div>
        </Col>
        <Col xs md="2">
          <div>
            <strong className="text-primary">{item?.permission}</strong>
          </div>
        </Col>
        <Col xs md="3">
          <div>
            <span>{item?.email}</span>
          </div>
        </Col>
        <Col xs md="1">
          <Dropdown className="no-caret">
            <Dropdown.Toggle className="p-0 no-clr">
              <img src={require("../../Assets/images/icon-toggle-btn.svg").default} alt="" />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end">
              {!item?.cognito_user_id && (
                <Dropdown.Item className="edit" onClick={() => resendEmail(item)}>
                  <img src={require("../../Assets/images/Resend.svg").default} alt="" />
                  Resend Invite
                </Dropdown.Item>
              )}
              <Dropdown.Item className="edit" onClick={handelEdit}>
                <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
                Edit
              </Dropdown.Item>
              <Dropdown.Item className="delete" onClick={handleShow}>
                <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      <Modal show={show} onHide={handleClose} className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Delete account?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          Are you sure you want to delete your account? This action cannot be undone.
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
                <Button className="btn-delete w-100" onClick={deleteCollaborator}>
                  Yes, I'm Sure
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
