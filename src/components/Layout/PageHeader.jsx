import React, { useState } from "react";
import HeaderNotification from "./HeaderNotification";
import UserInformation from "../UserInformation";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Alert from "react-bootstrap/Alert";
import danger from "../../Assets/images/danger.svg";
import { setLoading } from "../../store/reducer";
import envFile from "../../envFile";
import { sendHubspotEmail } from "../../graphql/queries";
import { API, graphqlOperation } from "aws-amplify";
import { Button, Modal } from "react-bootstrap";

export default function PageHeader({ title, isBack, className, onBack, docInstruction }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const emailVerify = async () => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(sendHubspotEmail, {
          id: loggedUserData?.id,
          role: "User",
          code: "EMAILVERIFY",
          data: JSON.stringify({
            name: `${loggedUserData?.first_name} ${loggedUserData?.last_name}`,
            url: `${envFile.SIGNUP_URL}Verification/${loggedUserData?.cognito_user_id}~${loggedUserData?.email_verification_uuid}`,
          }),
        })
      );
      dispatch(setLoading(false));
      setShow(true);
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <>
      <div className="page-header mb-4 mb-lg-5 d-flex align-items-center justify-content-between">
        {isBack ? (
          <div className="d-flex">
            <h3 style={{ lineHeight: className && "32px" }} className="mb-0 title gap-3">
              <div
                className="pointer"
                onClick={() => {
                  if (onBack) {
                    onBack();
                    return;
                  }
                  navigate(-1);
                }}
              >
                {/* <FontAwesomeIcon className="icon-left" icon={faAngleLeft}></FontAwesomeIcon> */}
                <img src={require("../../Assets/images/back-arrow.svg").default} alt="" />
              </div>
              <div>{title}</div>
            </h3>
            {docInstruction && (
              <strong onClick={docInstruction} className="add-btn pointer ms-2">
                Learn more
              </strong>
            )}
          </div>
        ) : (
          <h2>{title}</h2>
        )}

        <div className="d-none d-lg-flex">
          <HeaderNotification />
          <UserInformation />
        </div>
      </div>
      <div className="text-header">
        {loggedUserData?.email_verification !== 1 && (
          <Alert variant="danger">
            <div className="error-text">
              <img className="error-img" src={danger} alt="" />
              <p className="mb-0 ps-2 pe-2" style={{ color: "black" }}>
                Please, confirm your email address{" "}
                <span>
                  <span>-</span>
                  <b style={{ color: "#ff4b5f" }} onClick={emailVerify}>
                    Click to resend verification link.
                  </b>
                </span>
              </p>
            </div>
          </Alert>
        )}
      </div>
      <Modal show={show} onHide={() => setShow(false)} className="modal-v1 border-radius-16" centered>
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Verification Email Sent!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          A new verification link was sent to your email address. Please check your inbox and follow the instructions.
        </Modal.Body>
        <Modal.Footer>
          <Button className="w-100" onClick={() => setShow(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
