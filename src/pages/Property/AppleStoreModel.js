import React, { useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import envFile from "../../envFile";

const guide = [
  {
    id: 1,
    title: "Step 1",
    des: "Create your Portfolio",
  },
  {
    id: 2,
    title: "Step 2",
    des: "Add a Tenant to your Property and invite them via email to their own Tenant Portal",
  },
  {
    id: 3,
    title: "Step 3",
    des: "Add Bank Account to your Foliolens Account to begin accepting Rent",
  },
  {
    id: 4,
    title: "Step 4",
    des: "Download the Foliolens iOS app from the AppStore to unlock the mobile experience.",
  },
];
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export default function AppleStoreModel({ setShow, show }) {
  const [payModel, setPayModel] = useState(true);

  const handleModel = () => {
    setPayModel(false);
    setShow(false);
    window.open(envFile.APLLE_STORE_URL, "_blank");
    // window.open(envFile.APLLE_STORE_URL, "_blank");
  };

  return (
    <Modal
      className="modal-v1 border-radius-16 text-center"
      show={payModel || show}
      centered
      onHide={() => {
        setPayModel(false);
        setShow(false);
      }}
    >
      <Modal.Header className="mb-4 align-items-start" closeButton>
        <img
          src={require("../../Assets/images/img-app-store.svg").default}
          alt=""
          style={{ paddingLeft: "33%", height: "65px" }}
        />
      </Modal.Header>
      <Modal.Body className="guidemodel">
        {guide.map((g, i) => {
          return (
            <Card
              style={{
                elevation: 2,
                height: "auto",
                flexDirection: "column",
                justifyContent: "space-around",
                marginBottom: "8px",
              }}
              key={i}
            >
              <h4
                style={{
                  textAlign: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                {g.title}
              </h4>
              <p
                style={{
                  textAlign: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: "400",
                }}
              >
                {g.des}
              </p>
            </Card>
          );
        })}
        <div>
          <Button className="apple-app" onClick={() => handleModel()} disabled={!isIOS}>
            <img src={require("../../Assets/images/apple.svg").default} style={{ width: "15px" }} alt="" />
            <span>Apple App Store</span>
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
