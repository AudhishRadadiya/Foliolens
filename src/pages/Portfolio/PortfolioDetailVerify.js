import React, { useEffect, useState } from "react";
import * as yup from "yup";
import moment from "moment";
import { Form, Col, Row, Button, Modal } from "react-bootstrap";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm } from "react-hook-form";
import Container from "../../components/Layout/Container";
import FormInput from "../../components/Form/FormInput";
import STATES from "../../Utility/states.json";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { setLoading } from "../../store/reducer";
import { API, graphqlOperation } from "aws-amplify";
import { getRdsData } from "../../graphql/queries";
import { updateRdsData, retryDwollaCustomer } from "../../graphql/mutations";
import { fetchAllPortfolios, fetchNotifications, updateRecordTB } from "../../Utility/ApiService";
import { ISSoleProprietorship } from "../../components/Portfolios/PortfolioIndividualForm";

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
    business_name: yup
      .string()
      .required("Please enter Business Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Business Name"),
    email: yup
      .string()
      .email()
      .nullable()
      .required("Please enter Email Address")
      .matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid Email Address"
      ),
    address: yup
      .string()
      .required("Please enter Street Address")
      .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please enter valid Street Address"),
    city: yup
      .string()
      .required("Please enter City Name")
      .matches(/^[a-zA-Z ]{2,500}$/, "Please enter valid City Name"),
    state: yup.string().required("Please select State"),
    postal_code: yup
      .string()
      .required("Please enter Postal Code")
      .matches(/^(\d){5}$/, "Please enter valid Postal Code"),
    date_of_birth: yup
      .string()
      .required("Please select Date of Birth")
      .test("date_of_birth", "Under 18s are not allow", (value) => {
        return moment().diff(moment(value), "years") >= 18;
      }),
    ssn: yup
      .string()
      .required("Please enter the social security number")
      .min(11, "Social Security Number must be at least 9 characters"),

    controllerFirstName: yup
      .string()
      .required("Please enter First Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid First Name"),
    controllerLastName: yup
      .string()
      .required("Please enter Last Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Last Name"),
    controller_address: yup
      .string()
      .required("Please enter Street Address")
      .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please enter valid Street Address"),
    controller_city: yup
      .string()
      .required("Please enter City Name")
      .matches(/^[a-zA-Z ]{2,500}$/, "Please enter valid City Name"),
    controller_state: yup.string().required("Please select State"),
    controller_postal_code: yup
      .string()
      .required("Please enter Postal Code")
      .matches(/^(\d){5}$/, "Please enter valid Postal Code"),
  })
  .required();

