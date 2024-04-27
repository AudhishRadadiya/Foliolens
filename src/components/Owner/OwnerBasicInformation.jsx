import React, { useEffect, useState } from "react";
import { Form, Col, Row, Modal, Button, Container } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";
import { API, graphqlOperation } from "aws-amplify";

import envFile from "../../envFile";
import { accessToken, getId } from "../../Utility";
import { setLoading } from "../../store/reducer";
import FormInput from "../../components/Form/FormInput";
import { sendHubspotEmail } from "../../graphql/queries";
import OwnersResetNextBtn from "../../components/Owner/OwnersResetNextBtn";
import { createRecordTB, fetchAllOwnersPortfolio, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import axios from "axios";

const validationSchema = yup
  .object({
    first_name: yup
      .string()
      .required("Please enter First Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid First Name"),
    last_name: yup
      .string()
      .required("Please enter Last Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Last Name"),
    email: yup
      .string()
      // .email()
      .required("Please enter Email Address")
      .matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid Email"
      ),
    company_name: yup.string().notRequired().nullable(),
    mobile_number: yup.string().min(14, "Mobile Number must be at least 10 characters").nullable(),
    // .matches(/^(\([0-9]{3}\)|[0-9]{3}-) [0-9]{3}-[0-9]{4}$/, "Please enter a valid Mobile Number"),
    start_date: yup.date().notRequired().nullable(),

    end_date: yup.date().when("start_date", {
      is: (value) => value,
      then: yup.date().test("start_date", "End date cannot be the same as or before start date.", function (value) {
        const { start_date } = this.parent;
        return new Date(value) > new Date(start_date);
      }),
      otherwise: yup.date().notRequired().nullable(),
    }),

    invite: yup.boolean(),
  })
  .required();

