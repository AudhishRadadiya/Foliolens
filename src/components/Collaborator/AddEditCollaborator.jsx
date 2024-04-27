import React, { useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";
import { Button, Col, Container, Modal, Row, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";

import { getId } from "../../Utility";
import FormInput from "../Form/FormInput";
import { sendHubspotEmail } from "../../graphql/queries";
import envFile from "../../envFile";
import { setLoading } from "../../store/reducer";
import { createRecordTB, fetchAllPortfolios, getRdsFN, updateRecordTB } from "../../Utility/ApiService";

const validationSchema = yup
  .object({
    first_name: yup.string().when({
      is: (value) => value,
      then: yup.string().matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid First Name"),
      otherwise: yup.string().nullable(),
    }),
    last_name: yup.string().when({
      is: (value) => value,
      then: yup.string().matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Last Name"),
      otherwise: yup.string().nullable(),
    }),
    phone: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .matches(/^(\([0-9]{3}\)|[0-9]{3}-) [0-9]{3}-[0-9]{4}$/, "Please enter a valid Phone Number")
        .max(14, "Please enter a valid Phone Number"),
      otherwise: yup.string().nullable(),
    }),
    portfolio_id: yup.array().required("Please select Portfolio").nullable(),
    email: yup
      .string()
      .email("Please enter valid Email")
      .required("Please enter Email Address")
      .matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter valid Email"
      ),
    permission: yup.string().required("Please select permissions for this collaborator  "),
    personal_message: yup.string().notRequired(),
    isInvite: yup.boolean(),
  })
  .required();

