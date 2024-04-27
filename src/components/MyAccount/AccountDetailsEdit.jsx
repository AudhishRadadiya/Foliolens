import React, { useEffect, useState } from "react";
import { Form, Col, Row, Modal, Container, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import * as yup from "yup";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { API, Auth, graphqlOperation } from "aws-amplify";

import AccountResetNextBtn from "./AccountResetNextBtn";
import { updateRecordTB, updateUserFN } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import FormInput from "../Form/FormInput";
import STATES from "../../Utility/states.json";
import { accessToken, getCurrentUser } from "../../Utility";
import envFile from "../../envFile";
import axios from "axios";

const validationSchema = yup
  .object({
    first_name: yup.string().notRequired().nullable(),
    last_name: yup.string().notRequired().nullable(),
    phone: yup.string().notRequired().nullable(),
    state: yup.string().notRequired().nullable(),
    postal_code: yup.string().notRequired().nullable(),
    city: yup.string().notRequired().nullable(),
    address: yup.string().notRequired().nullable(),
    email: yup.string().email().nullable(),
    company_name: yup.string().notRequired().nullable(),
    currentPassword: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .required("Please enter Current Password")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*-])(?=.{8,})(\S+$)/, {
          message: "Please enter correct password",
          // "Please choose a password that contains at least 1 number, 1 capital letter, 1 symbol, between 8 and 30 characters in length, without spaces.",
          // "The password has to be secure. Be sure it contains at least\n 1 number, 1 letter, 1 capital letter, 1 symbol \n between 8 and 30 characters length \n doesn't contain whitespaces",
          excludeEmptyString: true,
        })
        .max(30),
    }),

    newPassword: yup.string().when("currentPassword", {
      is: (value) => value,
      then: yup
        .string()
        .required("Please enter New Password")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*-])(?=.{8,})(\S+$)/, {
          message:
            "Please choose a password that contains at least 1 number, 1 capital letter, 1 symbol, between 8 and 30 characters in length, without spaces.",
          excludeEmptyString: true,
        })
        .max(30),
      otherwise: yup.string().notRequired(),
    }),
  })
  .required();

