import { Modal, Row, Col, Button } from "react-bootstrap";
import { confirmAlert } from "react-confirm-alert";

export const useconfirmAlert = ({ onConfirm, title, dec = "", isDelete = false, onCancel, isOnlyOk = false }) => {
  confirmAlert({
    customUI: ({ onClose }) => {
      if (isOnlyOk) {
        return (
          <div className="custom-ui border-radius-16">
            <div style={{ marginBottom: 20 }}>
              <h3 className="w-100 text-center">{title}</h3>
            </div>
            <Modal.Body className="text-center mb-4 text-black" style={{ whiteSpace: "pre-line" }}>
              {dec}
            </Modal.Body>
            <Modal.Footer>
              <Row className="w-100">
                <Button
                  className="btn w-100"
                  onClick={() => {
                    onClose();
                    if (onCancel) onCancel();
                  }}
                >
                  Ok
                </Button>
              </Row>
            </Modal.Footer>
          </div>
        );
      } else {
        return (
          <div className="custom-ui border-radius-16">
            <div style={{ marginBottom: 20 }}>
              <h3 className="w-100 text-center">{title}</h3>
            </div>
            <Modal.Body className="text-center mb-4 text-black" style={{ whiteSpace: "pre-line" }}>
              {dec}
            </Modal.Body>
            <Modal.Footer>
              <Row className="w-100">
                <Col xs={6}>
                  <Button
                    className="btn-reset w-100"
                    onClick={() => {
                      onClose();
                      if (onCancel) onCancel();
                    }}
                  >
                    {isDelete ? "Cancel" : "No"}
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    className="btn-delete w-100"
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {isDelete ? "Delete" : "Yes"}
                  </Button>
                </Col>
              </Row>
            </Modal.Footer>
          </div>
        );
      }
    },
  });
};