const AddEditCollaborator = ({ show, editData, fetchData, handleModelClose }) => {
  const [collaboratorModel, setCollaboratorModel] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [formData, setFormData] = useState({});
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allPortfolio = useSelector(({ allPortfolio, sharedPortfolio }) =>
    [...allPortfolio, ...sharedPortfolio].map((d) => ({
      ...d,
      permission: d.user_id === loggedUserData.id ? null : d.permission,
    }))
  );

  const dispatch = useDispatch();
  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      isInvite: true,
    },
  });

  const handleClose = () => {
    methods.reset();
    handleModelClose();
  };

  useEffect(() => {
    if (editData) {
      Object.keys(editData).map((keys) => {
        let key = keys;
        let value = editData[keys];

        switch (keys) {
          case "portfolios":
            key = "portfolio_id";
            value = value.map((i) => {
              return { label: i.portfolio_name, value: i.portfolio_id };
            });
            break;

          default:
            break;
        }

        methods.setValue(key, value);
      });
    }
  }, [editData]);

  const onSubmit = async (formData) => {
    if (formData?.isInvite) {
      submitCollaborator(formData);
    } else {
      setShowInvite(true);
      setFormData(formData);
    }
  };

  const submitCollaborator = async (formData) => {
    // const { portfolio_name } = allPortfolio.find((data) => data.id === Number(formData.portfolio_id));
    try {
      dispatch(setLoading(true));
      const collaboratorObj = {
        active: 1,
        email: formData?.email.toLowerCase(),
        id: editData ? editData.id : getId(),
        invite: formData.isInvite ? 1 : 0,
        first_name: formData?.first_name,
        last_name: formData?.last_name,
        phone: formData?.phone,
        permission: formData?.permission,
        personal_message: formData?.personal_message,
        // portfolio_id: formData?.portfolio_id,
        // portfolio_name: portfolio_name,
        user_id: loggedUserData.id,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };

      const data = await getRdsFN("countCollab", { portfolioId: formData.id, email: formData.email });
      const count = data[0]?.count;

      if (count) {
        alert("You have already shared this portfolio with this email address");
        return;
      }

      if (editData) {
        await updateRecordTB("Collaborator", collaboratorObj);
      } else {
        await createRecordTB("Collaborator", collaboratorObj);
        if (formData.isInvite) {
          // const isUserExists = await getRdsFN("countUser", {
          //   email: formData?.email,
          // });
          // const [userCount] = isUserExists;
          await API.graphql(
            graphqlOperation(sendHubspotEmail, {
              id: collaboratorObj.id,
              role: "Collaborator",
              code: "CINVITE",
              data: JSON.stringify({
                name: `${loggedUserData?.first_name + " " + loggedUserData?.last_name}`,
                message_title: `Here's what ${loggedUserData.first_name + " " + loggedUserData.last_name} is saying: `,
                message: formData?.personal_message,
                invite_url: envFile.COLLABORATOR_REDIRECT_URL + collaboratorObj.id,
                button_text: "Accept Invitation & Create Account",
              }),
            })
          );
        }
      }

      const deletePortfolioData = editData?.portfolios
        ?.filter((item, index) => item.portfolio_id !== formData?.portfolio_id[index]?.value)
        ?.map((data) => {
          return {
            id: data.id,
            portfolio_id: data.portfolio_id,
            collaborator_id: collaboratorObj.id,
            active: 0,
          };
        });

      let portfolioObj = formData?.portfolio_id?.map((item, i) => {
        const prePortfolioData = editData?.portfolios?.find((i) => i.portfolio_id === item.value);
        return {
          id: prePortfolioData ? prePortfolioData?.id : getId(),
          portfolio_id: prePortfolioData ? prePortfolioData?.portfolio_id : item.value,
          collaborator_id: collaboratorObj.id,
          active: 1,
        };
      });

      if (deletePortfolioData?.length) {
        portfolioObj = [...portfolioObj, ...deletePortfolioData];
      }

      await Promise.all(
        portfolioObj.map((p) => {
          const updatePortfolio = editData?.portfolios?.find((i) => i?.portfolio_id === p?.portfolio_id);
          if (updatePortfolio) {
            return updateRecordTB("PortfolioCollaborator", p);
          } else {
            return createRecordTB("PortfolioCollaborator", p);
          }
        })
      );

      fetchData();
      dispatch(fetchAllPortfolios());
      dispatch(setLoading(false));
      setShowInvite(false);
      handleClose();
    } catch (error) {
      dispatch(setLoading(false));
      console.log(error);
      toast.error("Please enter valid email");
    }
  };

  // const styles = {
  //   multiValue: (base, state) => {
  //     return state.data.isFixed ? { ...base, opacity: "1.9" } : base;
  //   },
  //   multiValueLabel: (base, state) => {
  //     return state.data.isFixed ? { ...base, fontWeight: "bold", color: "grey", paddingRight: 6 } : base;
  //   },
  //   multiValueRemove: (base, state) => {
  //     return state.data.isFixed ? { ...base, display: "none" } : base;
  //   },
  // };

  const IsViewOnly = editData?.user_id !== loggedUserData?.id && editData?.permission === "View Only" ? true : false;
  return (
    <div>
      <Modal show={show} onHide={handleClose} centered className="modal-v1 border-radius-16">
        <FormProvider {...methods}>
          <Form onSubmit={methods.handleSubmit(onSubmit)}>
            <Modal.Header>
              <Modal.Title as="h3" className="w-100 text-center">
                {editData ? "Edit" : "Add"} Collaborator
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center mb-3">
              <Row className="text-start">
                <Col style={{ position: "relative" }}>
                  <img
                    src={require("../../Assets/images/instruction-icon.svg").default}
                    alt=""
                    onClick={() => setCollaboratorModel(true)}
                    className="icon-right pointer"
                    style={{
                      position: "absolute",
                      left: "80px",
                      top: "5px",
                    }}
                  />
                  <FormInput
                    name="portfolio_id"
                    label="Portfolio"
                    type="select"
                    options={allPortfolio.map((item) => ({
                      label: item.portfolio_name,
                      icon: item?.is_collaborator === 1 && require("../../Assets/images/sharedIcon.svg").default,
                      value: item.portfolio_id,
                      // visited: false,
                      // isFixed: false,
                    }))}
                    // isClearable={!methods.watch("portfolio_id")?.some((client) => client.visited)}
                    placeholder="Select Portfolio"
                    disabled={IsViewOnly}
                    allPortfolios={allPortfolio}
                    isMulti={true}
                    // styles={styles}
                    isClearable={false}
                  />
                </Col>
              </Row>
              <Row className="text-start">
                <Col xl="6">
                  <FormInput name="first_name" placeholder="Enter First Name" label="First Name" optional />
                </Col>
                <Col xl="6">
                  <FormInput name="last_name" placeholder="Enter Last Name" label="Last Name" optional />
                </Col>
              </Row>

              <Row className="text-start">
                <Col xl="6">
                  <FormInput
                    name="email"
                    type="email"
                    placeholder="Enter Email Address"
                    label="Email Address"
                    disabled={IsViewOnly || editData}
                  />
                </Col>
                <Col xl="6">
                  <FormInput
                    placeholder="Enter Phone Number"
                    label="Phone Number"
                    name="phone"
                    mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                    type="maskInput"
                    guide={false}
                    optional
                  />
                </Col>
              </Row>

              <Row className="text-start">
                <FormInput
                  name="permission"
                  type="select"
                  options={[
                    { label: "View Only", value: "View Only" },
                    { label: "Manage", value: "Manage" },
                  ]}
                  label="Permission*"
                  placeholder="Select Permission"
                  disabled={IsViewOnly}
                />
              </Row>
              {!editData && (
                <Row className="text-start">
                  <FormInput
                    name="personal_message"
                    placeholder="Enter Personal Message"
                    label="Personal Message"
                    disabled={IsViewOnly}
                    optional
                  />
                </Row>
              )}

              <Row className="text-start">
                {!editData && (
                  <FormInput name="isInvite" type="checkbox" label="Invite Collaborator to Foliolens via email." />
                )}
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Container className="m-0">
                <Row>
                  <Col xs={6}>
                    <Button className="btn-reset w-100" onClick={handleClose}>
                      Cancel
                    </Button>
                  </Col>
                  <Col xs={6}>
                    <Button type="submit" disabled={IsViewOnly} className=" w-100">
                      Save
                    </Button>
                  </Col>
                </Row>
              </Container>
            </Modal.Footer>
          </Form>
        </FormProvider>
      </Modal>
      <Modal
        className="modal-v1 border-radius-16 confirm-model"
        centered
        show={collaboratorModel}
        onHide={() => setCollaboratorModel(false)}
      >
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            At this time, collaborators can only be granted Read or Manage permissions on a portfolio. Collaborators
            could be other investors partnering on a deal, bookkeeper, CPAs, assistants etc.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCollaboratorModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showInvite}
        onHide={() => setShowInvite(false)}
        centered
        className="confirm-model modal-v1 border-radius-16"
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Confirm Action
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          Are you sure you want to proceed without inviting this user to the platform?
        </Modal.Body>
        <Modal.Footer>
          <Row className="w-100">
            <Col xs={6}>
              <Button className="btn-reset w-100 border" onClick={() => setShowInvite(false)}>
                No
              </Button>
            </Col>
            <Col xs={6}>
              <Button className="btn-reset w-100 border" onClick={() => submitCollaborator(formData)}>
                Yes
              </Button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AddEditCollaborator;
