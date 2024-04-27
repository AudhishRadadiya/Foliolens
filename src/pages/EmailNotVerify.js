import React, { useState } from "react";
import { FormProvider } from "react-hook-form";
import { Button, Form, Modal } from "react-bootstrap";
import AuthSideBar from "../components/AuthSidebar/AuthSideBar";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../store/reducer";
import envFile from "../envFile";
import { API, graphqlOperation } from "aws-amplify";
import { sendHubspotEmail } from "../graphql/queries";

export default function EmailNotVerify() {
  const [show, setShow] = useState(false);

  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const emailVerification = async () => {
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
    <div className="form_screen d-flex " style={{ height: "100vh" }}>
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">Verify your email</h3>
          <div className="mb-3 d-flex justify-content-center">
            <img src={require("../Assets/images/email-not-verify.svg").default} alt="" />
          </div>
          <p className="mb-5">
            Please check your email and follow the instructions to verify your account. If you did not receive an email
            or if it expired, you can resend one.
          </p>
          <div>
            <FormProvider>
              <Form>
                <Button className="w-100" onClick={emailVerification}>
                  Resend
                </Button>
              </Form>
            </FormProvider>
          </div>
        </div>
      </div>
      <AuthSideBar />
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
    </div>
  );
}
