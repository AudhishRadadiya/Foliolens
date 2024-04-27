import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "../../components/Layout/Container";
import { Card, Form } from "react-bootstrap";
import AppButton from "../../components/Button/Button";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import ListGroup from "react-bootstrap/ListGroup";
import BankAccountCard from "../../components/BankAccount/BankAccountCard";
import { useDispatch, useSelector } from "react-redux";
import PortfolioDropDown from "../../components/Portfolios/PortfolioDropDown";
import { fetchBankAccounts, getBankAccountPhotos, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import {
  getPlaidBalance,
  getDwollaBalance,
  getPlaidAccounts,
  getDwollaProcessorToken,
  getPlaidInstitution,
} from "../../graphql/queries";
import { API, graphqlOperation } from "aws-amplify";
import { setLoading } from "../../store/reducer";
import ModelContainer from "react-bootstrap/Container";
import moment from "moment";
import { createOwnerDwollaAccount, createPlaidLink, deleteDwollaFundingSource } from "../../graphql/mutations";
import envFile from "../../envFile";
import { usePlaidLink } from "react-plaid-link";
import toast from "react-hot-toast";
import { ROLES, getPublicIpv4 } from "../../Utility";

const reportTypes = [
  {
    label: "Collect rent + Payment to owners",
    value: "Collect rent + Payment to owners",
  },
  {
    label: "Collect deposits",
    value: "Collect deposits",
  },
];

const BankAccounts = () => {
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const navigate = useNavigate();
  const [deleteBankAccount, setDeleteBankAccount] = useState(null);
  const [editBankAccount, setEditBankAccount] = useState(null);
  const [verifyBankAccount, setVerifyBankAccount] = useState(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [totalBalance, setTotalBalance] = useState({});
  const [activeBusinessAccounts, setActiveBusinessAccounts] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("All");
  const [selectedType, setSelectedType] = useState(reportTypes[0].value);
  const [dwollaCustomerId, setDwollaCustomerId] = useState("");
  const [plaidToken, setPlaidToken] = useState("");
  const [ownerData, setOwnerData] = useState();

  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];
  const allBankAccounts = useSelector(({ allBankAccounts }) => allBankAccounts);
  const canAddBankAccount = useSelector(({ canAddBankAccount }) => canAddBankAccount);

  useEffect(() => {
    getBusinessAccountId();
    getOwnerData();
    dispatch(fetchBankAccounts());
  }, []);

  useEffect(() => {
    if (loggedUserData.user_role === ROLES.PropertyOwner && ownerData?.invited === 1) {
      getOwnerBankAccount();
    }
  }, [ownerData]);

  const getOwnerData = async () => {
    try {
      const res = await getRdsFN("tbSelect", {
        source: "pOwn",
        email: loggedUserData.email,
      });
      const fetchInvitedOwner = res?.find((i) => i.invited === 1);
      setOwnerData(fetchInvitedOwner);
    } catch (error) {
      console.log("error", error);
    }
  };

  const getOwnerBankAccount = async () => {
    try {
      const invitedOwnerBankData = await getRdsFN("poBankAccounts", {
        owner_id: ownerData?.id,
      });

      const bankAccounts = await getBankAccountPhotos(invitedOwnerBankData);
      setActiveBusinessAccounts(bankAccounts);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    if (selectedPortfolioId && selectedType && allBankAccounts?.length) {
      const filtered = allBankAccounts
        .filter((account) => (selectedPortfolioId === "All" ? true : selectedPortfolioId === account?.portfolio_id))
        .filter((account) => {
          if (selectedType === "Collect rent + Payment to owners") {
            if (account.collect_rent || account.business_account || account.owner_drawer_account) {
              return true;
            } else {
              return false;
            }
          } else {
            if (account.collect_deposit) {
              return true;
            } else {
              return false;
            }
          }
        });

      // if (loggedUserData.user_role === ROLES.PropertyOwner) {
      //   getOwnerBankAccount().then((res) => setActiveBusinessAccounts([...filtered, ...res]))
      setActiveBusinessAccounts(filtered);
    }
  }, [selectedPortfolioId, selectedType, allBankAccounts]);

  useEffect(() => {
    if (allBankAccounts.length || activeBusinessAccounts?.length) {
      setIsBalanceLoading(true);
      const bankAccounts = loggedUserData.user_role === ROLES.PropertyOwner ? activeBusinessAccounts : allBankAccounts;
      const dwollaIds = [];
      const bankTokens = bankAccounts?.map((account) => {
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
            if (bal.status == 200) {
              balance[bal?.accountId] = bal.currentBalance;
            }
          });
          setTotalBalance({ ...totalBalance, ...balance });
          setIsBalanceLoading(false);
        })
        .catch((err) => {
          console.log("Balance Err", err);
          setIsBalanceLoading(false);
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
            if (data.status == 200) {
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
          .finally(() => {
            setIsBalanceLoading(false);
          });
      }
    }
  }, [allBankAccounts, activeBusinessAccounts]);

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
        setPlaidToken(res.data.createPlaidLink.response);
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log(err);
        dispatch(setLoading(false));
      });
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

  const handleClose = () => {
    setDeleteBankAccount(null);
    setEditBankAccount(null);
    setVerifyBankAccount(null);
    setPlaidToken("");
  };

  const handleDeleteBankAccount = async (bankAccount) => {
    try {
      dispatch(setLoading(true));
      const bankInfoObject = {
        active: 0,
        id: bankAccount?.id,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };

      if (bankAccount.business_account) {
        await updateRecordTB("TrustAccount", bankInfoObject);
      } else {
        await updateRecordTB("PortfolioTrustAccount", {
          id: bankAccount.bank_account_id,
          active: 0,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          updated_by: loggedUserData.id,
        });

        await updateRecordTB("TrustAccount", bankInfoObject);
      }

      const portfolio = allPortfolio.find((portfolio) => portfolio.id === bankAccount.portfolio_id);

      let removeAccountFromDwolla = false;
      if (portfolio && portfolio?.account_type === "personal") {
        const sameAccount = await getRdsFN("countSameBankAccount", { fundingId: bankAccount?.dwolla_funding_id });
        // Checking for 0 because Just deactivated account above
        if (sameAccount[0].record_count == 0) {
          removeAccountFromDwolla = true;
        }
      } else {
        removeAccountFromDwolla = true;
      }

      if (removeAccountFromDwolla) {
        await API.graphql(
          graphqlOperation(deleteDwollaFundingSource, {
            sourceId: bankAccount?.dwolla_funding_id,
          })
        );
      }

      await API.graphql(
        graphqlOperation(deleteDwollaFundingSource, {
          sourceId: bankAccount?.dwolla_funding_id,
        })
      );
      handleClose();
      dispatch(fetchBankAccounts());
      dispatch(setLoading(false));
    } catch (error) {
      console.log("handleRemove error ", error);
      setDeleteBankAccount(null);
      dispatch(setLoading(false));
    }
  };

  const inviteOwnerDeleteBankAccount = async (bankAccount) => {
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
      handleClose();
      getOwnerBankAccount();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  }

  const handleEditBankAccount = async (bankAccount) => {
    try {
      dispatch(setLoading(true));
      const updateData = {
        id: bankAccount.bank_account_id,
        collect_deposit: 1,
        collect_rent: 1,
        updated_by: loggedUserData.id,
      };
      if (selectedType === "Collect rent + Payment to owners") {
        updateData.collect_rent = 0;
      } else {
        updateData.collect_deposit = 0;
      }
      await updateRecordTB("PortfolioTrustAccount", updateData);

      handleClose();
      dispatch(fetchBankAccounts());
      dispatch(setLoading(false));
    } catch (error) {
      console.log("handleRemove error ", error);
      setDeleteBankAccount(null);
      dispatch(setLoading(false));
    }
  };

  const handleVerifyAccount = async (metadata) => {
    if (loggedUserData?.user_role === ROLES.PropertyOwner && ownerData?.invited === 1) {
      handleOwnerVerifyBankAccount(metadata)
    } else {
      handleVerifyBankAccount(metadata)
    }
  };

  const handleVerifyBankAccount = async (metadata) => {
    try {
      const { account } = metadata;
      dispatch(setLoading(true));

      const AccessToken = verifyBankAccount?.plaid_access_token;

      if (account?.verification_status === "pending_manual_verification") {
        return;
      }

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
      const selectedPortfolio = allPortfolio.find((item) => item.id === Number(verifyBankAccount?.portfolio_id));
      let customerUrl = `${envFile.DwOLLA_API_URL}/customers/`;
      if (verifyBankAccount?.business_account) {
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

      let tokenObj = {
        id: verifyBankAccount?.id,
        account_id: selectedBankAccount?.account_id,
        card_name: selectedBankAccount?.name,
        card_type: selectedBankAccount?.type,
        institution_id: accessTokenData?.instituteId,
        masked_card_number: selectedBankAccount?.mask,
        dwolla_funding_id: fundingId,
        official_bank_name: selectedBankAccount?.official_name,
        routing_number: findRoutingNumber?.routing,
        status: account?.verification_status,
        bank_name: bankDetails?.institution?.name,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await saveBankAccount(tokenObj);

      dispatch(fetchBankAccounts());
      handleClose();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error while add bank", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong while adding bank account");
    }
  }

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
            ownerId: ownerData.id,
            portfolioId: Number(verifyBankAccount?.portfolio_id),
            created_by: loggedUserData.id,
            ipAddress: await getPublicIpv4(),
          }),
        })
      );

      const customerId = getCustomerId.data.createOwnerDwollaAccount.response
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
      // const selectedPortfolio = allPortfolios.find((item) => item.id === Number(verifyBankAccount?.portfolio_id));
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
      console.log("Error while add bank", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong while adding bank account");
    }
  };

  const saveBankAccount = async (payload) => {
    try {
      const res = await updateRecordTB("TrustAccount", payload);
      if (!verifyBankAccount?.business_account) {
        const portfolioTrustAccountData = {
          id: verifyBankAccount?.bank_account_id,
          masked_card_number: payload?.masked_card_number,
          institution_id: payload?.institution_id,
          dwolla_funding_resource: payload?.dwolla_funding_id,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          updated_by: loggedUserData.id,
        };

        const portfolioRes = await updateRecordTB("PortfolioTrustAccount", portfolioTrustAccountData);
      }
      return true;
    } catch (err) {
      console.log("error while saving bank accounts", err);
    }
  };

  const { open, ready } = usePlaidLink({
    token: plaidToken,
    onSuccess: (public_token, metaData) => {
      handleVerifyAccount(metaData);
    },
  });

  return (
    <>
      <Container title="Manage Bank Accounts">
        <div className="mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
          <PortfolioDropDown
            selectedPortfolioId={selectedPortfolioId}
            setSelectedPortfolioId={setSelectedPortfolioId}
          />
          <div className="add-accounts-dropdown d-flex flex-column flex-lg-row">
            <div className="mb-4 mb-lg-0">
              <Form.Select
                className="banck-type-dropdown"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {reportTypes.map((item) => (
                  <option key={item.label} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Form.Select>
            </div>
            {canAddBankAccount && (
              <AppButton
                type="button"
                classes="no-img ms-0 ms-lg-3"
                title="Add Account"
                onClick={() => navigate("/BankAccountsAdd", { state: { ownerData } })}
              />
            )}
          </div>
        </div>

        <div className="bank-account-list grid">
          <Card className="bank-account-card border-0">
            <Card.Body className="p-0">
              <Card.Title className="mb-1 d-flex align-items-start justify-content-between">
                <div className="mb-0">
                  <img src={require("../../Assets/images/icon-wallet.svg").default} className="img" />
                  Foliolens Wallet
                </div>
              </Card.Title>

              <ListGroup variant="flush">
                <ListGroup.Item>
                  <span className="title">Balance </span>
                  {isBalanceLoading ? "Loading..." : "$" + `${totalBalance?.total ? totalBalance?.total : "0.00"}`}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
          {activeBusinessAccounts.length > 0 ? (
            activeBusinessAccounts.map((item) => (
              <BankAccountCard
                item={item}
                totalBalance={totalBalance}
                setDeleteBankAccount={setDeleteBankAccount}
                setEditBankAccount={setEditBankAccount}
                setVerifyBankAccount={setVerifyBankAccount}
                isAllPortfolio={selectedPortfolioId === "All"}
              />
            ))
          ) : (
            <div className="empty text-center py-5">
              <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
            </div>
          )}
        </div>

        <Modal show={!!deleteBankAccount} onHide={handleClose} className="modal-v1 border-radius-16">
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              Delete Bank Account?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center mb-3">Are you sure you want to delete this bank account?</Modal.Body>
          <Modal.Footer>
            <ModelContainer className="m-0 p-0">
              <Row>
                <Col xs={6}>
                  <Button className="btn-reset w-100" onClick={handleClose}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button className="btn-delete w-100" onClick={() => {
                    if (loggedUserData?.user_role === ROLES.PropertyOwner && ownerData?.invited === 1) {
                      inviteOwnerDeleteBankAccount(deleteBankAccount)
                    } else {
                      handleDeleteBankAccount(deleteBankAccount)
                    }
                  }}
                  >
                    Delete
                  </Button>
                </Col>
              </Row>
            </ModelContainer>
          </Modal.Footer>
        </Modal>
        <Modal show={!!editBankAccount} onHide={handleClose} className="modal-v1 border-radius-16">
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              Switch Bank Account Use?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center mb-3">
            Are you sure you want to switch the use of this bank account?
          </Modal.Body>
          <Modal.Footer>
            <ModelContainer className="m-0 p-0">
              <Row>
                <Col xs={6}>
                  <Button className="btn-reset w-100" onClick={handleClose}>
                    No
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button className="btn-delete w-100" onClick={() => handleEditBankAccount(editBankAccount)}>
                    Yes
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
                • • • • {verifyBankAccount?.masked_card_number}
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
                      open();
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
      </Container>
    </>
  );
};

export default BankAccounts;
