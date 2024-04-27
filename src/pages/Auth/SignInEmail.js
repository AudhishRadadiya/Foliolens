import React, { useState } from "react";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";
import { Button, Col, Form } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Auth } from "aws-amplify";
import { useDispatch } from "react-redux";

import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import { signInValidationSchema } from "../../Utility/Validations";
import { fetchUser, filterPropertyOwner } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import FormInput from "../../components/Form/FormInput";
import { logOut } from "../../Utility";

export default function SignInEmail() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [makePasswordRO, setMakePasswordRO] = useState(true);

  const methods = useForm({
    resolver: yupResolver(signInValidationSchema),
  });

  const onSubmit = async (data) => {
    try {
      dispatch(setLoading(true));
      await Auth.signIn(data.email.toLowerCase(), data.password);
      const user = await dispatch(fetchUser(data.email.toLowerCase()));

      if (!user) {
        await logOut();
        dispatch(setLoading(false));
        return toast.error("User not found");
      }

      if (user.user_role === "Collaborator" || user.user_role === "Property Owner") {
        if (user.user_role === "Property Owner") {
          const owners = await filterPropertyOwner(user.email.toLowerCase());
          if (owners?.length > 0) {
            const owner = owners[0];
            if (Number(owner.invited) === 1) {
              navigate("/Dashboard");
            } else {
              navigate("/Dashboard"); //      userType: data.user_role, root: "Signin", from: "Signin",
            }
          } else {
            navigate("/Dashboard"); //      userType: data.user_role, root: "Signin", from: "Signin",
          }
        } else {
          navigate("/Dashboard"); //      userType: data.user_role,
        }
      } else {
        if (Boolean(user.stripe_subscription_id) && Boolean(user.user_role)) {
          if (user.user_role === "Property Owner" && Boolean(user.no_of_units)) {
            navigate("/Dashboard"); //      userType: data.user_role,
          } else {
            navigate("/Dashboard"); //      userType: data.user_role, root: "Signin", from: "Signin",
          }
        } else {
          navigate("/Dashboard"); //      userType: data.user_role, root: "Signin", from: "Signin",
        }
      }
    } catch (error) {
      dispatch(setLoading(false));
      console.log(error);
      toast.error(
        "Invalid credentials or the account provided does not exist. Please try again or use the Forgot Password function."
      );
    }
  };

  return (
    <div className="form_screen d-flex h-100">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">
            <Link to="/">
              <FontAwesomeIcon className="icon-left" icon={faAngleLeft}></FontAwesomeIcon>
            </Link>
            Sign In
          </h3>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(onSubmit)}>
              <FormInput type="email" name="email" placeholder="Enter Email" label="Email*" />
              <Col style={{ position: "relative" }}>
                {/* <img
                  src={require("../Assets/images/icon-help.svg").default}
                  alt=""
                  onClick={() => setPasswordModel(true)}
                  className="icon-right pointer"
                  style={{
                    position: "absolute",
                    right: "10px",
                  }}
                /> */}
                <FormInput
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  label="Password*"
                  onFocus={() => setMakePasswordRO(false)}
                  readOnly={makePasswordRO}
                />
              </Col>

              <div className="text-end mb-5">
                <Link
                  to={"/ForgotPassword"}
                  state={{
                    email: methods.watch("email"),
                  }}
                >
                  <strong>Forgot Password?</strong>
                </Link>
              </div>

              <Button type="submit" className="w-100">
                Sign In
              </Button>
            </Form>
          </FormProvider>

          <p className="text-center pt-4 mb-0">
            Don't have an account?{" "}
            <Link to="/">
              <strong>Sign Up</strong>
            </Link>
          </p>
        </div>
      </div>
      <AuthSideBar />
    </div>
  );
}
