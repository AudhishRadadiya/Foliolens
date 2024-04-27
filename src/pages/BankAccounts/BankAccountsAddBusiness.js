import React, { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { Stepper, Step, useStepper } from "react-progress-stepper";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";
import { API, graphqlOperation } from "aws-amplify";

import PortfolioIndividualForm from "../../components/Portfolios/PortfolioIndividualForm";
import Container from "../../components/Layout/Container";
import TypeofPortfolio from "../../components/Portfolios/TypeofPortfolio";
import { setLoading } from "../../store/reducer";
import { createDwollaCustomer } from "../../graphql/mutations";
import { BUSINESS_TYPES, getId } from "../../Utility";
import STATES from "../../Utility/states.json";

import { createRecordTB, fetchAllPortfolios, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { BankAccountBusinessSchema } from "../../Utility/validationSchema";

const selectedBusinessId = "9ed3cf5f-7d6f-11e3-8af8-5404a6144203";
const selectedIndustryId = "9ed3f666-7d6f-11e3-9a8d-5404a6144203";

function renameKeys(obj, newKeys) {
  const keyValues = Object.keys(obj).map((key) => {
    const newKey = newKeys[key] || key;
    return { [newKey]: obj[key] };
  });
  return Object.assign({}, ...keyValues);
}

export default function BankAccountsAddBusiness() {
  const { step, incrementStep, decrementStep } = useStepper(0, 2);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const { selectedPortfolio = {}, stateFormData } = state || {};
  const { id: portfolioId } = selectedPortfolio;
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);

  const [isExistPersonalPortfolio, setIsExistPersonalPortfolio] = useState(false);
  const methods = useForm({
    resolver: yupResolver(BankAccountBusinessSchema),
    defaultValues: {
      account_type: "",
      ownerCountry: "US",
      businessType: "",
    },
    // mode: "onChange",
  });
  const { watch, reset } = methods;
  const accountType = watch("account_type");

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));

      const userId = loggedUserData.id;
      let dbData = {};
      if (formData.state) formData.state = STATES.find((item) => item.name === formData.state)?.abbreviation;

      if (formData.portfolio_owner_state)
        formData.portfolio_owner_state = STATES.find(
          (item) => item.name === formData.portfolio_owner_state
        )?.abbreviation;

      if (formData.controller_state)
        formData.controller_state = STATES.find((item) => item.name === formData.controller_state)?.abbreviation;

      const { name: business_type_name, type: business_type } =
        BUSINESS_TYPES.find((item) => item.value === formData.businessType) || {};

      const isPortfolioExists = await getRdsFN("portfolioCount", {
        email: formData.email,
      });
      let editedEmail = formData.email;

      if (isPortfolioExists) {
        let cntEmail = 0;
        isPortfolioExists?.map(({ email_count }) => {
          cntEmail = cntEmail > (parseInt(email_count) ? parseInt(email_count) : 0) ? cntEmail : parseInt(email_count);
        });
        cntEmail = cntEmail + 1;
        editedEmail = formData.email.split("@");
        editedEmail = `${editedEmail[0]}+${cntEmail}@${editedEmail[1]}`;
      }

      if (formData.account_type === "personal") {
        if (isExistPersonalPortfolio) {
          dbData = {
            dwolla_customer_id: isExistPersonalPortfolio.dwolla_customer_id,
            dwolla_beneficial_owner_id: isExistPersonalPortfolio.dwolla_beneficial_owner_id,
            first_name: isExistPersonalPortfolio.first_name,
            last_name: isExistPersonalPortfolio.last_name,
            email: isExistPersonalPortfolio.email,
            account_type: isExistPersonalPortfolio.account_type.toLowerCase(),
            address1: isExistPersonalPortfolio.address1,
            city: isExistPersonalPortfolio.city,
            state: isExistPersonalPortfolio.state,
            postal_code: isExistPersonalPortfolio.postal_code,
            date_of_birth: isExistPersonalPortfolio.date_of_birth,
            original_email: isExistPersonalPortfolio.original_email,
            status: isExistPersonalPortfolio.status,
          };
        } else {
          dbData = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: editedEmail,
            account_type: formData.account_type.toLowerCase(),
            address1: formData.address1,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            date_of_birth: moment(formData.date_of_birth).format("YYYY-MM-DD"),
            original_email: formData.email,
          };
        }
      } else {
        if (business_type === "soleProprietorship") {
          dbData = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: editedEmail,
            account_type: formData.account_type.toLowerCase(),
            address1: formData.address1,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            date_of_birth: moment(formData.date_of_birth).format("YYYY-MM-DD"),
            original_email: formData.email,
            business_name: formData.business_name,
            business_type_name,
            business_type: business_type,
            business_classification: selectedBusinessId,
            industry_classification: selectedIndustryId,
            ein: formData.ein,
          };
        } else {
          dbData = {
            email: editedEmail,
            first_name: formData.controller_first_name,
            last_name: formData.controller_last_name,
            date_of_birth: moment(formData.date_of_birth).format("YYYY-MM-DD"),
            address1: formData.controller_address1,
            city: formData.controller_city,
            state: formData.controller_state,
            postal_code: formData.controller_postal_code,
            designation: formData.controllerTitle,
            business_owner_first_name: formData.first_name,
            business_owner_last_name: formData.last_name,
            business_type_name,
            business_email: editedEmail,
            account_type: formData.account_type.toLowerCase(),
            business_address1: formData.address1,
            business_city: formData.city,
            business_state: formData.state,
            business_postal_code: formData.postal_code,
            business_classification: selectedBusinessId,
            industry_classification: selectedIndustryId,
            business_type: business_type,
            business_name: formData.business_name,
            portfolio_owner_first_name: formData.portfolio_owner_first_name,
            portfolio_owner_last_name: formData.portfolio_owner_last_name,
            portfolio_owner_address1: formData.portfolio_owner_address1,
            portfolio_owner_city: formData.portfolio_owner_city,
            portfolio_owner_state: formData.portfolio_owner_state,
            portfolio_owner_postal_code: formData.portfolio_owner_postal_code,
            portfolio_owner_date_of_birth: moment(formData.portfolio_owner_date_of_birth).format("YYYY-MM-DD"),
            ein: formData.ein,
            original_email: formData.email,
            signature: formData.signature,
            sign_date: moment().format("YYYY-MM-DD"),
          };
        }
      }

      if ((formData.account_type === "personal" && !isExistPersonalPortfolio) || formData.account_type === "business") {
        const dwollaCustomerData = {
          ...formData,
          businessType: business_type,
          firstName: formData.first_name,
          lastName: formData.last_name,
          dateOfBirth: moment(formData.date_of_birth).format("YYYY-MM-DD"),
          postalCode: formData.postal_code,
          businessName: formData.business_name,
          doingBusinessAs: formData.business_preferred_name,
          type: formData.account_type,
          controllerFirstName: formData.controller_first_name,
          controllerLastName: formData.controller_last_name,
          controllerAddress1: formData.controller_address1,
          controllerCity: formData.controller_city,
          controllerState: formData.controller_state,
          controllerPostalCode: formData.controller_postal_code,
          ownerSsn: formData.portfolio_owner_ssn,
          ownerFirstName: formData.portfolio_owner_first_name,
          ownerLastName: formData.portfolio_owner_last_name,
          ownerAddress1: formData.portfolio_owner_address1,
          ownerCity: formData.portfolio_owner_city,
          ownerState: formData.portfolio_owner_state,
          ownerPostalCode: formData.portfolio_owner_postal_code,
          ownerDateOfBirth: moment(formData.portfolio_owner_date_of_birth).format("YYYY-MM-DD"),
          email: editedEmail,
          businessClassification: selectedIndustryId,
          controllerCountry: "US",
        };
        const getCustomerId = await API.graphql(graphqlOperation(createDwollaCustomer, dwollaCustomerData));
        if (!getCustomerId || getCustomerId.data.createDwollaCustomer.status === 500) {
          dispatch(setLoading(false));
          throw new Error(getCustomerId?.data?.createDwollaCustomer?.response || "Something went wrong!");
        }
        const dwollaCustomer = JSON.parse(getCustomerId.data.createDwollaCustomer.response);
        dbData = {
          ...dbData,
          dwolla_customer_id: dwollaCustomer.customerId,
          dwolla_beneficial_owner_id: dwollaCustomer.beneficialOwnerId,
          status: "PENDING",
        };
      }

      if (portfolioId) {
        await updateRecordTB("Portfolio", {
          ...dbData,
          id: portfolioId,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      } else {
        const businessDBData = renameKeys(dbData, {
          portfolio_owner_first_name: "owner_first_name",
          portfolio_owner_last_name: "owner_last_name",
          portfolio_owner_address1: "owner_address1",
          portfolio_owner_city: "owner_city",
          portfolio_owner_state: "owner_state",
          portfolio_owner_postal_code: "owner_postal_code",
          portfolio_owner_date_of_birth: "owner_date_of_birth",
        });
        await createRecordTB("BusinessAccount", {
          ...businessDBData,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
          id: getId(),
          active: 1,
          user_id: userId,
        });
      }
      dispatch(setLoading(false));
      toast.success("Your business details added successfully");
      dispatch(fetchAllPortfolios());
      navigate("/BankAccountsAdd", {
        state: {
          isShowPopup: formData.account_type === "business" ? true : false,
          stateFormData,
        },
      });
    } catch (error) {
      console.log("Error adding create Portfolio", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  const setPortfolioValue = () => {
    const personalPortfolio = allPortfolio.find((data) => data.account_type === "personal");
    Object.keys(personalPortfolio).forEach((originalKey) => {
      let value = personalPortfolio[originalKey];
      let key = originalKey;
      switch (originalKey) {
        case "original_email":
          key = "email";
          methods.setValue(key, value);
          break;
        case "first_name":
          methods.setValue(key, value);
          break;
        case "last_name":
          methods.setValue(key, value);
          break;
        case "city":
          methods.setValue(key, value);
          break;
        case "state":
          methods.setValue(key, value);
          break;
        case "address1":
          methods.setValue(key, value);
          break;
        case "postal_code":
          methods.setValue(key, value);
          break;
        case "date_of_birth":
          methods.setValue(key, value);
          break;
        default:
          break;
      }
    });
  };

  return (
    <Container title="Add Bank Account" isBack onBack={() => navigate("/BankAccountsAdd")}>
      <div className="portfolio-stepper mb-5">
        <Stepper step={step}>
          <Step />
          <Step />
        </Stepper>
      </div>

      <div className="add-portfolio portfolio">
        <FormProvider {...methods}>
          <Form>
            {(() => {
              switch (step) {
                case 0:
                  return (
                    <TypeofPortfolio
                      setIsExistPersonalPortfolio={setIsExistPersonalPortfolio}
                      portfolioId={portfolioId}
                    />
                  );
                case 1:
                  return <PortfolioIndividualForm />;

                default:
                  break;
              }
            })()}

            <Row className="pt-5">
              <Col>
                <Button
                  onClick={() => {
                    if (step === 0) {
                      reset();
                      navigate("/BankAccountsAdd");
                    } else decrementStep();
                  }}
                  className="btn-md btn-reset"
                >
                  {step === 0 ? "Cancel" : "Back"}
                </Button>
              </Col>
              <Col className="text-end">
                <Button
                  onClick={async () => {
                    if (step === 0) {
                      await methods.trigger("account_type");
                      if (!accountType) return;
                      // const isSecondStepValid = Object.keys(errors).some((ie) => ["account_type"].includes(ie));
                      if (isExistPersonalPortfolio) {
                        setPortfolioValue();
                        methods.handleSubmit(onSubmit)();
                      } else {
                        incrementStep();
                      }
                    } else if (step === 1) {
                      methods.handleSubmit(onSubmit)();
                    }
                  }}
                  className="btn-md btn-next"
                >
                  {isExistPersonalPortfolio ? "Save" : step === 1 ? "Save" : "Next"}
                </Button>
              </Col>
            </Row>
          </Form>
        </FormProvider>
      </div>
    </Container>
  );
}
