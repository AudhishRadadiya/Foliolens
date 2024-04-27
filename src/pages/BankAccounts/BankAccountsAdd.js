import React, { useEffect, useState } from "react";
import Container from "../../components/Layout/Container";
import { Form, Row, Col, Button, Modal, ListGroup, Card } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { usePlaidLink } from "react-plaid-link";
import { API, graphqlOperation } from "aws-amplify";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

import BankAccountResetNextBtn from "../../components/BankAccount/BankAccountResetNextBtn";
import { createOwnerDwollaAccount, createPlaidLink, createPortfolioTrustAccount } from "../../graphql/mutations";
import envFile from "../../envFile";
import {
  getDwollaProcessorToken,
  getPlaidAccessToken,
  getPlaidAccounts,
  getPlaidInstitution,
} from "../../graphql/queries";
import { setLoading } from "../../store/reducer";
import { store } from "../../store";
import { getId, getPublicIpv4, ROLES } from "../../Utility";
import FormInput from "../../components/Form/FormInput";
import { createRecordTB, getBankAccountPhotos, getRdsFN } from "../../Utility/ApiService";
import InviteOwnerAccountAdd from "./InviteOwnerAccountAdd";

const validationSchema = yup
  .object({
    businessType: yup.string().required("Business Type is a required field").nullable(),
    portfolio_id: yup.string().when("businessType", {
      is: "Property Management",
      then: yup.string().notRequired(),
      otherwise: yup.string().required("Please select portfolio"),
    }),
    collectType: yup
      .array()
      .of(yup.string().required())
      .min(1, "Please choose at least one option")
      .typeError("Please choose at least one option"),
    selectedPersonalAccount: yup.string().nullable(),
  })
  .required();

