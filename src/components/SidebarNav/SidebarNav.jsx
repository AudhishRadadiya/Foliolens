import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";
import { Modal, Button } from "react-bootstrap";

import styles from "./SidebarNav.module.scss";
import "simplebar-react/dist/simplebar.min.css";
import { AddListItems, SideMenu } from "./SideMenu";

export default function SidebarNav() {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const navigate = useNavigate();

  return (
    <div className={`${styles.layoutsidenav_nav} bg-blue d-none d-lg-flex flex-column`}>
      <div className={`${styles.sidebar_logo} w-100 text-center pointer`} onClick={() => navigate("/Dashboard")}>
        <img src={require("../../Assets/images/logo.svg").default} />
      </div>

      <div className={`${styles.add_button} text-end`}>
        <Button onClick={handleShow}>
          <FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
        </Button>
      </div>

      <SimpleBar style={{ maxHeight: "80%" }}>
        <SideMenu />
      </SimpleBar>

      <Modal show={show} onHide={handleClose} className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" style={{ lineHeight: "32px" }} className="w-100 text-center">
            Add New
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddListItems />
        </Modal.Body>
      </Modal>
    </div>
  );
}
