import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import { Modal } from "react-bootstrap";
import Avatar from "./Avatar";

export default function ProfileAvatar({ setShowPrfoileAvatar, showPrfoileAvatar, handleSelectAvatar }) {
  const [selectedAvatar, setSelectedAvatar] = useState();
  const handleClose = () => {
    setSelectedAvatar();
    setShowPrfoileAvatar(false);
  };
  return (
    <Modal className="modal-v1 border-radius-16" show={showPrfoileAvatar} centered onHide={handleClose}>
      <Modal.Header className="justify-content-center">
        <Modal.Title>
          <h3>Please select avatar</h3>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="avatarContainer">
          <Avatar
            setSelectedAvatar={setSelectedAvatar}
            id="1"
            src={require("../../Assets/images/avatar1.png")}
            selected={selectedAvatar === "1" ? true : false}
          />
          <Avatar
            setSelectedAvatar={setSelectedAvatar}
            id="2"
            src={require("../../Assets/images/avatar2.png")}
            selected={selectedAvatar === "2" ? true : false}
          />
        </div>
        <div className="avatarContainer">
          <Avatar
            setSelectedAvatar={setSelectedAvatar}
            id="3"
            src={require("../../Assets/images/avatar3.png")}
            selected={selectedAvatar === "3" ? true : false}
          />
          <Avatar
            setSelectedAvatar={setSelectedAvatar}
            id="4"
            src={require("../../Assets/images/avatar4.png")}
            selected={selectedAvatar === "4" ? true : false}
          />
        </div>
      </Modal.Body>
      <Modal.Footer className="profile-footer">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={() => handleSelectAvatar(selectedAvatar)}
          variant="primary"
          disabled={selectedAvatar === undefined}
        >
          Select
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