export default function BankAccountsAdd() {
  const [plaidToken, setplaidToken] = useState("");
  const [collabData, setCollabData] = useState();
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const portfolios = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allPortfolio = [...portfolios, ...sharedPortfolio].map((d) => ({
    ...d,
    permission: d.user_id === loggedUserData.id ? null : d.permission,
  }));

  const [model, setModel] = useState({ model1: false, model2: false });
  const [personalAccounts, setPersonalBankAccounts] = useState([]);
  const [dwollaCustomerId, setDwollaCustomerId] = useState("");
  const [sortingPortfolios, setSortingPortfolios] = useState();
  // const [ownerData, setOwnerData] = useState();

  const { state } = useLocation();
  const { isShowPopup, stateFormData, ownerData } = state || {};
  const checkInviteOwner = loggedUserData?.user_role !== ROLES.PropertyOwner && ownerData?.invited !== 1

  useEffect(() => {
    getCollaboratorData();
    // getOwnerData();
  }, []);

  // const getOwnerData = async () => {
  //   const res = await getRdsFN("tbSelect", {
  //     source: "pOwn",
  //     email: loggedUserData.email,
  //   });
  //   const fetchInvitedOwner = res?.find((i) => i.invited === 1);
  //   setOwnerData(fetchInvitedOwner);
  // };

  const getCollaboratorData = async () => {
    const res = await getRdsFN("tbSelect", {
      source: "coll",
      email: loggedUserData.email,
    });
    setCollabData(res[0]);
  };

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      businessType: "",
    },
  });

  const { open, ready } = usePlaidLink({
    token: plaidToken,
    onSuccess: (public_token, metaData) => {
      addBankAccount(metaData);
    },
  });
  const businessType = methods.watch("businessType");
  const portfolio_id = methods.watch("portfolio_id");
  // const collectType = methods.watch("collectType");
  // const selectedPersonalAccount = methods.watch("selectedPersonalAccount");

  useEffect(() => {
    const sortingPortfolioData = allPortfolio.filter((i) =>
      businessType === "SharedOwnerPortfolio" ? i.is_shared === 1 : true
    );
    setSortingPortfolios(sortingPortfolioData);
  }, [businessType]);

  useEffect(() => {
    getBusinessAccountId();

    API.graphql(
      graphqlOperation(createPlaidLink, {
        userId: loggedUserData.id,
        userName: envFile.PLAID_USERNAME,
      })
    )
      .then((res) => {
        setplaidToken(res.data.createPlaidLink.response);
      })
      .catch((err) => {
        console.log(err);
      });
    if (loggedUserData?.user_role === ROLES.Landlord) {
      methods.setValue("businessType", "Owner");
    }
  }, []);

  useEffect(() => {
    fetchPersonalSavedBankAccounts();
  }, [portfolio_id, portfolios]);

  useEffect(() => {
    if (stateFormData) {
      methods.setValue("businessType", stateFormData?.businessType);
      methods.setValue("portfolio_id", stateFormData?.portfolio_id);
      methods.setValue("collectType", stateFormData?.collectType);
      if (isShowPopup) {
        setShow(true);
      }
    }
  }, [isShowPopup, stateFormData]);

  const selectedPortfolio = allPortfolio.find((it) => it.id === Number(portfolio_id) && it.account_type === "personal");
  const isExitPersonalPortfolio = allPortfolio
    .filter((item) => selectedPortfolio?.id != item.id && item.account_type === "personal")
    .map((item) => item.dwolla_customer_id)
    .includes(selectedPortfolio?.dwolla_customer_id);

  const fetchPersonalSavedBankAccounts = async () => {
    try {
      if (portfolio_id) {
        dispatch(setLoading(true));
        const addedAccounts = await getRdsFN("personalPortfolioBankAccounts", {
          userId: loggedUserData.id,
        });
        const bankAccounts = await getBankAccountPhotos(addedAccounts);
        const accountIdObj = {};
        const accountIds = [];
        const filteredAccounts = bankAccounts
          .filter((acc) => {
            accountIdObj[acc.account_id] = true;
            if (acc.portfolio_id === Number(portfolio_id)) {
              accountIds.push(acc.account_id);
            }
            return acc.portfolio_id !== Number(portfolio_id);
          })
          .filter((acc) => !accountIds.includes(acc.account_id))
          .filter((acc) => {
            if (accountIdObj[acc.account_id]) {
              accountIdObj[acc.account_id] = false;
              return true;
            } else {
              return false;
            }
          })
          .filter((acc) => {
            const sport = allPortfolio.find((it) => it.id === Number(acc.portfolio_id));
            return selectedPortfolio?.dwolla_customer_id === sport?.dwolla_customer_id;
          });
        setPersonalBankAccounts(filteredAccounts);
        dispatch(setLoading(false));
      }
    } catch (error) {
      console.log("List Portfolios Error", error);
      dispatch(setLoading(false));
    }
  };

  const addBankAccount = async (metadata) => {
    try {
      const { public_token, account } = metadata;
      setShow(false);
      dispatch(setLoading(true));
      const formData = JSON.parse(localStorage.getItem("addBankAccountData") || "{}");
      const reducerRoot = store.getState(); // do not remove
      const selectedPortfolio = [...reducerRoot.allPortfolio, ...reducerRoot.sharedPortfolio]
        .map((d) => ({
          ...d,
          permission: d.user_id == loggedUserData.id ? null : d.permission,
        }))
        .find((item) => item.id === Number(formData?.portfolio_id));

      const res = await API.graphql(
        graphqlOperation(getPlaidAccessToken, {
          publicToken: public_token,
        })
      );
      const AccessToken = res.data.getPlaidAccessToken.response;

      if (account?.verification_status === "pending_manual_verification") {
        await saveUnverifiedAccount({
          account,
          accessToken: AccessToken,
          selectedPortfolio,
        });
      } else {
        const getAccessToken = await API.graphql(
          graphqlOperation(getPlaidAccounts, {
            accessToken: AccessToken,
          })
        );
        let resData = JSON.parse(getAccessToken.data.getPlaidAccounts.response);
        const accessTokenData = {
          accessToken: AccessToken,
          instituteId: resData.item.institution_id,
        };
        const selectedBankAccount = resData.accounts[0];
        const findRoutingNumber = resData.numbers.ach[0];
        let customerUrl = `${envFile.DwOLLA_API_URL}/customers/`;
        if (formData?.businessType === "Property Management") {
          customerUrl += dwollaCustomerId;
        } else {
          customerUrl += selectedPortfolio.dwolla_customer_id;
        }
        const getFundingId = await API.graphql(
          graphqlOperation(getDwollaProcessorToken, {
            accessToken: accessTokenData.accessToken,
            accountId: selectedBankAccount.account_id,
            bankName: selectedBankAccount.name,
            customerUrl,
          })
        );
        if (getFundingId.data.getDwollaProcessorToken.status !== 201) {
          dispatch(setLoading(false));
          const parsedRes = JSON.parse(getFundingId.data.getDwollaProcessorToken.response);
          if (parsedRes?.body?.message) {
            alert(parsedRes?.body?.message?.split(":")[0]);
          } else {
            alert("Something went wrong");
          }
          return;
        }
        let fundingId = getFundingId.data.getDwollaProcessorToken.response;
        const getBankDetails = await API.graphql(
          graphqlOperation(getPlaidInstitution, {
            institutionId: accessTokenData.instituteId,
          })
        );
        const bankDetails = JSON.parse(getBankDetails.data.getPlaidInstitution.response);

        let tokenObj = {
          id: getId(),
          user_id: loggedUserData.id,
          plaid_access_token: accessTokenData.accessToken,
          account_id: selectedBankAccount.account_id,
          card_name: selectedBankAccount.name,
          card_type: selectedBankAccount.type,
          institution_id: accessTokenData.instituteId,
          business_account: formData?.businessType === "Property Management" ? 1 : 0,
          masked_card_number: selectedBankAccount.mask,
          dwolla_funding_id: fundingId,
          active: 1,
          status: "verified",
          official_bank_name: selectedBankAccount.official_name,
          routing_number: findRoutingNumber?.routing,
          bank_name: bankDetails.institution.name,
          created_by: loggedUserData.id,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        // const ownerBankObj = {
        //   id: getId(),
        //   owner_id: ownerData?.id,
        //   portfolio_id: formData?.portfolio_id,
        //   plaid_access_token: accessTokenData.accessToken,
        //   institution_id: accessTokenData.instituteId,
        //   account_id: selectedBankAccount.account_id,
        //   masked_account_number: selectedBankAccount.mask,
        //   dwolla_funding_id: fundingId,
        //   status: "verified",
        //   official_bank_name: selectedBankAccount.official_name,
        //   routing_number: findRoutingNumber?.routing,
        //   bank_name: bankDetails.institution.name,
        //   created_by: loggedUserData.id,
        //   updated_by: loggedUserData.id,
        //   active: 1,
        //   last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        //   created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        // };

        // if (loggedUserData.user_role === ROLES.PropertyOwner && ownerData?.invited === 1) {
        //   console.log("OwnerBankAccount");
        //   await createRecordTB("OwnerBankAccount", ownerBankObj);
        // } else {
        //   console.log("saveBankAccount");
        await saveBankAccount(tokenObj, selectedPortfolio);
        // }
      }

      navigate("/BankAccounts");
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error while add bank", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong while adding bank account");
    }
  };

  const saveUnverifiedAccount = async ({ account, accessToken, selectedPortfolio }) => {
    try {
      const formData = JSON.parse(localStorage.getItem("addBankAccountData") || "{}");
      let payload = {
        id: getId(),
        user_id: loggedUserData.id,
        plaid_access_token: accessToken,
        account_id: account?.id,
        card_name: account?.name,
        card_type: account?.type,
        institution_id: "",
        business_account: formData?.businessType === "Property Management" ? 1 : 0,
        masked_card_number: account?.mask,
        dwolla_funding_id: "",
        active: 1,
        official_bank_name: "",
        routing_number: "",
        bank_name: "",
        created_by: loggedUserData.id,
        status: account?.verification_status,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };
      await saveBankAccount(payload, selectedPortfolio);
      return true;
    } catch (err) {
      console.log("plaid unverified accounts error", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const saveBankAccount = async (payload, selectedPortfolio) => {
    try {
      const formData = JSON.parse(localStorage.getItem("addBankAccountData") || "{}");
      const res = await createRecordTB("TrustAccount", payload);

      if (formData?.businessType === "Owner") {
        const portfolioTrustAccountData = {
          id: getId(),
          portfolio_id: selectedPortfolio.id,
          portfolio_name: selectedPortfolio.name,
          trust_account_id: res?.id,
          masked_card_number: payload?.masked_card_number,
          institution_id: payload?.institution_id,
          created_by: loggedUserData?.id,
          active: 1,
          collect_rent: formData?.collectType?.includes("rent") ? 1 : 0,
          collect_deposit: formData?.collectType?.includes("deposits") ? 1 : 0,
          owner_drawer_account: loggedUserData?.user_role === "Property Owner" ? 1 : 0,
          dwolla_funding_resource: payload?.dwolla_funding_id,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        const portfolioRes = await createRecordTB("PortfolioTrustAccount", portfolioTrustAccountData);
      }
      return true;
    } catch (err) {
      console.log("error while saving bank accounts", err);
    }
  };

  const onSubmit = (data) => {
    if (data.selectedPersonalAccount) {
      savePersonalAccountData(data);
    } else {
      localStorage.setItem("addBankAccountData", JSON.stringify(data));
      if (data?.businessType === "Property Management") {
        if (dwollaCustomerId) {
          setShow(true);
        } else {
          navigate("/BankAccountsAddBusiness", { state: { selectedPortfolio, stateFormData: data } });
        }
      } else {
        const selectedPortfolio = allPortfolio.find((item) => item.id === Number(data.portfolio_id));
        if (selectedPortfolio.dwolla_customer_id) {
          setShow(true);
        } else {
          navigate("/BankAccountsAddBusiness", { state: { selectedPortfolio, stateFormData: data } });
        }
      }
    }
  };

  const savePersonalAccountData = async (formData) => {
    try {
      dispatch(setLoading(true));
      const selectedPersonalAccount = personalAccounts.find((dd) => dd.id === Number(formData.selectedPersonalAccount));
      const selectedPortfolio = allPortfolio.find((item) => item.id === Number(formData?.portfolio_id));
      const tokenObj = {
        id: getId(),
        user_id: loggedUserData.id,
        plaid_access_token: selectedPersonalAccount.plaid_access_token,
        account_id: selectedPersonalAccount.account_id,
        card_name: selectedPersonalAccount.card_name,
        card_type: selectedPersonalAccount.card_type,
        institution_id: selectedPersonalAccount.institution_id,
        business_account: 0,
        masked_card_number: selectedPersonalAccount.masked_card_number,
        dwolla_funding_id: selectedPersonalAccount.dwolla_funding_id,
        active: 1,
        status: selectedPersonalAccount?.status,
        official_bank_name: selectedPersonalAccount.official_bank_name,
        routing_number: selectedPersonalAccount?.routing_number,
        bank_name: selectedPersonalAccount.bank_name,
        created_by: loggedUserData.id,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };

      const res = await createRecordTB("TrustAccount", tokenObj);

      const portfolioTrustAccountData = {
        id: getId(),
        portfolio_id: selectedPortfolio.id,
        portfolio_name: selectedPortfolio.name,
        trust_account_id: res.id,
        masked_card_number: selectedPersonalAccount.masked_card_number,
        institution_id: selectedPersonalAccount.institution_id,
        created_by: loggedUserData.id,
        active: 1,
        collect_rent: formData?.collectType.includes("rent") ? 1 : 0,
        collect_deposit: formData?.collectType.includes("deposits") ? 1 : 0,
        owner_drawer_account: loggedUserData?.user_role === "Property Owner" ? 1 : 0,
        dwolla_funding_resource: selectedPersonalAccount.dwolla_funding_resource,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };
      await createRecordTB("PortfolioTrustAccount", portfolioTrustAccountData);

      navigate("/BankAccounts");
      dispatch(setLoading(false));
    } catch (err) {
      console.log("plaid accounts error", err);
      dispatch(setLoading(false));
      toast.error("Something went wrong while personal bank account");
    }
  };

  const getBusinessAccountId = async () => {
    dispatch(setLoading(true));
    await getRdsFN("tbSelect", {
      source: "bsacc",
      usrId: loggedUserData.id,
      act: 1,
    })
      .then((businessAc) => {
        dispatch(setLoading(false));
        if (businessAc[0]?.dwolla_customer_id) {
          setDwollaCustomerId(businessAc[0].dwolla_customer_id);
        }
      })
      .catch((err) => {
        console.log("List Portfolios Error", err);
        dispatch(setLoading(false));
      });
  };

  return (
    <Container title="Add Bank Account" isBack>
      {loggedUserData?.user_role === ROLES.PropertyOwner && ownerData?.invited === 1 ? (
        <InviteOwnerAccountAdd ownerData={ownerData} />
      ) : (
        <FormProvider {...methods}>
          <Form onSubmit={methods.handleSubmit(onSubmit)}>
            <Row>
              <Col xs lg="12">
                {loggedUserData.user_role !== ROLES.Landlord && (
                  <>
                    <h4 className="mb-4">What will you be using this account for?</h4>
                    <Form.Group className={`mb-4 ${methods.formState.errors.businessType ? "is-invalid" : ""} `}>
                      <div className="d-flex">
                        <Form.Check
                          type="radio"
                          label={"Owner Portfolio Account"}
                          className="mb-1"
                          value={"Owner"}
                          {...methods.register("businessType")}
                        />
                        <img
                          src={require("../../Assets/images/icon-help.svg").default}
                          className="pointer ms-2"
                          onClick={() => setModel({ model1: true, model2: model.model2 })}
                        />
                      </div>
                      {/* <div>
                        <Form.Check
                          type="radio"
                          label={"Shared Owner Portfolio"}
                          className="mb-1"
                          value={"SharedOwnerPortfolio"}
                          {...methods.register("businessType")}
                        />
                      </div> */}
                      {loggedUserData?.user_role === ROLES.PropertyManager && (
                        // || (loggedUserData?.user_role === ROLES.Collaborator && collabData?.permission === "Manage")) && (
                        <div className="d-flex">
                          <Form.Check
                            type="radio"
                            label="Property Management Business Account"
                            value={"Property Management"}
                            {...methods.register("businessType")}
                          />
                          <img
                            src={require("../../Assets/images/icon-help.svg").default}
                            className="pointer ms-2"
                            onClick={() => setModel({ model1: model.model1, model2: true })}
                          />
                        </div>
                      )}
                      <Form.Text className="text-danger ml-2">
                        {methods.formState.errors?.businessType?.message}
                      </Form.Text>
                    </Form.Group>
                    {/* )} */}
                  </>
                )}

                <Row>
                  <Col xs lg="5">
                    {businessType !== "Property Management" && (
                      <FormInput
                        name="portfolio_id"
                        label="Portfolio"
                        type="select"
                        options={sortingPortfolios?.map((item) => ({
                          label: item.portfolio_name,
                          icon: item?.is_collaborator === 1 && require("../../Assets/images/sharedIcon.svg").default,
                          value: item.id,
                        }))}
                        className={`${loggedUserData?.user_role !== ROLES.Landlord ? "border-top" : ""} pt-3`}
                        placeholder="Select Portfolio"
                        allPortfolios={allPortfolio}
                      />
                    )}
                  </Col>
                  <Col xs lg="5" className="mt-3">
                    {businessType === "Owner" &&
                      portfolio_id &&
                      isExitPersonalPortfolio &&
                      personalAccounts.length > 0 && (
                        <>
                          <FormInput
                            type="select"
                            name="selectedPersonalAccount"
                            label="Connect With An Existing Bank Account:"
                            options={personalAccounts.map((item) => ({
                              label: (
                                <div className="d-flex align-items-center">
                                  <img src={item?.bankLogo} alt="" className="img pe-2" style={{ height: "30px" }} />
                                  <h4 className="mb-0">{item?.card_name}</h4>
                                  <span className="ms-2">• • • • {item?.masked_card_number}</span>
                                </div>
                              ),
                              value: item?.id,
                            }))}
                            placeholder="Select From Available Bank Accounts"
                          />
                        </>
                      )}
                  </Col>
                </Row>

                <h4 className="mt-4 mb-3">Use for:</h4>
                <Form.Group className={`mb-3 ${methods.formState.errors.collectType ? "is-invalid" : ""}`}>
                  {businessType === "Property Management" ? (
                    <Form.Check
                      type="checkbox"
                      label="Property Management Business Account"
                      className="mb-1"
                      value={"business"}
                      {...methods.register(`collectType[0]`)}
                      checked={businessType === "Property Management" ? true : false}
                    // onChange={(e) => methods.setValue("collectType", [e.target.value])}
                    />
                  ) : (
                    <>
                      <Form.Check
                        type="checkbox"
                        label="Collect rent"
                        className="mb-1"
                        value={"rent"}
                        {...methods.register("collectType")}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Collect deposits"
                        value={"deposits"}
                        {...methods.register("collectType")}
                      />
                    </>
                  )}
                  <Form.Text className="text-danger ml-2">{methods.formState.errors?.collectType?.message}</Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <BankAccountResetNextBtn dwollaCustomerId={dwollaCustomerId} resetMethod={methods} />
          </Form>
        </FormProvider>
      )}

      <Modal
        className="modal-v1 border-radius-16"
        show={model.model2}
        onHide={() => setModel({ model1: model.model1, model2: false })}
      >
        <Modal.Header closeButton>
          <h5>Property Management Business Account</h5>
        </Modal.Header>
        <Modal.Body>
          <p>
            {`Property Management Business (PMB) Accounts are,\n\n- Configured at the property management business level
            (not portfolio or property level) \n\n- Management fees come to this account based on the % agreed by the
            Property Manager & Investors at the property level. \n\n- Generally only 1 property management account
            exists per PM subscription`}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModel({ model1: model.model1, model2: false })}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        className="modal-v1 border-radius-16"
        show={model.model1}
        onHide={() => setModel({ model1: false, model2: model.model2 })}
      >
        <Modal.Header closeButton>
          <h5>Owner Portfolio Account</h5>
        </Modal.Header>
        <Modal.Body>
          <p>
            Owner Portfolio Accounts are bank accounts which are associated with a rental portfolio and used in sending
            or receiving money over established bank payment flows between an Investor and Property Manager for
            portfolio operations.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModel({ model1: false, model2: model.model2 })}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={show} onHide={() => setShow(false)} centered className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Add Bank Account
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img src={require("../../Assets/images/add-bank-account.svg").default} alt="" className="img-fluid" />
          <div className="text-center pt-3">Foliolens uses plaid to link your bank</div>
          <ListGroup variant="flush" className="checklist mt-4">
            <ListGroup.Item>
              <strong>Secure</strong>
              Encryption helps protect your personal financial data.
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Private</strong>
              Your credentials will never be made accessible to Foliolens.
            </ListGroup.Item>
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <div className="container m-0 p-0">
            <Row>
              <Col xs={6}>
                <Button className="btn-reset w-100" onClick={() => setShow(false)}>
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="w-100" onClick={() => open()}>
                  Continue
                </Button>
              </Col>
            </Row>
            <div className="text-center pt-3">
              By selecting “Continue” you agree to the Plaid End User
              <a href="https://plaid.com/legal/#end-user-privacy-policy" target="blank">
                Privacy Policy
              </a>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
