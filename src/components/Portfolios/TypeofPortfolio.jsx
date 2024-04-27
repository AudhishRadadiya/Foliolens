import React, { useEffect, useState } from "react";
import { Button, Col, Row, Modal, Form } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { useSelector } from "react-redux";
import { ROLES } from "../../Utility";
import FormInput from "../Form/FormInput";

const TypeofPortfolio = ({ setIsExistPersonalPortfolio, portfolioId }) => {
  const [show, setShow] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const portfolios = useSelector(({ allPortfolio, sharedPortfolio }) =>
    [...allPortfolio, ...sharedPortfolio].map((d) => ({
      ...d,
      permission: d.user_id == loggedUserData.id ? null : d.permission,
    }))
  );
  const existPersonalPortfolio = portfolios.filter(
    (item) =>
      item.account_type === "personal" && item.is_shared === 0 && item.dwolla_customer_id && item.status == "VERIFIED"
  );

  const methods = useFormContext();
  const {
    setValue,
    watch,
    register,
    formState: { errors },
  } = methods;
  const account_type = watch("account_type");

  useEffect(() => {
    if (loggedUserData?.user_role === ROLES.PropertyManager && account_type === "personal") {
      setShowPortfolio(true);
    }
  }, [loggedUserData]);

  return (
    <div className="portfolio-wrapper mb-5">
      <div className="form-col">
        <h3 className="mb-3 title">
          Type of Portfolio
          <img
            src={require("../../Assets/images/icon-help.svg").default}
            alt=""
            onClick={() => setShow(true)}
            className="icon-right pointer"
          />
        </h3>
        <Row>
          <Col xl="6">
            <Button
              onClick={() => setValue("account_type", "personal")}
              className={`w-100 btn-lg mb-3 ${account_type === "personal" ? "active" : "btn-white"}`}
            >
              Individual
            </Button>
          </Col>
          <Col xl="6">
            <Button
              onClick={() => {
                setValue("account_type", "business");
                setIsExistPersonalPortfolio(false);
                setShowPortfolio(false);
              }}
              className={`w-100  btn-lg mb-3 ${account_type === "business" ? "active" : "btn-white"}`}
            >
              Business
            </Button>
          </Col>
        </Row>
        <Form.Text style={{ color: "#DC3545" }}>{errors?.account_type && errors?.account_type?.message}</Form.Text>
      </div>
      <Row className="mt-3 w-100">
        {portfolioId && account_type === "personal" && loggedUserData.user_role === ROLES.PropertyManager && (
          <Col md={4} sm={6}>
            <h3 style={{ fontSize: "17px" }}>Select an option to proceed:</h3>
            <Form.Check
              type="radio"
              label={"Connect with an existing bank account"}
              value="existing_account"
              onChange={() => {
                setShowPortfolio(true);
              }}
              {...register("optionBankPersonal")}
            />
            <Form.Check
              type="radio"
              label={"Onboard a new bank account"}
              value="new_account"
              onChange={() => {
                setIsExistPersonalPortfolio(false);
                setShowPortfolio(false);
              }}
              {...register("optionBankPersonal")}
            />
          </Col>
        )}
        {showPortfolio && (
          <Col md={3} sm={6}>
            <FormInput
              name="portfolioId"
              label="Individual Verified Portfolio*"
              placeholder="Select Portfolio"
              type="select"
              options={existPersonalPortfolio.map((item) => ({ label: item.portfolio_name, value: item.portfolio_id }))}
              allPortfolios={existPersonalPortfolio}
              onChange={(e) => {
                const item = existPersonalPortfolio.find((item1) => item1.portfolio_id === Number(e.target.value));
                setIsExistPersonalPortfolio(item);
              }}
            />
          </Col>
        )}
      </Row>
      <Modal className="modal-v1 border-radius-16" show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <h5>Type of portfolio</h5>
        </Modal.Header>
        <Modal.Body>
          <p>
            This information is used to represent the investment structure associated with a portfolio. Investors may
            utilize many different types of investment structures for real estate ownership to meet their tax deferment
            and investment objectives.
          </p>
          <p>
            Before you can send or receive funds using a portfolio bank account, the Individual or Business authorized
            representive for the portfolio must be verified by Dwolla our ACH payments processor as part of the US
            government's KYC verification requirements.
          </p>
          <p>
            Regardless of which type you choose to create for your portfolio, keep in mind that all represenatives
            onboarded must be US persons of age 18 or older.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TypeofPortfolio;