const PortfolioDetailVerify = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();

  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const portfolio = allPortfolio.find((item) => item.id === state?.id);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });
  const {
    formState: { errors },
    getValues,
    setValue,
  } = methods;

  useEffect(() => {
    if (portfolio) {
      Object.keys(portfolio).forEach((originalKey) => {
        let value = portfolio[originalKey];
        let key = originalKey;
        switch (originalKey) {
          case "address1":
            key = "address";
            break;

          case "original_email":
            key = "email";
            break;

          case "state":
            const stateValue = STATES.find((item) => item.abbreviation === value);
            value = stateValue ? stateValue?.name : value;
            break;

          default:
            break;
        }
        methods.setValue(key, value);
      });
      return;
    }
  }, [portfolio]);

  const onSubmit = async (payload) => {
    try {
      const state = STATES.find((data) => data.name === payload.state);
      const controllerState = STATES.find((data) => data.name === payload.controller_state)?.abbreviation;

      dispatch(setLoading(true));
      const portfolioId = portfolio.id;

      let editedEmail = payload.email;
      if (payload.email === portfolio.original_email) {
        const res = await API.graphql(
          graphqlOperation(getRdsData, {
            name: "portfolioCount",
            data: JSON.stringify({
              email: payload.email,
            }),
          })
        );
        const isPortfolioExists = JSON.parse(res.data.getRdsData.response);
        // if (isPortfolioExists.count_email) {
        //   editedEmail = payload.email.split("@");
        //   editedEmail = `${editedEmail[0]}+${isPortfolioExists.count_email}@${editedEmail[1]}`;
        // }
        if (isPortfolioExists) {
          let cntEmail = 0;
          isPortfolioExists?.map(({ email_count }) => {
            cntEmail =
              cntEmail > (parseInt(email_count) ? parseInt(email_count) : 0) ? cntEmail : parseInt(email_count);
          });
          cntEmail = cntEmail + 1;
          editedEmail = payload.email.split("@");
          editedEmail = `${editedEmail[0]}+${cntEmail}@${editedEmail[1]}`;
        }
      } else {
        editedEmail = portfolio.original_email;
      }
      let dwollaData = {
        email: editedEmail,
        businessClassification: "9ed3f666-7d6f-11e3-9a8d-5404a6144203",
        businessType: portfolio?.business_type,
        customerId: payload?.dwolla_customer_id,
        firstName: payload?.first_name,
        lastName: payload.last_name,
        address1: payload.address,
        city: payload.city,
        state: state?.abbreviation,
        dateOfBirth: payload.date_of_birth,
        postalCode: payload.postal_code,
        ssn: payload.ssn,
        type: payload.account_type,
        businessName: payload.business_name,
        ein: payload.ein,
        controllerAddress1: payload.controller_address,
        controllerCity: payload.controller_city,
        controllerPostalCode: payload.controller_postal_code,
        controllerState: controllerState,
        controllerFirstName: payload.controllerFirstName,
        controllerLastName: payload.controllerLastName,
        controllerTitle: payload.controllerTitle,
        ownerFirstName: payload.portfolio_owner_first_name,
        ownerLastName: payload.portfolio_owner_last_name,
        ownerAddress1: payload.portfolio_owner_address1,
        ownerCity: payload.portfolio_owner_city,
        ownerState: payload.portfolio_owner_state,
        ownerPostalCode: payload.portfolio_owner_postal_code,
        ownerDateOfBirth: payload.portfolio_owner_date_of_birth,
        ownerSsn: payload.portfolio_owner_ssn,
        ownerCountry: "US",
        controllerCountry: "US",
      };
      const getCustomerId = await API.graphql(graphqlOperation(retryDwollaCustomer, dwollaData));
      if (!getCustomerId) {
        dispatch(setLoading(false));
        toast.error("Something went wrong!");
        return;
      }
      if (getCustomerId.data.retryDwollaCustomer.status != 200) {
        dispatch(setLoading(false));
        toast.error(getCustomerId.data.retryDwollaCustomer.response);
        return;
      }
      let dbData = {};
      if (payload.account_type === "personal") {
        dbData = {
          id: portfolioId,
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: editedEmail,
          account_type: payload.account_type,
          address1: payload.address,
          city: payload.city,
          state: payload.state,
          postal_code: payload.postal_code,
          date_of_birth: payload.date_of_birth,
          original_email: payload.email,
        };
      } else {
        if (ISSoleProprietorship(portfolio?.business_type)) {
          dbData = {
            id: portfolioId,
            first_name: payload.first_name,
            last_name: payload.last_name,
            email: editedEmail,
            account_type: payload.account_type,
            address1: payload.address,
            city: payload.city,
            state: payload.state,
            postal_code: payload.postal_code,
            date_of_birth: payload.date_of_birth,
            original_email: payload.email,
            business_name: payload.business_name,
            business_classification: payload?.business_classification,
            industry_classification: payload?.industry_classification,
            ein: payload.ein,
          };
        } else {
          dbData = {
            id: portfolioId,
            first_name: payload.controllerFirstName,
            last_name: payload.controllerLastName,
            email: editedEmail,
            date_of_birth: payload.dateOfBirth,
            address1: payload.controller_address,
            city: payload.controller_city,
            state: controllerState,
            designation: payload.controllerTitle,
            postal_code: payload.controller_postal_code,
            business_owner_first_name: payload.portfolio_owner_first_name,
            business_owner_last_name: payload.portfolio_owner_last_name,
            business_email: editedEmail,
            account_type: payload.account_type,
            business_address1: payload.business_address1,
            business_city: payload.business_city,
            business_state: payload.business_state,
            business_postal_code: payload.business_postal_code,
            business_classification: payload?.business_classification,
            industry_classification: payload?.industry_classification,
            business_name: payload.business_name,
            ein: payload.ein,
            original_email: payload.email,
          };
        }
      }
      await updateRecordTB("Portfolio", {
        ...dbData,
        status: "RESUBMITTED",
        last_modified: payload?.last_modified,
        updated_by: loggedUserData?.id,
      });

      await API.graphql(
        graphqlOperation(updateRdsData, {
          name: "removeNotification",
          data: JSON.stringify({
            notificationType: "Customer Reverification Needed",
            resourceId: portfolio.id,
            sendBy: "Portfolio",
            lastModified: payload?.last_modified,
          }),
        })
      );
      dispatch(setLoading(false));
      navigate(-1);
      setTimeout(() => {
        dispatch(fetchAllPortfolios());
        dispatch(fetchNotifications());
      }, 2000);
    } catch (err) {
      console.log("Update User Error", err);
      dispatch(setLoading(false));
    }
  };

  const copyAboveFormVal = (isChecked) => {
    setValue("controllerFirstName", isChecked ? getValues("first_name") : "");
    setValue("controllerLastName", isChecked ? getValues("last_name") : "");
    setValue("controller_city", isChecked ? getValues("city") : "");
    setValue("controller_state", isChecked ? getValues("state") : "");
    setValue("controller_address", isChecked ? getValues("address") : "");
    setValue("controller_postal_code", isChecked ? getValues("postal_code") : "");
  };

  return (
    <Container title={"Account business controller reverification"} isBack>
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="form-col">
            <div className="h5 mb-4">Update business details to verify your portfolio {portfolio?.portfolio_name}</div>

            <Row>
              <div className="mb-3 title fw-bold">
                Authorized Representative on Bank Accounts
                <img
                  src={require("../../Assets/images/icon-help.svg").default}
                  alt=""
                  className="icon-right pointer"
                  onClick={() => setShow(true)}
                />
              </div>
              <Row>
                <Col xl="4">
                  <FormInput name="first_name" placeholder="Enter First Name" label="First Name" astrict />
                </Col>
                <Col xl="4">
                  <FormInput name="last_name" placeholder="Enter Last Name" label="Last Name" astrict />
                </Col>
                <Col xl="4">
                  <FormInput name="business_name" placeholder="Enter Business Name" label="Business Name" astrict />
                </Col>
              </Row>
              <Row>
                <Col xl="4" className={errors.address ? "is-invalid" : ""}>
                  <div>
                    <FormInput
                      type="AddressAutocomplete"
                      name="address"
                      placeholder="Enter Mailing street address"
                      label="Street Address"
                      astrict
                    />
                  </div>
                  <Form.Text style={{ color: "#DC3545" }}>{errors.address && errors.address.message}</Form.Text>
                </Col>
                <Col xl="4">
                  <FormInput name="city" placeholder="Enter City" label="City" astrict />
                </Col>
              </Row>
              <Row>
                <Col xl="4">
                  <FormInput
                    name="state"
                    label="State"
                    type="select"
                    options={STATES.map((item) => ({ label: item.name, value: item.name }))}
                    placeholder="Select State"
                    astrict
                  />
                </Col>
                <Col xl="4">
                  <FormInput type="number" name="postal_code" placeholder="Enter ZIP" label="ZIP" astrict />
                </Col>
              </Row>
              <Row>
                <Col xl="4">
                  <FormInput
                    type="email"
                    name="email"
                    placeholder="Enter Email address"
                    label="Email Address"
                    astrict
                  />
                </Col>
                <Col xl="4">
                  <FormInput
                    type="date"
                    name="date_of_birth"
                    placeholder="Enter Date of Birth"
                    label="Date of Birth"
                    astrict
                  />
                </Col>
              </Row>
              <Row>
                <Col xl="4">
                  <FormInput
                    name="ssn"
                    placeholder="Please Enter SSN"
                    label="SSN"
                    type="maskInput"
                    mask={[/[1-9]/, /\d/, /\d/, "-", /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                    guide={false}
                    astrict
                  />
                </Col>
              </Row>
            </Row>
            <Row>
              <div className="mb-3 title fw-bold">
                Business Controller
                <img
                  src={require("../../Assets/images/icon-help.svg").default}
                  alt=""
                  className="icon-right pointer"
                  onClick={() => setShow(true)}
                />
              </div>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Same information as above."
                  onChange={(e) => copyAboveFormVal(e.target.checked)}
                />
              </Form.Group>
              <Row>
                <Col xl="4">
                  <FormInput name="controllerFirstName" placeholder="Enter First Name" label="First Name" astrict />
                </Col>
                <Col xl="4">
                  <FormInput name="controllerLastName" placeholder="Enter Last Name" label="Last Name" astrict />
                </Col>
              </Row>
              <Row>
                <Col xl="4" className={errors.controller_address ? "is-invalid" : ""}>
                  <div>
                    <FormInput
                      type="AddressAutocomplete"
                      name="controller_address"
                      placeholder="Enter Mailing street address"
                      label="Street Address"
                      prefix={"controller_"}
                      astrict
                    />
                  </div>
                  <Form.Text style={{ color: "#DC3545" }}>
                    {errors.controller_address && errors.controller_address.message}
                  </Form.Text>
                </Col>
                <Col xl="4">
                  <FormInput name="controller_city" placeholder="Enter City" label="City" astrict />
                </Col>
              </Row>
              <Row>
                <Col xl="4">
                  <FormInput
                    name="controller_state"
                    label="State"
                    type="select"
                    options={STATES.map((item) => ({ label: item.name, value: item.name }))}
                    placeholder="Select State"
                    astrict
                  />
                </Col>
                <Col xl="4">
                  <FormInput type="number" name="controller_postal_code" placeholder="Enter ZIP" label="ZIP" astrict />
                </Col>
              </Row>
            </Row>
          </div>
          <Row>
            <Col xl="6" className="mb-3 mt-3">
              <span>
                {`By clicking Save, I agree to our partner  `}
                <a target="blank" href="https://www.dwolla.com/legal/tos/">
                  Dwolla's Terms of Use
                </a>
                {` and `}
                <a target="blank" href="https://www.dwolla.com/legal/privacy/">
                  Privacy Policy
                </a>
              </span>
            </Col>
          </Row>
          <Row className="pt-5">
            <Col>
              <Button className="btn-md btn-reset" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </Col>
            <Col className="text-end">
              <Button type="submit" className="btn-md">
                Save
              </Button>
            </Col>
          </Row>
        </Form>
      </FormProvider>
      <Modal className="modal-v1 border-radius-16" show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <h5>Certification Field</h5>
        </Modal.Header>
        <Modal.Body>
          <p>
            The individual creating the portfolio with a business entity the rental transactions must Certify that all
            beneficial owner information is correct , these requirements are imposed by the United States Federal
            customer due diligence rule.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PortfolioDetailVerify;