export default function AccountDetailsEdit() {
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const [makePasswordRO, setMakePasswordRO] = useState(true);
  const [isSocialUser, setIsSocialUser] = useState(false);
  const [changeEmailModal, setChangeEmailModal] = useState(false);
  const [oldEmail, setOldEmail] = useState(false);
  const [changedNewEmail, setChangedNewEmail] = useState();
  const [show, setShow] = useState(false);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    Auth.currentAuthenticatedUser().then((data) => {
      if (data.attributes?.identities) {
        setIsSocialUser(true);
      }
    });
  }, []);

  useEffect(() => {
    if (loggedUserData) {
      methods.setValue("first_name", loggedUserData?.first_name);
      methods.setValue("last_name", loggedUserData?.last_name);
      methods.setValue("phone", loggedUserData?.phone);
      methods.setValue("state", loggedUserData?.state);
      methods.setValue("postal_code", loggedUserData?.zipcode);
      methods.setValue("city", loggedUserData?.city);
      methods.setValue("address", loggedUserData?.address);
      methods.setValue("email", loggedUserData?.email);
      methods.setValue("company_name", loggedUserData?.company_name);
    }
  }, [loggedUserData]);

  const updateDetail = async (data) => {
    try {
      let accountDetail = {
        // ...data,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        company_name: data.company_name || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zipcode: data.postal_code || "",
        phone: data.phone || "",
      };
      if (data) {
        if (data.currentPassword && data.newPassword) {
          const currentUser = await getCurrentUser();
          await Auth.changePassword(currentUser, data.currentPassword, data.newPassword);
        }
        delete accountDetail.currentPassword;
        delete accountDetail.newPassword;
        // delete accountDetail.zipcode;
        // do not remove await
        await dispatch(
          updateUserFN({
            ...accountDetail,
          })
        );
        toast.success("Updated Successfully");
      }
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error confirming sign up", error);
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  const handleChangeEmail = async () => {
    try {
      var checkEmailError =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      if (!checkEmailError.test(changedNewEmail)) {
        setOldEmail(true);
        return;
      }

      dispatch(setLoading(true));

      if (changedNewEmail) {
        const res = await accessToken();
        const response = await axios.post(
          `${envFile.PUBLIC_API_LINK}/updateEmailVerfication`,
          {
            user_id: loggedUserData?.id,
            user_role: "User",
            old_email: loggedUserData?.email,
            new_email: changedNewEmail,
            cognito_user_id: loggedUserData?.cognito_user_id,
          },
          {
            headers: {
              Authorization: res.data.access_token,
            },
          }
        );

        if (response?.status === 200) setShow(true);
      }

      setChangeEmailModal(false);
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(updateDetail)}>
          <Row>
            <Col md="6" xl="4">
              <FormInput name="first_name" placeholder="Enter First Name" label="First Name" />
            </Col>
            <Col md="6" xl="4">
              <FormInput name="last_name" placeholder="Enter Last Name" label="Last Name" />
            </Col>
            <Col md="6" xl="4">
              <FormInput name="company_name" placeholder="Enter Company Name" label="Company Name" />
            </Col>
          </Row>

          <Row>
            <Col md="6" xl="4">
              <FormInput
                placeholder="Enter Phone Number"
                label="Phone Number"
                name="phone"
                mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                type="maskInput"
                guide={false}
              />
            </Col>
            <Col md="6" xl="4">
              <FormInput
                type="email"
                name="email"
                placeholder="Enter Email"
                label="Email"
                disabled={true}
                changeEmail={() => setChangeEmailModal(true)}
              />
            </Col>
            <Col md="6" xl="4" className={methods.formState.errors.address ? "is-invalid" : ""}>
              <div>
                <Form.Label>Mailing Street Address</Form.Label>
              </div>
              <div>
                <FormInput type="AddressAutocomplete" name="address" />
              </div>
              <Form.Text style={{ color: "#DC3545" }}>
                {methods.formState.errors.address && methods.formState.errors.address.message}
              </Form.Text>
            </Col>
          </Row>

          <Row>
            <Col md="6" xl="4">
              <FormInput name="city" placeholder="Enter City" label="City" />
            </Col>
            <Col md="6" xl="4">
              <FormInput
                type="select"
                name="state"
                label="State"
                options={STATES.map((item) => ({ label: item.name, value: item.name }))}
                placeholder="Select State"
              />
            </Col>
            <Col md="6" xl="4">
              <FormInput
                type="number"
                name="postal_code"
                placeholder="Enter Zip/Postal"
                label="Zip/Postal"
                maxLength={5}
                onInput={(e) => {
                  if (e.target.value.length > e.target.maxLength) {
                    e.target.value = e.target.value.slice(0, e.target.maxLength);
                  }
                }}
                onKeyDown={(evt) => evt.key === "e" && evt.preventDefault()}
              />
            </Col>
          </Row>

          {!isSocialUser && (
            <>
              <h3 className="mt-5 mb-4">Change Password</h3>
              <Row>
                <Col md="6" xl="4" className="account_password">
                  <FormInput
                    type="password"
                    name="currentPassword"
                    placeholder="Enter the current password"
                    label="Current password"
                    onFocus={() => setMakePasswordRO(false)}
                    readOnly={makePasswordRO}
                  />
                </Col>
                <Col md="6" xl="4" className="account_password">
                  <FormInput type="password" name="newPassword" placeholder="Enter new password" label="New password" />
                </Col>
              </Row>
            </>
          )}

          <AccountResetNextBtn />
        </Form>
      </FormProvider>

      <Modal
        show={changeEmailModal}
        onHide={() => {
          setChangeEmailModal(false);
          setChangedNewEmail("");
        }}
        centered
        className="modal-v1 border-radius-16"
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Change Email Address
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          <Row className="text-start">
            <Col>
              <Form.Group className={`check ${oldEmail ? "is-invalid" : ""} `}>
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  placeholder="Please Enter Email"
                  value={changedNewEmail}
                  onChange={(e) => {
                    setChangedNewEmail(e.target.value);
                    if (e.target.value === loggedUserData?.email) {
                      setOldEmail(true);
                    } else {
                      setOldEmail(false);
                    }
                  }}
                />
                <Form.Text className="ms-1" style={{ color: "#DC3545" }}>
                  {oldEmail && "Please Enter a valid Email"}
                </Form.Text>
              </Form.Group>
              {/* <FormInput name="new_email" placeholder="Please Enter Email" label="Email" /> */}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Container className="m-0">
            <Row>
              <Col xs={6}>
                <Button
                  className="btn-reset w-100"
                  onClick={() => {
                    setChangeEmailModal(false);
                    setChangedNewEmail("");
                  }}
                >
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  type="submit"
                  className=" w-100"
                  disabled={oldEmail || !changedNewEmail}
                  onClick={handleChangeEmail}
                >
                  Save
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
      <Modal show={show} onHide={() => setShow(false)} className="modal-v1 border-radius-16" centered>
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Verification Email Sent
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">A verification email was sent to the new email address</Modal.Body>
        <Modal.Footer>
          <Button className="w-100" onClick={() => setShow(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
