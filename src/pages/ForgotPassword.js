import React, { useState, useEffect } from "react";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Form } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Auth } from "aws-amplify";
import { useDispatch } from "react-redux";

import { setLoading } from "../store/reducer";
import { emailValidation } from "../Utility/Validations";
import AuthSideBar from "../components/AuthSidebar/AuthSideBar";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (state) {
      setEmail(state.email);
    }
  }, [state]);

  const handleVerifyEmail = async () => {
    try {
      const emailError = emailValidation(email);
      if (!emailError) {
        dispatch(setLoading(true));
        await Auth.forgotPassword(email);
        toast.success("Code sent successfully. Please check email");
        navigate("/ChangePassword", { state: email });
        dispatch(setLoading(false));
      } else {
        toast.error(emailError);
      }
    } catch (error) {
      dispatch(setLoading(false));
      toast.error(String(error).includes("UserNotFoundException") ? "Email doesn't exist" : String(error));
    }
  };

  return (
    <div className="form_screen d-flex h-100">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">
            <Link to="/SignInEmail">
              <FontAwesomeIcon className="icon-left" icon={faAngleLeft}></FontAwesomeIcon>
            </Link>
            Forgot Password
          </h3>
          <Form
            onKeyDown={(e) => {
              if (e.code === "Enter") {
                e.preventDefault();
                handleVerifyEmail();
              }
            }}
          >
            <Form.Group className="mb-5" controlId="formCode">
              <Form.Label>Email*</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter Email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // {...register("email", { required: true })}
                // disabled={toggle ? true : false}
              />
            </Form.Group>
            <Button className="w-100" onClick={handleVerifyEmail}>
              Next
            </Button>
          </Form>
        </div>
      </div>
      <AuthSideBar />
    </div>
  );
}
