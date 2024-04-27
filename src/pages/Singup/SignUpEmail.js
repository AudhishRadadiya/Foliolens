import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useDispatch, useSelector } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { FormProvider, useForm } from "react-hook-form";
import { API, Auth, graphqlOperation } from "aws-amplify";
import moment from "moment";
import { Col, Modal } from "react-bootstrap";
import { GoogleReCaptcha } from "react-google-recaptcha-v3";
import randomstring from "randomstring";

import FormInput from "../../components/Form/FormInput";
import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import { signupValidationSchema } from "../../Utility/Validations";
import { setLoading } from "../../store/reducer";
import { sendHubspotEmail } from "../../graphql/queries";
import { getId, accessToken, ROLES } from "../../Utility";
import envFile from "../../envFile";
import { createDefaultPortfolio, createRecordTB, fetchUser } from "../../Utility/ApiService";
import axios from "axios";

export default function SignUpEmail() {
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { state } = useLocation();
  const [passwordModel, setPasswordModel] = useState(false);
  const methods = useForm({
    resolver: yupResolver(signupValidationSchema),
    // mode: 'onSubmit',
  });
  const { errors } = methods.formState;
  const [isVerifiedCaptcha, setIsVerifiedCaptcha] = useState(false);
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search.substring(1) : " ");

  const collaboratorId = params.get("collaboratorId") || "";
  const propertyownerId = params.get("propertyownerId") || "";

  useEffect(() => {
    if (errors?.password?.type === "matches") {
      toast.error(errors.password.message);
    }
    if (errors?.email?.type) {
      toast.error(errors.email.message);
    }
    if (errors?.last_name?.type === "matches") {
      toast.error("Only alphabets and numerics are \nallowed for last Name field");
    }
    if (errors?.first_name?.type === "matches") {
      toast.error("Only alphabets and numerics are \nallowed for first Name field");
    }
  }, [errors]);

  useEffect(() => {
    filterCollaborator();
  }, [collaboratorId]);

  useEffect(() => {
    filterPropertyOwner();
  }, [propertyownerId]);

  const filterCollaborator = async () => {
    try {
      if (collaboratorId) {
        dispatch(setLoading(true));
        const response = await accessToken();
        const res = await axios.post(
          `${envFile.PUBLIC_API_LINK}/findRecord`,
          { id: collaboratorId, table: "Collaborator" },
          {
            headers: {
              Authorization: response.data.access_token,
            },
          }
        );
        dispatch(setLoading(false));
        if (res?.data) {
          methods.setValue("email", res?.data?.email);
        } else {
          toast.error("Invalid Collaborator, Please try with valid link");
        }
      }
    } catch (err) {
      console.log("Get Collaborator Err", err);
      dispatch(setLoading(false));
      toast.error("Something went wrong! please click on the link again.");
    }
  };

  const filterPropertyOwner = async () => {
    try {
      if (propertyownerId) {
        dispatch(setLoading(true));
        const response = await accessToken();
        const res = await axios.post(
          `${envFile.PUBLIC_API_LINK}/findRecord`,
          { id: propertyownerId, table: "PropertyOwner" },
          {
            headers: {
              Authorization: response.data.access_token,
            },
          }
        );

        dispatch(setLoading(false));
        if (res?.data) {
          const propertyOwner = res?.data;
          methods.setValue("email", propertyOwner?.email);
          methods.setValue("first_name", propertyOwner?.first_name);
          methods.setValue("last_name", propertyOwner?.last_name);
        } else {
          toast.error("Invalid Property Owner, Please try with valid link");
        }
      }
    } catch (err) {
      console.log("Get Property Owner Err", err);
      dispatch(setLoading(false));
      toast.error("Something went wrong! please click on the link again.");
    }
  };

  useEffect(() => {
    if (state) {
      Object.keys(state).forEach((key) => {
        let value = state[key];
        switch (key) {
          case "first_name":
            methods.setValue("first_name", value);
            break;

          case "last_name":
            methods.setValue("last_name", value);
            break;

          case "email":
            methods.setValue("email", value);
            break;

          case "password":
            methods.setValue("password", value);
            break;

          // case "confirmPassword":
          //   methods.setValue("confirmPassword", value);
          //   break;

          default:
        }
      });
    }
  }, [state]);

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));

      const responseData = await Auth.signUp({
        username: formData.email.toLowerCase(),
        password: formData.password,
        attributes: {
          email: formData.email.toLowerCase(),
        },
        validationData: [],
      });

      await Auth.signIn(formData.email.toLowerCase(), formData.password);

      let obj = {
        id: getId(),
        cognito_user_id: responseData.userSub,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_role: "",
        phone: formData.phone,
        middle_name: "",
        profile_photo_url: "",
        country: "",
        state: "",
        city: "",
        address: "",
        zipcode: "",
        device_token: "",
        device_type: "",
        active: 1,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        email_verification_uuid: randomstring.generate(20),
      };
      const invitedRole = collaboratorId ? ROLES.Collaborator : propertyownerId ? ROLES.PropertyOwner : "";
      if (invitedRole) {
        obj["user_role"] = invitedRole;
        obj["email_verification"] = 1;
      }

      await createRecordTB("User", obj);

      dispatch(fetchUser(formData.email.toLowerCase()));

      if (!invitedRole) {
        await API.graphql(
          graphqlOperation(sendHubspotEmail, {
            id: obj.id,
            role: "User",
            code: "EMAILVERIFY",
            data: JSON.stringify({
              name: `${obj.first_name} ${obj.last_name}`,
              url: `${envFile.SIGNUP_URL}Verification/${obj.cognito_user_id}~${obj.email_verification_uuid}`,
            }),
          })
        );
      }

      dispatch(createDefaultPortfolio(obj.email, obj.id, obj.first_name, obj.last_name));
      if (invitedRole) {
        if (invitedRole === ROLES.PropertyOwner) {
          navigate("/PropertyOwnerOnBoarding", { state: { userType: ROLES.PropertyOwner } });
        } else if (invitedRole === ROLES.Collaborator) {
          navigate("/Dashboard", { state: { isOpen: true } });
        }
      } else {
        navigate("/WhatYouDo");
      }
      dispatch(setLoading(false));
    } catch (error) {
      console.log(error);
      dispatch(setLoading(false));
      toast.error(
        'A user with this email already exists. Try signing in or select "Forgot Password" at sign in to reset.'
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
            Sign Up
          </h3>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={(e) => e.code === "Enter" && e.preventDefault()}>
              <FormInput name="first_name" placeholder="Enter First Name" label="First Name" />
              <FormInput name="last_name" placeholder="Enter Last Name" label="Last Name" />
              <FormInput type="email" name="email" placeholder="Enter Email" label="Email" />
              <FormInput
                placeholder="Enter Phone Number"
                label="Phone Number"
                name="phone"
                mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                type="maskInput"
                guide={false}
              />
              <Col style={{ position: "relative" }}>
                <img
                  src={require("../../Assets/images/icon-help.svg").default}
                  alt=""
                  name=""
                  onClick={() => setPasswordModel(true)}
                  className="icon-right pointer"
                  style={{
                    position: "absolute",
                    right: "10px",
                  }}
                />
                <FormInput
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  label="Create Password"
                  // notShowError
                />
              </Col>
              {/* <FormInput
                type="password"
                name="confirmPassword"
                placeholder="Reenter your password"
                label="Reenter Password*"
              /> */}

              <Form.Group className="mb-2" controlId="formBasicCheckbox">
                <Form.Check
                  type="checkbox"
                  label={
                    <p>
                      By clicking this checkbox you agree to Foliolens <Link to="/TermsConditions">"Terms of Use"</Link>{" "}
                      and <Link to="/PrivacyPolicy">"Privacy Policy"</Link> as well as our partner Dwolla's{" "}
                      <a href="https://www.dwolla.com/legal/tos/" target="_self">
                        "Terms of Use"
                      </a>{" "}
                      and{" "}
                      <a href="https://www.dwolla.com/legal/privacy/#legal-content" target="_self">
                        "Privacy Policy"
                      </a>
                    </p>
                  }
                  {...methods.register("isValid")}
                />
                <Form.Text className="text-danger ml-2">{errors?.isValid?.message}</Form.Text>
              </Form.Group>
              <div className="mb-4">
                <GoogleReCaptcha
                  onVerify={(token) => {
                    if (token) setIsVerifiedCaptcha(true);
                  }}
                />
              </div>

              <Button type="submit" className="w-100" disabled={!isVerifiedCaptcha}>
                Sign Up
              </Button>
            </Form>
          </FormProvider>
        </div>
      </div>

      <AuthSideBar />

      <Modal className="modal-v1 border-radius-16" show={passwordModel} onHide={() => setPasswordModel(false)}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            Please choose a password that contains at least 1 number, 1 capital letter, 1 symbol, between 8 and 30
            characters in length, without spaces.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPasswordModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
