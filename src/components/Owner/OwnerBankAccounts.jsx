import React, { useEffect, useState } from "react";
import AppButton from "../Button/Button";
import PortfolioDropDown from "../Portfolios/PortfolioDropDown";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Col, Container, Dropdown, ListGroup, Modal, Row, Form } from "react-bootstrap";
import { usePlaidLink } from "react-plaid-link";
import { setLoading } from "../../store/reducer";
import { API, graphqlOperation } from "aws-amplify";
import {
  createDwollaUnverifiedCustomer,
  createOwnerDwollaAccount,
  createPlaidLink,
  deleteDwollaFundingSource,
} from "../../graphql/mutations";
import envFile from "../../envFile";
import Select from "react-select";
import { getId, getPublicIpv4 } from "../../Utility";
import { createRecordTB, getBankAccountPhotos, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import moment from "moment";
import {
  getDwollaBalance,
  getDwollaProcessorToken,
  getPlaidAccessToken,
  getPlaidAccounts,
  getPlaidBalance,
  getPlaidInstitution,
} from "../../graphql/queries";
import { toast, ToastBar } from "react-hot-toast";
import ModelContainer from "react-bootstrap/Container";

const OwnerBankAccounts = ({ editOwnersData, setActiveTab }) => {
  const dispatch = useDispatch();
  const [editBankAccount, setEditBankAccount] = useState(null);
  const [deleteBankAccount, setDeleteBankAccount] = useState(null);
  const [verifyBankAccount, setVerifyBankAccount] = useState(null);
  const [portfolioModal, setPortfolioModal] = useState(false);
  const [plaidToken, setplaidToken] = useState("");
  const [verifyPlaidToken, setVerifyPlaidToken] = useState();
  const [portfolio, setPortfolio] = useState();
  const [ownerBankAccounts, setOwnerBankAccounts] = useState([]);
  const [dwollaCustomerId, setDwollaCustomerId] = useState("");
  const [totalBalance, setTotalBalance] = useState();
  const [customerId, setCustomerId] = useState();

  const [selectedPortfolioId, setSelectedPortfolioId] = useState("All");
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const [selectedPorfolioProperty, setSelectedPortfolioProperty] = useState([]);

  const selectedOwnerBankData = ownerBankAccounts?.filter((item) =>
    selectedPortfolioId === "All" ? true : item.portfolio_id === selectedPortfolioId
  );

  const { open } = usePlaidLink({
    token: plaidToken,
    onSuccess: (public_token, metaData) => {
      addBankAccount(metaData);
    },
  });

  const { open: ownerVerifyPlaid, ready } = usePlaidLink({
    token: verifyPlaidToken,
    onSuccess: (public_token, metaData) => {
      handleOwnerVerifyBankAccount(metaData);
    },
  });

  useEffect(() => {
    if (verifyBankAccount) {
      getPlaidToken();
    }
  }, [verifyBankAccount]);

  const getPlaidToken = () => {
    dispatch(setLoading(true));

    API.graphql(
      graphqlOperation(createPlaidLink, {
        userId: loggedUserData.id,
        userName: envFile.PLAID_USERNAME,
        accessToken: verifyBankAccount?.plaid_access_token,
      })
    )
      .then((res) => {
        setVerifyPlaidToken(res.data.createPlaidLink.response);
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log(err);
        dispatch(setLoading(false));
      });
  };

  useEffect(() => {
    getOwnerBankAccount();
    // getBusinessAccountId();
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
  }, []);

  const getOwnerBankAccount = async () => {
    const res = await getRdsFN("poBankAccounts", {
      owner_id: editOwnersData?.id,
    });
    const bankAccounts = await getBankAccountPhotos(res);
    setOwnerBankAccounts(bankAccounts);
  };

  useEffect(() => {
    if (ownerBankAccounts?.length) {
      const dwollaIds = [];
      const bankTokens = ownerBankAccounts?.map((account) => {
        if (account?.dwolla_customer_id) {
          dwollaIds.push(account.dwolla_customer_id);
        }
        return {
          accessToken: account?.plaid_access_token,
          accountId: account?.account_id,
        };
      });
      API.graphql(
        graphqlOperation(getPlaidBalance, {
          accounts: JSON.stringify(bankTokens),
        })
      )
        .then((res) => {
          const data = JSON.parse(res.data.getPlaidBalance.response);
          let balance = {};
          data.map((bal) => {
            if (bal.status === 200) {
              balance[bal?.accountId] = bal.currentBalance;
            }
          });
          setTotalBalance({ ...totalBalance, ...balance });
        })
        .catch((err) => {
          console.log("Balance Err", err);
        });
      if (dwollaIds.length) {
        API.graphql(
          graphqlOperation(getDwollaBalance, {
            source: dwollaIds,
          })
        )
          .then((res) => {
            let data = res.data.getDwollaBalance;
            let balance = { total: "0.00" };
            if (data.status === 200) {
              balance = {
                total: Object.values(JSON.parse(data.response))
                  .reduce((total, num) => parseFloat(num) + parseFloat(total), 0)
                  .toFixed(2),
              };
            }
            setTotalBalance({ ...totalBalance, ...balance });
          })
          .catch((err) => {
            setTotalBalance({ ...totalBalance });
            console.log("Total Balance Err", err);
          })
          .finally(() => {});
      }
    }
  }, [ownerBankAccounts]);

  // useEffect(() => {
  //   if (selectedPortfolioId) {
  //     const properties = allProperties.filter((item) =>
  //       selectedPortfolioId === "All" ? true : item.portfolio_id === selectedPortfolioId
  //     );

  //     setSelectedPortfolioProperty(properties);
  //   }
  // }, [selectedPortfolioId, allProperties]);

  const addBankAccount = async (metadata) => {
    try {
      dispatch(setLoading(true));
      const { public_token, account } = metadata;
      const formData = JSON.parse(localStorage.getItem("addBankAccountData") || "{}");

      const res = await API.graphql(
        graphqlOperation(getPlaidAccessToken, {
          publicToken: public_token,
        })
      );
      const AccessToken = res.data.getPlaidAccessToken.response;

      if (account?.verification_status === "pending_manual_verification") {
        const bankDetailObj = {
          id: getId(),
          owner_id: editOwnersData?.id,
          portfolio_id: formData?.portfolio_id,
          plaid_access_token: AccessToken,
          account_id: account?.id,
          masked_account_number: account?.mask,
          status: account?.verification_status,
          institution_id: "",
          routing_number: "",
          bank_name: "",
          official_bank_name: "",
          dwolla_funding_id: "",
          created_by: loggedUserData.id,
          updated_by: loggedUserData.id,
          active: 1,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        await createRecordTB("OwnerBankAccount", bankDetailObj);
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

        let customerUrl = `${envFile.DwOLLA_API_URL}/customers/${customerId}`;

        const getFundingId = await API.graphql(
          graphqlOperation(getDwollaProcessorToken, {
            accessToken: accessTokenData.accessToken,
            accountId: selectedBankAccount.account_id,
            bankName: selectedBankAccount.name,
            customerUrl,
          })
        );
        let fundingId = getFundingId.data.getDwollaProcessorToken.response;

        const getBankDetails = await API.graphql(
          graphqlOperation(getPlaidInstitution, {
            institutionId: accessTokenData.instituteId,
          })
        );
        const bankDetails = JSON.parse(getBankDetails.data.getPlaidInstitution.response);

        const bankDetailObj = {
          id: getId(),
          owner_id: editOwnersData?.id,
          portfolio_id: formData?.portfolio_id,
          plaid_access_token: accessTokenData.accessToken,
          institution_id: accessTokenData.instituteId,
          account_id: selectedBankAccount.account_id,
          masked_account_number: selectedBankAccount.mask,
          dwolla_funding_id: fundingId,
          status: "verified",
          official_bank_name: selectedBankAccount.official_name,
          routing_number: findRoutingNumber?.routing,
          bank_name: bankDetails.institution.name,
          created_by: loggedUserData.id,
          updated_by: loggedUserData.id,
          active: 1,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        await createRecordTB("OwnerBankAccount", bankDetailObj);
      }
      setPortfolio("");
      getOwnerBankAccount();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error while add bank", error);
      dispatch(setLoading(false));
      ToastBar.error("Something went wrong while adding bank account");
    }
  };

  const onSubmit = async () => {
    try {
      dispatch(setLoading(true));
      const getCustomerId = await API.graphql(
        graphqlOperation(createOwnerDwollaAccount, {
          data: JSON.stringify({
            ownerId: editOwnersData.id,
            portfolioId: portfolio?.value,
            created_by: loggedUserData.id,
            ipAddress: await getPublicIpv4(),
          }),
        })
      );

      if (getCustomerId.data.createOwnerDwollaAccount.status === 500) {
        dispatch(setLoading(false));
        toast.error(getCustomerId.data.createOwnerDwollaAccount.response);
        return;
      }
      setCustomerId(getCustomerId.data.createOwnerDwollaAccount.response);
      open();
      setPortfolioModal(false);
      localStorage.setItem(
        "addBankAccountData",
        JSON.stringify({ portfolio_name: portfolio.label, portfolio_id: portfolio.value })
      );
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const handleClose = () => {
    setDeleteBankAccount(null);
    setEditBankAccount(null);
    setVerifyBankAccount(null);
    // setPlaidToken("");
  };

  const handleDeleteBankAccount = async (bankAccount) => {
    try {
      dispatch(setLoading(true));
      await updateRecordTB("OwnerBankAccount", {
        id: bankAccount.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      });
      await API.graphql(
        graphqlOperation(deleteDwollaFundingSource, {
          sourceId: bankAccount?.dwolla_funding_id,
        })
      );
      getOwnerBankAccount();
      handleClose();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const handleOwnerVerifyBankAccount = async (metadata) => {
    try {
      dispatch(setLoading(true));
      const { account } = metadata;
      if (account?.verification_status === "pending_manual_verification") {
        return;
      }
      const getCustomerId = await API.graphql(
        graphqlOperation(createOwnerDwollaAccount, {
          data: JSON.stringify({
            ownerId: editOwnersData?.id,
            portfolioId: Number(verifyBankAccount?.portfolio_id),
            created_by: loggedUserData.id,
            ipAddress: await getPublicIpv4(),
          }),
        })
      );
      const customerId = getCustomerId.data.createOwnerDwollaAccount.response;
      const AccessToken = verifyBankAccount?.plaid_access_token;
      const getAccessToken = await API.graphql(
        graphqlOperation(getPlaidAccounts, {
          accessToken: AccessToken,
        })
      );
      let resData = JSON.parse(getAccessToken?.data?.getPlaidAccounts?.response);
      const accessTokenData = {
        accessToken: AccessToken,
        instituteId: resData?.item?.institution_id,
      };
      const selectedBankAccount = resData.accounts[0];
      const findRoutingNumber = resData.numbers.ach[0];
      // const selectedPortfolio = allPortfolio.find((item) => item.id === Number(verifyBankAccount?.portfolio_id));
      let customerUrl = `${envFile.DwOLLA_API_URL}/customers/${customerId}`;
      const getFundingId = await API.graphql(
        graphqlOperation(getDwollaProcessorToken, {
          accessToken: accessTokenData.accessToken,
          accountId: selectedBankAccount.account_id,
          bankName: selectedBankAccount.name,
          customerUrl,
        })
      );
      if (getFundingId?.data?.getDwollaProcessorToken?.status !== 201) {
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
      let bankDetails = {};
      if (accessTokenData?.instituteId) {
        const getBankDetails = await API.graphql(
          graphqlOperation(getPlaidInstitution, {
            institutionId: accessTokenData?.instituteId,
          })
        );
        bankDetails = JSON.parse(getBankDetails?.data?.getPlaidInstitution?.response);
      }
      await updateRecordTB("OwnerBankAccount", {
        id: verifyBankAccount?.id,
        account_id: selectedBankAccount?.account_id,
        institution_id: accessTokenData?.instituteId,
        masked_account_number: selectedBankAccount?.mask,
        dwolla_funding_id: fundingId,
        official_bank_name: selectedBankAccount?.official_name,
        routing_number: findRoutingNumber?.routing,
        status: account?.verification_status,
        bank_name: bankDetails?.institution?.name,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
        // dwolla_funding_resource: payload?.dwolla_funding_id,   need to confirm with maulik
      });
      getOwnerBankAccount();
      handleClose();
      dispatch(setLoading(false));
    } catch (error) {
      handleClose();
      console.log("Error while add bank", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong while adding bank account");
    }
  };

  return (
    <>
      <div className=" d-flex justify-content-between align-items-center flex-column flex-lg-row">
        <PortfolioDropDown selectedPortfolioId={selectedPortfolioId} setSelectedPortfolioId={setSelectedPortfolioId} />
        <AppButton
          type="button"
          classes="no-img ms-0 ms-lg-3"
          title="+ Add Bank Account"
          onClick={() => setPortfolioModal(true)}
          // onClick={() => navigate("/BankAccountsAdd")}
        />
      </div>

      {selectedOwnerBankData?.length > 0 ? (
        <div className="bank-account-list grid">
          {/* {activeBusinessAccounts.length > 0 ? ( */}
          {/* activeBusinessAccounts.map((item) => ( */}
          {selectedOwnerBankData?.map((item) => {
            const status = item?.status !== "pending_manual_verification" ? "Verified" : "Unverified";
            return (
              <Card className="bank-account-card border-0">
                <Card.Body className="p-0">
                  <Card.Title className="mb-1 d-flex align-items-start justify-content-between">
                    <div className="mb-0 d-flex align-items-center justify-content-between">
                      <img
                        src=""
                        alt="uj"
                        className="img"
                        style={{ fill: "black" }}
                        onError={({ currentTarget }) => {
                          currentTarget.onerror = null; // prevents looping
                          currentTarget.src = require("../../Assets/images/icon-bank-black.svg").default;
                        }}
                      />
                      <div className="mb-0">
                        <h4 className="mb-0">AS Checking</h4>
                        <div className="mb-0 d-flex align-items-center">
                          <h6 className={`mb-0 ${status === "Verified" ? "text-success" : "text-danger"}`}>{status}</h6>
                          <img
                            src={
                              status === "Verified"
                                ? require("../../Assets/images/icon-check-green.svg").default
                                : require("../../Assets/images/icon-cross-red.svg").default
                            }
                            style={{ marginLeft: "5px" }}
                            alt=""
                          />
                        </div>
                      </div>
                    </div>
                    <Dropdown className="no-caret">
                      <Dropdown.Toggle className="p-0 no-clr">
                        <img src={require("../../Assets/images/icon-toggle-btn.svg").default} alt="" />
                      </Dropdown.Toggle>

                      <Dropdown.Menu align="end">
                        {status !== "Verified" && (
                          <Dropdown.Item
                            href="#"
                            className="success"
                            onClick={() => {
                              setVerifyBankAccount(item);
                            }}
                          >
                            <img src={require("../../Assets/images/icon-check-green.svg").default} alt="" />
                            Verify
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item href="#" onClick={() => setDeleteBankAccount(item)} className="delete">
                          <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Card.Title>

                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <span className="title">Portfolio Name</span>
                      {allPortfolio.find((p) => p.id === Number(item?.portfolio_id))?.portfolio_name}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <span className="title">Bank Name</span>
                      <span>{item?.bank_name}</span>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <span className="title">Routing Number</span> • • • • <span>{item?.routing_number}</span>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <span className="title">Account Number</span> • • • • <span>{item?.masked_account_number}</span>
                    </ListGroup.Item>
                    {/* <ListGroup.Item>
                    <span className="title">Balance</span>{" "}
                    {totalBalance[item?.account_id] ? `$${totalBalance[item?.account_id]?.toFixed()}` : "$0.00"}
                  </ListGroup.Item> */}
                  </ListGroup>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="empty text-center py-5">
          <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}

      <Modal
        show={portfolioModal}
        onHide={() => {
          setPortfolioModal(false);
          setPortfolio("");
        }}
        centered
        className="modal-v1 border-radius-16"
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Select Portfolio
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          <Row className="text-start">
            <Form.Group className="mb-3">
              <Form.Label>Portfolio</Form.Label>
              <Select
                options={editOwnersData?.portfolios.map((i) => ({ label: i.portfolio_name, value: i.id }))}
                placeholder="Select Portfolio"
                onChange={(data) => {
                  setPortfolio(data);
                }}
                value={portfolio || ""}
                // components={{ DropdownIndicator }}
                isClearable
                isSearchable
                closeMenuOnSelect={true}
                classNamePrefix="form-select"
              />
            </Form.Group>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Container className="m-0">
            <Row>
              <Col xs={6}>
                <Button
                  className="btn-reset w-100"
                  onClick={() => {
                    setPortfolioModal(false);
                    setPortfolio("");
                  }}
                >
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="w-100" onClick={onSubmit}>
                  Next
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
      <Modal show={!!deleteBankAccount} onHide={handleClose} className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Are you sure?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          Are you sure you want to delete the use of this bank account? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <ModelContainer className="m-0 p-0">
            <Row>
              <Col xs={6}>
                <Button className="btn-reset w-100" onClick={handleClose}>
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="btn-delete w-100" onClick={() => handleDeleteBankAccount(deleteBankAccount)}>
                  Delete
                </Button>
              </Col>
            </Row>
          </ModelContainer>
        </Modal.Footer>
      </Modal>
      <Modal show={!!verifyBankAccount} onHide={handleClose} className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Verify Bank Account
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          <Card className="bank-account-card border-0">
            <div className="mb-0 d-flex align-items-center">
              <h4>{verifyBankAccount?.card_name}</h4>
            </div>
            <div className="mb-0 d-flex">
              • • • • {verifyBankAccount?.masked_account_number}
              <span className="title" style={{ marginLeft: "5px" }}>
                (Unverified)
              </span>
            </div>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <ModelContainer className="m-0 p-0">
            <Row>
              <Col xs={6}>
                <Button className="btn-reset w-100" onClick={handleClose}>
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  className="btn-submit w-100"
                  onClick={() => {
                    // open();
                    ownerVerifyPlaid();
                  }}
                  disabled={!plaidToken}
                >
                  {!!plaidToken ? "Verify" : "Loading"}
                </Button>
              </Col>
            </Row>
          </ModelContainer>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OwnerBankAccounts;
