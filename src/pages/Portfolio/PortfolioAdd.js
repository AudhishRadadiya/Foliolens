import React, { useEffect, useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";

import Container from "../../components/Layout/Container";
import PortfolioStep1 from "../../components/Portfolios/PortfolioStep1";
import { setLoading } from "../../store/reducer";

import { createRecordTB, deleteRecordTB, fetchAllPortfolios, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { API, graphqlOperation } from "aws-amplify";
import { addPortfolio, editPortfolio } from "../../graphql/mutations";

const validationSchema = yup
  .object({
    portfolio_name: yup
      .string()
      .required("Please enter portfolio Name")
      // .matches(/^[a-zA-Z0-9 ][\w@#$&;.,\'()\[\]-]{2,50}$/, "Please ener a valid Portfolio Name")
      .test("portfolio_name", "Please ener a valid Portfolio Name", function (value) {
        const nameRegx = /^[a-zA-Z0-9 ][\w@#$&;.,\'()\[\]-]{2,50}$/;
        if (
          value &&
          !nameRegx.test(
            value
              .split("")
              .filter((c) => !["'", "/", " "].includes(c))
              .join("")
          )
        ) {
          return false;
        }
        return true;
      }),
    ownerData: yup
      .array()
      .of(
        yup.object().shape({
          // owner: yup
          //   .string()
          //   .required("Please enter Portfolio Owner Name")
          //   .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please ener a valid Portfolio Owner Name"),
          first_name: yup
            .string()
            .required("Please enter Portfolio Owner First Name")
            .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please ener a valid Portfolio Owner First Name"),
          last_name: yup
            .string()
            .required("Please enter Portfolio Owner Last Name")
            .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please ener a valid Portfolio Owner Last Name"),
          email: yup
            .string()
            .required("Please enter Portfolio Owner email")
            .matches(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
              "Please enter a valid Email"
            )
            .test("email", "Email must be unique", (values, context) => {
              let filteredData = context?.from[1]?.value?.ownerData.filter((i) => i.email === values);
              return filteredData?.length <= 1;
            }),
          invite: yup.boolean(),
          ownership: yup
            .number()
            .required("Please enter Ownership")
            .typeError("Please enter Ownership")
            .test("ownerData", "Total Ownership should be a 100%", function (value, context) {
              const ownerData = context.from[1].value.ownerData;
              const sumownerShip = ownerData.reduce((n, { ownership }) => n + parseFloat(ownership), 0);
              return 100 === sumownerShip;
            }),
        })
      )
      .required(),
  })
  .required();

export default function PortfolioAdd() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const { portfolioData: editPortfolioData } = state || {};
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const [owners, setOwners] = useState();
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];
  const currentPortfolio = allPortfolios.find((i) => i.id === editPortfolioData?.portfolio_id);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      ownerData: [],
    },
    // mode: "onChange",
  });

  const { reset } = methods;

  useEffect(() => {
    onFilterOwner();
    if (!currentPortfolio) {
      methods.setValue("ownerData", [
        {
          first_name: loggedUserData.first_name,
          last_name: loggedUserData.last_name,
          email: loggedUserData.email,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (currentPortfolio) {
      document.title = "Edit Portfolio";

      Object.keys(currentPortfolio).forEach((originalKey) => {
        let value = currentPortfolio[originalKey];
        let key = originalKey;
        switch (originalKey) {
          case "owners":
            key = "ownerData";
            value = value.map((item) => ({
              first_name: item.first_name,
              last_name: item.last_name,
              email: item.email,
              ownership: item.ownership,
              id: item.id,
            }));
            break;

          default:
            break;
        }
        methods.setValue(key, value);
      });
      return;
    }
    document.title = "Add Portfolio";
  }, [currentPortfolio]);

  const onFilterOwner = async (userId) => {
    try {
      dispatch(setLoading(true));
      const response = await getRdsFN("tbSelect", {
        source: "pOwn",
        cBy: loggedUserData?.id,
        act: 1,
      });
      const temp = response?.map((o) => ({
        first_name: o.first_name,
        last_name: o.last_name,
        text: `${o.first_name} ${o.last_name}`,
        id: o.id,
        email: o.email,
      }));
      setOwners(temp);
      dispatch(setLoading(false));
    } catch (err) {
      console.log("Filter Owner Err", err);
      dispatch(setLoading(false));
    }
  };

  // const deleteOwnership = async (id) => {
  //   try {
  //     dispatch(setLoading(true));
  //     const payload = {
  //       id,
  //       updated_by: loggedUserData?.id,
  //       active: 0,
  //       last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
  //     };
  //     await updateRecordTB("PortfolioOwnership", payload);
  //     // dispatch(fetchAllPortfolios());
  //     dispatch(setLoading(false));
  //   } catch (error) {
  //     console.log("Error deleteOwnership", error);
  //     dispatch(setLoading(false));
  //     toast.alert("Something went wrong!");
  //   }
  // };

  const deleteOwnership = async (id) => {
    try {
      dispatch(setLoading(true));
      await deleteRecordTB("deleteOwnership", {
        id,
        userId: loggedUserData?.id,
        time: moment().format("YYYY-MM-DD HH:mm:ss"),
      });
      toast.success("ownership deleted sucessfully!");
      dispatch(fetchAllPortfolios());
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error", error);
      toast.error("Something went wrong!");
    }
  };

  // const onCreateUserPortfolio = async (id, name) => {
  //   const userObj = {
  //     id: getId(),
  //     user_id: loggedUserData.id,
  //     user_name: loggedUserData.first_name ? loggedUserData.first_name + loggedUserData.last_name : " ",
  //     portfolio_id: id,
  //     portfolio_name: name,
  //     access: "Manage",
  //     shared: 0,
  //     email: loggedUserData.email,
  //     active: 1,
  //   };
  //   return await createRecordTB("UserPortfolio", userObj);
  // };

  // const onEditPortfolio = async (formData, mappedownerData) => {
  //   await updateRecordTB("Portfolio", {
  //     id: editPortfolioData.id,
  //     // user_id: loggedUserData.id,
  //     portfolio_name: formData.portfolio_name,
  //     owner: mappedownerData.join("|"),
  //     last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
  //     updated_by: loggedUserData.id,
  //   });

  //   dispatch(setLoading(false));
  //   dispatch(fetchAllPortfolios());
  //   navigate("/Portfolios");
  // };

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));
      const userId = loggedUserData.id;

      const portfolioPayload = {
        owners: formData?.ownerData,
        created_by: userId,
        portfolio_name: formData?.portfolio_name,
        time: moment().format("YYYY-MM-DD HH:mm:ss"),
      };

      if (currentPortfolio) {
        await API.graphql(
          graphqlOperation(editPortfolio, {
            data: JSON.stringify({ ...portfolioPayload, portfolio_id: formData?.id }),
          })
        );
      } else {
        // if (editPortfolioData) {
        //   await onEditPortfolio(formData, mappedownerData);
        //   return;
        // }

        // const dbData = {
        //   id: getId(),
        //   portfolio_name: formData.portfolio_name,
        //   user_id: userId,
        //   created_by: userId,
        //   status: "",
        //   active: 1,
        //   updated_by: userId,
        //   owner: mappedownerData.join("|"),
        //   last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        //   created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        // };

        // const portfolioData = await createRecordTB("Portfolio", dbData);
        // await onCreateUserPortfolio(portfolioData.id, portfolioData.portfolio_name);

        await API.graphql(
          graphqlOperation(addPortfolio, {
            data: JSON.stringify(portfolioPayload),
          })
        );
      }
      dispatch(setLoading(false));
      dispatch(fetchAllPortfolios());
      navigate("/Portfolios");
    } catch (error) {
      console.log("Error adding create Portfolio", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  return (
    <Container title={currentPortfolio ? "Edit portfolio" : "Add portfolio"} isBack>
      <div className="add-portfolio portfolio">
        <FormProvider {...methods}>
          <Form onSubmit={methods.handleSubmit(onSubmit)}>
            <PortfolioStep1 editPortfolioData={currentPortfolio} owners={owners} deleteOwnership={deleteOwnership} />

            <Row className="pt-5">
              <Col>
                <Button onClick={() => navigate(-1)} className="btn-md btn-reset">
                  Cancel
                </Button>
              </Col>
              <Col className="text-end">
                <Button className="btn-md btn-next" type="submit">
                  Save
                </Button>
              </Col>
            </Row>
          </Form>
        </FormProvider>
      </div>
    </Container>
  );
}
