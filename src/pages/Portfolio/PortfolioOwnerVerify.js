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
import { setLoading } from "../../store/reducer";
import { API, graphqlOperation } from "aws-amplify";
import { retryDwollaCustomer } from "../../graphql/mutations";
import toast from "react-hot-toast";
import { fetchAllPortfolios, fetchNotifications, updateRecordTB } from "../../Utility/ApiService";

const validationSchema = yup
  .object({
    portfolio_owner_first_name: yup
      .string()
      .required("Please enter First Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid First Name"),
    portfolio_owner_last_name: yup
      .string()
      .required("Please enter Last Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Last Name"),
    portfolio_owner_address1: yup
      .string()
      .required("Please enter Street Address")
      .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please enter valid Street Address"),
    portfolio_owner_city: yup
      .string()
      .required("Please enter City Name")
      .matches(/^[a-zA-Z ]{2,500}$/, "Please enter valid City Name"),
    portfolio_owner_state: yup.string().required("Please select State"),
    portfolio_owner_postal_code: yup
      .string()
      .required("Please enter Postal Code")
      .matches(/^(\d){5}$/, "Please enter valid Postal Code"),
    portfolio_owner_date_of_birth: yup
      .string()
      .required("Please select Date of Birth")
      .test("portfolio_owner_date_of_birth", "Under 18s are not allow", (value) => {
        return moment().diff(moment(value), "years") >= 18;
      }),
    ownerSsn: yup
      .string()
      .required("Please enter the social security number")
      .min(11, "Social Security Number must be at least 9 characters"),
  })
  .required();

const PortfolioOwnerVerify = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();

  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const portfolio = allPortfolio.find((item) => item.id === state?.id);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });
  const {
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (portfolio) {
      Object.keys(portfolio).forEach((originalKey) => {
        let value = portfolio[originalKey];
        let key = originalKey;
        switch (originalKey) {
          case "portfolio_owner_state":
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
      const ownerState = STATES.find((data) => data.name === payload.portfolio_owner_state)?.abbreviation;

      dispatch(setLoading(true));
      const portfolioId = portfolio.id;

      const getCustomerId = await API.graphql(
        graphqlOperation(retryDwollaCustomer, {
          type: "owner",
          ownerFirstName: payload.portfolio_owner_first_name,
          ownerLastName: payload.portfolio_owner_last_name,
          ownerAddress1: payload.portfolio_owner_address1,
          ownerCity: payload.portfolio_owner_city,
          ownerState: ownerState,
          ownerPostalCode: payload.portfolio_owner_postal_code,
          ownerDateOfBirth: payload.portfolio_owner_date_of_birth,
          ownerSsn: payload.ownerSsn,
          ownerCountry: "US",
          customerId: portfolio?.dwolla_beneficial_owner_id,
        })
      );
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

      let dbData = {
        id: portfolioId,
        portfolio_owner_first_name: payload.portfolio_owner_first_name,
        portfolio_owner_last_name: payload.portfolio_owner_last_name,
        portfolio_owner_address1: payload.portfolio_owner_address1,
        portfolio_owner_city: payload.portfolio_owner_city,
        portfolio_owner_state: ownerState,
        portfolio_owner_postal_code: payload.portfolio_owner_postal_code,
        portfolio_owner_date_of_birth: payload.portfolio_owner_date_of_birth,
        beneficial_owner_status: "RESUBMITTED",
      };
      await updateRecordTB("Portfolio", dbData);
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

  return (
    <Container title={"Account business owner reverification"} isBack>
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="form-col">
            <div className="h5 mb-4">
              Update business owner's details to verify your portfolio {portfolio?.portfolio_name}
            </div>

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
                  <FormInput name="portfolio_owner_first_name" placeholder="Enter First Name" label="First Name" />
                </Col>
                <Col xl="4">
                  <FormInput name="portfolio_owner_last_name" placeholder="Enter Last Name" label="Last Name" />
                </Col>
              </Row>
              <Row>
                <Col xl="4" className={errors.portfolio_owner_address1 ? "is-invalid" : ""}>
                  <div>
                    <FormInput
                      type="AddressAutocomplete"
                      name="portfolio_owner_address1"
                      placeholder="Enter Mailing street address"
                      label="Street Address"
                      prefix="portfolio_owner_"
                    />
                  </div>
                  <Form.Text style={{ color: "#DC3545" }}>
                    {errors.portfolio_owner_address1 && errors.portfolio_owner_address1.message}
                  </Form.Text>
                </Col>
                <Col xl="4">
                  <FormInput name="portfolio_owner_city" placeholder="Enter City" label="City" />
                </Col>
              </Row>
              <Row>
                <Col xl="4">
                  <FormInput
                    name="portfolio_owner_state"
                    label="State"
                    type="select"
                    options={STATES.map((item) => ({ label: item.name, value: item.name }))}
                    placeholder="Select State"
                  />
                </Col>
                <Col xl="4">
                  <FormInput type="number" name="portfolio_owner_postal_code" placeholder="Enter ZIP" label="ZIP" />
                </Col>
              </Row>
              <Row>
                <Col xl="4">
                  <FormInput
                    type="date"
                    name="portfolio_owner_date_of_birth"
                    placeholder="Enter Date of Birth"
                    label="Date of Birth"
                  />
                </Col>
                <Col xl="4">
                  <FormInput
                    name="ownerSsn"
                    placeholder="Please Enter 9 digits of the Individual’s Social Security Number"
                    label="SSN"
                    type="maskInput"
                    mask={[/[1-9]/, /\d/, /\d/, "-", /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                    guide={false}
                  />
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

export default PortfolioOwnerVerify;
