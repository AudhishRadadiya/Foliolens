import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from "react";
import { Button, Col, Row, Form } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import * as yup from "yup";
import { ROLES, getId, getPublicIpv4 } from "../../Utility";
import FormInput from "../../components/Form/FormInput";
import { setLoading } from "../../store/reducer";
import { API, graphqlOperation } from "aws-amplify";
import { createOwnerDwollaAccount, createPlaidLink } from "../../graphql/mutations";
import { toast } from "react-hot-toast";
import { usePlaidLink } from "react-plaid-link";
import envFile from "../../envFile";
import moment from "moment";
import { createRecordTB } from "../../Utility/ApiService";
import {
  getDwollaProcessorToken,
  getPlaidAccessToken,
  getPlaidAccounts,
  getPlaidInstitution,
} from "../../graphql/queries";
import { useNavigate } from "react-router-dom";

const validationSchema = yup
  .object({
    portfolio_id: yup.string().required("Please select portfolio").nullable(),
  })
  .required();

const InviteOwnerAccountAdd = ({ ownerData }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [plaidToken, setPlaidToken] = useState("");
  const [customerId, setCustomerId] = useState();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });

  const { open } = usePlaidLink({
    token: plaidToken,
    onSuccess: (public_token, metaData) => {
      addBankAccount(metaData);
    },
  });

  useEffect(() => {
    API.graphql(
      graphqlOperation(createPlaidLink, {
        userId: loggedUserData.id,
        userName: envFile.PLAID_USERNAME,
      })
    )
      .then((res) => {
        setPlaidToken(res.data.createPlaidLink.response);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const onSubmit = async (formData) => {
    const portfolioData = allPortfolios.find((i) => i.portfolio_id === Number(formData?.portfolio_id));
    try {
      dispatch(setLoading(true));
      const getCustomerId = await API.graphql(
        graphqlOperation(createOwnerDwollaAccount, {
          data: JSON.stringify({
            ownerId: ownerData.id,
            portfolioId: Number(formData?.portfolio_id),
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
      localStorage.setItem(
        "addBankAccountData",
        JSON.stringify({ portfolio_name: portfolioData.portfolio_name, portfolio_id: portfolioData.portfolio_id })
      );
      setCustomerId(getCustomerId.data.createOwnerDwollaAccount.response);
      open();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

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
          owner_id: ownerData?.id,
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
          owner_id: ownerData?.id,
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
      methods.reset();
      dispatch(setLoading(false));
      navigate("/BankAccounts");
    } catch (error) {
      console.log("Error while add bank", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong while adding bank account");
    }
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={methods.handleSubmit(onSubmit)} className="add_task" style={{ minHeight: "calc(100vh - 400px)" }}>
        <Row>
          <Col xs lg="5">
            <FormInput
              name="portfolio_id"
              label="Portfolio"
              type="select"
              options={sharedPortfolio?.map((item) => ({
                label: item.portfolio_name,
                icon: item?.is_collaborator === 1 && require("../../Assets/images/sharedIcon.svg").default,
                value: item.id,
              }))}
              className="pt-3"
              placeholder="Select Portfolio"
              allPortfolios={allPortfolio}
            />
          </Col>
        </Row>

        <Row className="pt-5">
          <Col>
            <Button type="reset" className="btn-md btn-reset">
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
  );
};

export default InviteOwnerAccountAdd;