const OwnerBasicInformation = ({ editOwnersData, setActiveTab, setCurrentData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [formData, setFormData] = useState();
  const [showInvite, setShowInvite] = useState(false);
  const [changeEmailModal, setChangeEmailModal] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState(false);
  const [changedNewEmail, setChangedNewEmail] = useState();
  const [oldEmail, setOldEmail] = useState(false);

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allPortfolio = useSelector(({ allPortfolio, sharedPortfolio }) =>
    [...allPortfolio, ...sharedPortfolio].map((d) => ({
      ...d,
      permission: d.user_id === loggedUserData.id ? null : d.permission,
    }))
  );

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      invite: true,
    },
  });

  const { setValue } = methods;

  useEffect(() => {
    if (editOwnersData) {
      console.log("editOwnersData", editOwnersData);
      Object.keys(editOwnersData).forEach((key) => {
        let value = editOwnersData[key];
        setValue(key, value);
      });
    }
  }, [editOwnersData]);

  const onSubmit = async (ownerData) => {
    if (ownerData?.invite === true || editOwnersData) {
      submitOwner(ownerData);
    } else {
      setShowInvite(true);
      setFormData(ownerData);
    }
  };

  const submitOwner = async (formData) => {
    try {
      // if (loggedUserData.email === formData.email.trim()) {
      //   alert("You cannot invite yourself.");
      //   return;
      // }

      const res = await getRdsFN("tbSelect", {
        source: "pOwn",
        email: formData.email,
        cBy: loggedUserData.id,
      });

      if (res?.length > 0) {
        setShowInvite(false);
        toast.error("This email is already exist");
        return;
      }

      dispatch(setLoading(true));
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const propertyOwnerObj = {
        id: editOwnersData ? editOwnersData.id : getId(),
        user_id: loggedUserData.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
        email: formData.email.toLowerCase(),
        mobile_number: formData.mobile_number,
        start_date: moment(startDate).format("YYYY-MM-DD"),
        end_date: moment(endDate).format("YYYY-MM-DD"),
        created_by: loggedUserData.id,
        active: 1,
        invited: formData.invite ? 1 : 0,
      };

      if (editOwnersData) {
        await updateRecordTB("PropertyOwner", propertyOwnerObj);
      } else {
        // const res = await API.graphql(
        //   graphqlOperation(storeTaxPayerId, {
        //     taxPayerId: formData?.taxPayerId ? formData?.taxPayerId : "",
        //   })
        // );
        // propertyOwnerObj["tax_payer_id"] = res.data.storeTaxPayerId.response;
        await createRecordTB("PropertyOwner", propertyOwnerObj);
      }

      setCurrentData({ ...propertyOwnerObj, ...formData });

      if (formData.invite === true) {
        await API.graphql(
          graphqlOperation(sendHubspotEmail, {
            id: propertyOwnerObj.id,
            role: "Property Owner",
            code: "POINVITE",
            data: JSON.stringify({
              name: `${loggedUserData?.first_name + " " + loggedUserData?.last_name}`,
              invite_url: envFile.PROPERTYOWNER_REDIRECT_URL + propertyOwnerObj.id,
              button_text: "Accept Invitation & Create Account",
            }),
          })
        );
      }
      dispatch(fetchAllOwnersPortfolio());
      setShowInvite(false);
      setActiveTab("mailing-address");
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error adding tenant", error);
      dispatch(setLoading(false));
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
            user_id: editOwnersData?.user_id,
            user_role: "PropertyOwner",
            old_email: editOwnersData?.email,
            new_email: changedNewEmail,
            cognito_user_id: editOwnersData?.cognito_user_id,
          },
          {
            headers: {
              Authorization: res.data.access_token,
            },
          }
        );
        if (response?.status === 200) setEmailConfirmation(true);
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
        <Form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="add_task"
          style={{ minHeight: "calc(100vh - 250px)" }}
        >
          <div className="pe-0 pe-lg-5">
            <Row>
              <Col md="6" xl="6">
                <FormInput name="first_name" placeholder="Enter First Name" label="First Name" astrict />
              </Col>
              <Col md="6" xl="6">
                <FormInput name="last_name" placeholder="Enter Last Name" label="Last Name" astrict />
              </Col>
            </Row>

            <Row>
              <Col md="6" xl="4">
                <FormInput name="company_name" placeholder="Enter Company" label="Company" />
              </Col>
              <Col md="6" xl="4">
                <FormInput
                  name="email"
                  type="email"
                  disabled={editOwnersData}
                  placeholder="Enter Email Address"
                  label="Email Address"
                  astrict
                  changeEmail={editOwnersData?.cognito_user_id ? () => setChangeEmailModal(true) : false}
                />
              </Col>
              <Col md="6" xl="4">
                <FormInput
                  name="mobile_number"
                  placeholder="Enter Mobile Number"
                  label="Phone Number"
                  type="maskInput"
                  mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                  guide={false}
                />
              </Col>
            </Row>

            <Row>
              <Col md="6" xl="4" style={{ position: "relative" }}>
                <FormInput
                  name="start_date"
                  type="datePicker"
                  label="Management Agreement - Start Date"
                  placeholder="mm/dd/yyyy"
                />
                <img
                  src={require("../../Assets/images/instruction-icon.svg").default}
                  alt=""
                  onClick={() => setShow(true)}
                  className="icon-right pointer"
                  style={{
                    position: "absolute",
                    right: "15px",
                    top: "5px",
                  }}
                />
              </Col>
              <Col md="6" xl="4">
                <FormInput
                  name="end_date"
                  type="datePicker"
                  label="Management Agreement - End Date"
                  placeholder="mm/dd/yyyy"
                />
              </Col>
            </Row>

            <Row className="my-3">
              {!editOwnersData && (
                <div className="mb-5" controlId="formBasicCheckbox">
                  <FormInput name="invite" type="checkbox" label="Invite Owner to Foliolens via email" />
                </div>
              )}
            </Row>
          </div>

          <OwnersResetNextBtn goBack={() => navigate("/Owners")} />
          {/* <OwnersResetNextBtn onClick={() => navigate("/Owners")} /> */}
          {/* <Row className="pt-5">
            <Col>
              <Button type="reset" className="btn-md btn-reset" onClick={() => navigate("/Owners")}>
                Cancel
              </Button>
            </Col>
            <Col className="text-end">
              <Button type="submit" className="btn-md">
                Save
              </Button>
            </Col>
          </Row> */}
        </Form>
      </FormProvider>
      <Modal className="modal-v1 border-radius-16" show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            A Property management agreement is a legal contract that enables one company to have control of another
            individual / business's operations as it relates to rent collection, payment of bills, evictions, tenant
            screening, advertising vacant units, maintenance to building exterior and landscaping, and drawing up
            tenancy or lease agreements.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showInvite} onHide={() => setShowInvite(false)} centered className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Confirm Action
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          Are you sure you want to proceed without inviting this user to the platform?
        </Modal.Body>
        <Modal.Footer>
          <Row className="w-100">
            <Col xs={6}>
              <Button className="btn-reset w-100" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
            </Col>
            <Col xs={6}>
              <Button className="btn-reset btn-delete w-100" onClick={() => submitOwner(formData)}>
                Yes
              </Button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>

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
                    if (e.target.value === editOwnersData?.email) {
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
      <Modal
        show={emailConfirmation}
        onHide={() => setEmailConfirmation(false)}
        className="modal-v1 border-radius-16"
        centered
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Verification Email Sent
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">A verification email was sent to the new email address</Modal.Body>
        <Modal.Footer>
          <Button className="w-100" onClick={() => setEmailConfirmation(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
export default OwnerBasicInformation;
