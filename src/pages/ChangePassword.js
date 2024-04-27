import React, { useState } from "react";
import * as yup from "yup";
import { Auth } from "aws-amplify";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm } from "react-hook-form";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { setLoading } from "../store/reducer";
import FormInput from "../components/Form/FormInput";
import AuthSideBar from "../components/AuthSidebar/AuthSideBar";

const Schema = yup
  .object({
    code: yup.string().required("Please enter Code").min(6, "Please enter a valid Code"),
    new_password: yup
      .string()
      .required("Please enter New Password")
      .matches(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[\w~@#$%^&*+=`|{}:;!.?\"()\[\]-]{8,}$/,
        "Please choose a password that contains at least 1 number, 1 capital letter, 1 symbol, between 8 and 30 characters in length, without spaces."
      )
      .max(30),
    repeat_password: yup
      .string()
      .required("Please Reenter Password")
      .oneOf([yup.ref("new_password"), null], "Passwords must match"),
  })
  .required();

export default function ChangePassword() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const [makePasswordRO, setMakePasswordRO] = useState(true);

  const methods = useForm({
    resolver: yupResolver(Schema),
  });

  const onSubmit = async (data) => {
    try {
      dispatch(setLoading(true));
      await Auth.forgotPasswordSubmit(state, data.code, data.repeat_password);
      await Auth.signIn(state, data.repeat_password);
      dispatch(setLoading(false));
      navigate("/");
    } catch (error) {
      toast.error("Code is not correct. Please check email");
      dispatch(setLoading(false));
      // navigate("/ForgotPassword", { state: state });
    }
  };

  const resendCode = async (e) => {
    try {
      e.preventDefault();
      await Auth.forgotPassword(state);

      toast.success("Code sent to your email");
    } catch (err) {
      console.log("Code verification Err", err);
      if (err.name === "LimitExceededException") {
        toast.error("Too many attempts to resend code, please try again later if you are not receiving OTP");
        return;
      }
      toast.error(err.name);
    }
  };

  return (
    <div className="form_screen d-flex flex-wrap h-100">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">
            <Link to="/ForgotPassword">
              <FontAwesomeIcon className="icon-left" icon={faAngleLeft} />
            </Link>
            Change Password
          </h3>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(onSubmit)}>
              <FormInput type="number" name="code" placeholder="Enter Code" label="Code*" />
              <div className="text-center mb-2">
                <span className="text-primary pointer" onClick={resendCode}>
                  <a href="#">
                    <strong>Resend Code</strong>
                  </a>
                </span>
              </div>
              <FormInput
                onFocus={() => setMakePasswordRO(false)}
                readOnly={makePasswordRO}
                type="password"
                name="new_password"
                placeholder="New Password"
                label="Enter New Password*"
              />
              <FormInput
                type="password"
                name="repeat_password"
                placeholder="Repeat New Password"
                label="Reenter New Password*"
              />
              <Button type="submit" className="w-100">
                Submit
              </Button>
            </Form>
          </FormProvider>
        </div>
      </div>
      <AuthSideBar />
    </div>
  );
}
