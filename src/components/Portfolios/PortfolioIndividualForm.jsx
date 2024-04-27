import React, { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Collapse, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { useFormContext } from "react-hook-form";
import FormInput from "../Form/FormInput";
import { BUSINESS_TYPES } from "../../Utility";
import { useSelector } from "react-redux";
import STATES from "../../Utility/states.json";
import Modal from "react-bootstrap/Modal";
import { useEffect } from "react";

export const ISNotSoleProprietorship = (item) => !["soleProprietorship", "Unincorporated", "Trust", ""].includes(item);
export const ISSoleProprietorship = (item) => ["soleProprietorship", "Unincorporated", "Trust", ""].includes(item);

const BusinessForm = ({ errors, isEmail = false, prefix = "", isController = false }) => {
  return (
    <div>
      <Row>
        {isController && (
          <Col xl="4">
            <FormInput name={"controllerTitle"} placeholder="Enter Controller Title" label="Title" astrict />
          </Col>
        )}
        <Col xl="4">
          <FormInput name={prefix + "first_name"} placeholder="Enter First Name" label="First Name" astrict />
        </Col>
        <Col xl="4">
          <FormInput name={prefix + "last_name"} placeholder="Enter Last Name" label="Last Name" astrict />
        </Col>
        {isEmail && (
          <Col xl="4">
            <FormInput name={prefix + "email"} placeholder="Enter Email" label="Email" astrict />
          </Col>
        )}
      </Row>
      <Row>
        <Col xl="4">
          <FormInput
            type="datePicker"
            name={prefix + "date_of_birth"}
            placeholder="mm/dd/yyyy"
            label="Date of Birth"
            astrict
          />
        </Col>
        <Col xl="4">
          {prefix === "portfolio_owner_" ? (
            <FormInput
              name={prefix + "ssn"}
              // placeholder="Please Enter 9 digits of the Individual’s Social Security Number"
              placeholder="XXX-XX-XXXX"
              label="Social Security Number (SSN)"
              type="maskInput"
              mask={[/[1-9]/, /\d/, /\d/, "-", /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
              guide={false}
              astrict
            />
          ) : (
            <FormInput
              name={prefix + "ssn"}
              type="maskInput"
              placeholder="Enter Last 4 of Social Security Number"
              label="Last 4 of SSN"
              astrict
              mask={[/[1-9]/, /\d/, /\d/, /\d/]}
              guide={false}
            />
          )}
        </Col>
      </Row>
      <Row>
        <Col
          xl="4"
          className={
            (prefix === "controller_" && (errors.controller_address1 ? "is-invalid" : "")) ||
            (prefix === "portfolio_owner_" && (errors.portfolio_owner_address1 ? "is-invalid" : "")) ||
            (prefix === "" && errors.address1 ? "is-invalid" : "")
          }
        >
          <div>
            <FormInput
              type="AddressAutocomplete"
              name={prefix + "address1"}
              prefix={prefix}
              placeholder="Enter Mailing street address"
              label="Street Address"
              astrict
            />
          </div>
          {/* <Form.Text style={{ color: "#DC3545" }}>
            {prefix === "controller_" && errors?.controller_address1?.message}
            {prefix === "portfolio_owner_" && errors?.portfolio_owner_address1?.message}
            {prefix === "" && errors?.address1?.message}
          </Form.Text> */}
        </Col>
        <Col xl="4">
          <FormInput name={prefix + "city"} placeholder="Enter City" label="City" astrict />
        </Col>
      </Row>
      <Row>
        <Col xl="4">
          <FormInput
            type="select"
            name={prefix + "state"}
            label="State"
            astrict
            options={STATES.map((item) => ({ label: item.name, value: item.name }))}
            placeholder="Select State"
          />
        </Col>
        <Col xl="4">
          <FormInput name={prefix + "postal_code"} placeholder="Enter ZIP" label="ZIP" astrict />
        </Col>
      </Row>
    </div>
  );
};

export default function PortfolioIndividualForm() {
  const [address, setAddress] = useState({});
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const methods = useFormContext();
  const {
    watch,
    setValue,
    formState: { errors },
    getValues,
  } = methods;
  const isExistPortfolio = allPortfolio.filter((item) => item.original_email);

  useEffect(() => {
    if (isExistPortfolio.length > 0) {
      const sortPortfolioData = isExistPortfolio.find((data) => data);
      if (sortPortfolioData) {
        Object.keys(sortPortfolioData).forEach((key) => {
          let values = sortPortfolioData[key];
          let keys = key;
          switch (key) {
            case "first_name":
              setValue(keys, values);
              break;
            case "last_name":
              setValue(keys, values);
              break;
            case "city":
              setValue(keys, values);
              break;
            case "postal_code":
              setValue(keys, values);
              break;
            case "original_email":
              keys = "email";
              setValue(keys, values);
              break;
            case "date_of_birth":
              setValue(keys, values ? new Date(values) : null);
              break;
            case "state":
              // const stateFullname = STATES.find((item) => item.abbreviation === values);
              // stateFullname?.name
              setValue(keys, values);
              break;
            case "address1":
              setValue(keys, values);
              break;
            default:
          }
        });
        let value = { label: sortPortfolioData.address1, value: {} };
        setAddress(value);
        setValue("business_date", new Date(), {
          shouldValidate: true,
        });
      }
    }
  }, [allPortfolio]);

  useEffect(() => {
    if (loggedUserData && isExistPortfolio.length <= 0) {
      Object.keys(loggedUserData).forEach((key) => {
        let values = loggedUserData[key];
        let keys = key;
        switch (key) {
          case "first_name":
            setValue(keys, values);
            break;
          case "last_name":
            setValue(keys, values);
            break;
          case "city":
            setValue(keys, values);
            break;
          case "state":
            setValue(keys, values);
            break;
          case "zipcode":
            keys = "postal_code";
            setValue(keys, values);
            break;
          case "email":
            setValue(keys, values);
            break;
          case "address":
            keys = "address1";
            setValue(keys, values);
          default:
        }
      });
      let value = { label: loggedUserData.address, value: {} };
      setAddress(value);
      setValue("business_date", new Date(), {
        shouldValidate: true,
      });
    }
  }, [loggedUserData]);

  const account_type = watch("account_type");
  const businessType = watch("businessType");
  const [adminOpen, setAdminOpen] = useState(true);
  const [controllerOpen, setcontrollerOpen] = useState(true);
  const [ownerOpen, setownerOpen] = useState(true);
  const [show, setShow] = useState(false);
  const [businessModel, setBusinessModel] = useState(false);
  const [businessAdminModel, setBusinessAdminModel] = useState(false);
  const [businessControlModel, setBusinessControlModel] = useState(false);
  const [businessOwnerModel, setBusinessOwnerModel] = useState(false);
  const [signatureModel, setSignatureModel] = useState(false);

  const copyAboveFormVal = (isChecked, prefix) => {
    setValue(prefix + "first_name", isChecked ? getValues("first_name") : "");
    setValue(prefix + "last_name", isChecked ? getValues("last_name") : "");
    setValue(prefix + "city", isChecked ? getValues("city") : "");
    setValue(prefix + "state", isChecked ? getValues("state") : "");
    setValue(prefix + "address1", isChecked ? getValues("address1") : "");
    setValue(prefix + "postal_code", isChecked ? getValues("postal_code") : "");
    setValue(prefix + "date_of_birth", isChecked ? getValues("date_of_birth") : "");
  };

  return (
    <>
      <div className="portfolio-wrapper mb-5">
        {account_type === "personal" && (
          <div className="form-col">
            <div>
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
                <Col xl="6">
                  <FormInput name="first_name" placeholder="Enter First Name" label="First Name" astrict />
                </Col>
                <Col xl="6">
                  <FormInput name="last_name" placeholder="Enter Last Name" label="Last Name" astrict />
                </Col>
              </Row>
              <Row>
                <Col xl="6" className={errors.address1 ? "is-invalid" : ""}>
                  <div>
                    <FormInput
                      type="AddressAutocomplete"
                      name={"address1"}
                      placeholder="Enter Mailing street address"
                      label="Address street"
                      astrict
                    />
                  </div>
                  <Form.Text style={{ color: "#DC3545" }}>{errors.address1 && errors.address1.message}</Form.Text>
                </Col>
                <Col xl="6">
                  <FormInput name="city" placeholder="Enter City" label="City" astrict />
                </Col>
              </Row>
              <Row>
                <Col xl="6">
                  <FormInput
                    name="state"
                    label="State"
                    astrict
                    type="select"
                    options={STATES.map((item) => ({ label: item.name, value: item.name }))}
                    placeholder="Select State"
                  />
                </Col>
                <Col xl="6">
                  <FormInput type="number" name="postal_code" placeholder="Enter ZIP" label="ZIP" astrict />
                </Col>
              </Row>
              <Row>
                <Col xl="6">
                  <FormInput
                    type="email"
                    name="email"
                    placeholder="Enter Email address"
                    label="Email address"
                    astrict
                  />
                </Col>
                <Col xl="6">
                  <FormInput
                    type="datePicker"
                    name="date_of_birth"
                    placeholder="Enter Date of Birth"
                    label="Date of Birth"
                    astrict
                  />
                </Col>
              </Row>
              <Row>
                <Col xl="6">
                  <FormInput
                    type="maskInput"
                    name="ssn"
                    // placeholder="Please Enter 9 digits of the Individual’s Social Security Number"
                    placeholder="XXX-XX-XXXX"
                    label="Social Security Number (SSN)"
                    astrict
                    mask={[/[1-9]/, /\d/, /\d/, "-", /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                    guide={false}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}
        {account_type === "business" && (
          <div className="w-100">
            <h3 className="mb-4 title">
              Business Details
              <img
                src={require("../../Assets/images/icon-help.svg").default}
                alt=""
                onClick={() => setBusinessModel(true)}
                className="icon-right pointer"
              />
            </h3>
            <Row>
              <Col xl="4">
                <FormInput
                  type="select"
                  name="businessType"
                  label="Business Type"
                  astrict
                  options={BUSINESS_TYPES.map((item) => ({ label: item.name, value: item.value }))}
                  placeholder="Select Business Type"
                />
              </Col>
              <Col xl="4">
                <FormInput name="business_name" placeholder="Enter Business Name" label="Business Name" astrict />
              </Col>
              <Col xl="4">
                <FormInput
                  name="ein"
                  type="maskInput"
                  placeholder="Enter EIN (Employer Identification Number)"
                  mask={[/\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/]}
                  guide={false}
                  label="EIN (Employer Identification Number)"
                  astrict
                />
              </Col>
            </Row>
            <Row>
              <Col xl="4">
                <FormInput
                  name="business_preferred_name"
                  placeholder="Enter Business Preferred Name"
                  label="Business Preferred Name"
                  astrict
                />
              </Col>
            </Row>

            <div className="mb-3 title title-collapse fw-bold">
              Business Admin's Details
              <img
                src={require("../../Assets/images/icon-help.svg").default}
                alt=""
                className="icon-right pointer"
                onClick={() => setBusinessAdminModel(true)}
              />
              <FontAwesomeIcon
                icon={adminOpen ? faAngleUp : faAngleDown}
                className="ms-3"
                onClick={() => setAdminOpen(!adminOpen)}
              />
            </div>

            <Collapse in={adminOpen}>
              <div>
                <BusinessForm errors={errors} isEmail={true} defaultAddress={address} />
              </div>
            </Collapse>
            {businessType && ISNotSoleProprietorship(businessType) && (
              <>
                <div className="mb-3 title title-collapse fw-bold">
                  Business Controller
                  <img
                    src={require("../../Assets/images/icon-help.svg").default}
                    alt=""
                    className="icon-right pointer"
                    onClick={() => setBusinessControlModel(true)}
                  />
                  <FontAwesomeIcon
                    icon={controllerOpen ? faAngleUp : faAngleDown}
                    className="ms-3"
                    onClick={() => setcontrollerOpen(!controllerOpen)}
                  />
                </div>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Same information as above."
                    onChange={(e) => copyAboveFormVal(e.target.checked, "controller_")}
                  />
                </Form.Group>
                <Collapse in={controllerOpen}>
                  <div>
                    <BusinessForm errors={errors} prefix="controller_" isController={true} />
                  </div>
                </Collapse>
                <div className="mb-3 title title-collapse fw-bold">
                  Business Owner's Details
                  <img
                    src={require("../../Assets/images/icon-help.svg").default}
                    alt=""
                    onClick={() => setBusinessControlModel(true)}
                    className="icon-right pointer"
                  />
                  <FontAwesomeIcon
                    icon={ownerOpen ? faAngleUp : faAngleDown}
                    className="ms-3"
                    onClick={() => setownerOpen(!ownerOpen)}
                  />
                </div>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Same information as above."
                    onChange={(e) => copyAboveFormVal(e.target.checked, "portfolio_owner_")}
                  />
                </Form.Group>
                <Collapse in={ownerOpen}>
                  <div>
                    <BusinessForm prefix="portfolio_owner_" errors={errors} />
                  </div>
                </Collapse>
              </>
            )}
            <hr />
            <Row>
              <Col xl="6" style={{ position: "relative" }}>
                <ul className="mb-3">
                  <li>
                    Certify, to the best of my knowledge, that the information provided earlier is complete and correct.
                  </li>
                  <li>
                    {`Agree to our partner  `}
                    <a target="blank" href="https://www.dwolla.com/legal/tos/">
                      Dwolla's Terms of Use
                    </a>
                    {` and `}
                    <a target="blank" href="https://www.dwolla.com/legal/privacy/">
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </Col>
            </Row>
            <Row>
              <Col xl="4" style={{ position: "relative" }}>
                <img
                  src={require("../../Assets/images/icon-help.svg").default}
                  alt=""
                  onClick={() => setSignatureModel(true)}
                  className="icon-right pointer"
                  style={{
                    position: "absolute",
                    right: "15px",
                  }}
                />
                <FormInput name="signature" placeholder="Enter Signature" label="Signature" astrict />
              </Col>
              <Col xl="4">
                <FormInput
                  type="datePicker"
                  name="business_date"
                  placeholder="Enter Business Date"
                  label="Date"
                  astrict
                />
              </Col>
            </Row>
          </div>
        )}
      </div>
      <Modal show={show} onHide={() => setShow(false)} className="modal-v1 border-radius-16">
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <div>
            Provide information which verifies the identity of the individual authorized to manage bank accounts on
            behalf of the portfolio.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal className="modal-v1 border-radius-16" show={businessModel} onHide={() => setBusinessModel(false)}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            Provide basic information about the business entity, identify the type of business in order to better
            analyze the nature of a business. This information will be used in verifying the business as a legal entity.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBusinessModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        className="modal-v1 border-radius-16"
        show={businessAdminModel}
        onHide={() => setBusinessAdminModel(false)}
      >
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            In relation to verifying the business entity, for some business types such as sole propreitorships, you must
            also provide information which verifies the identity of its business account admin.
          </p>
          <p>
            Your business account admin is an individual who generally acts as the agent signing up on behalf of the
            business. A business account admin could be the business owner.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBusinessAdminModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        className="modal-v1 border-radius-16"
        show={businessControlModel}
        onHide={() => setBusinessControlModel(false)}
      >
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            In relation to verifying the business entity, for some business types such as corporations, LLCs,
            partnerships, you must also provide information which verifies the identity of its controller.
          </p>
          <p>
            Provide basic information to verify the identity of a business controller, which means an individual who has
            responsibility for controlling, managing or directing business financial operations.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBusinessControlModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        className="modal-v1 border-radius-16"
        show={businessOwnerModel}
        onHide={() => setBusinessOwnerModel(false)}
      >
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            In relation to verifying the business entity, for some business types such as corporations, LLCs,
            partnerships, you must also provide information which verifies the identity of its beneficial owners
          </p>
          <p>
            Provide basic information to verify the identity of a beneficial owner, which means any natural person who
            owns 25% or more of the business, and an individual who has responsibility for controlling, managing or
            directing that business.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBusinessOwnerModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal className="modal-v1 border-radius-16" show={signatureModel} onHide={() => setSignatureModel(false)}>
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
          <Button variant="secondary" onClick={() => setSignatureModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
