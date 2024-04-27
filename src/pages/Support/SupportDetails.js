import React, { useEffect } from "react";
import { Col, Form, Row, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import toast from "react-hot-toast";

import { getId } from "../../Utility";
import { createRecordTB, fetchContentfulData } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import Container from "../../components/Layout/Container";
import { sendHubspotEmail } from "../../graphql/queries";

const feedbackSchema = yup
  .object({
    name: yup
      .string()
      .required("Please enter Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Name"),
    email: yup
      .string()
      .email()
      .required("Please enter Email Address")
      .matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid Email"
      ),
    message: yup.string().required("Please enter your Feedback"),
  })
  .required();

function SupportDetails() {
  const { state } = useLocation();
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const contentFullData = useSelector(({ contentFullData }) => contentFullData);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(feedbackSchema),
  });

  useEffect(() => {
    state.name !== "Feedback" && dispatch(setLoading(true));
    dispatch(fetchContentfulData(state.name));
    document.title = state.name;
  }, []);

  useEffect(() => {
    if (loggedUserData) {
      setValue("name", loggedUserData?.first_name + " " + loggedUserData?.last_name);
      setValue("email", loggedUserData?.email);
    }
  }, [loggedUserData]);

  const onCreateFeedback = async (feedbackData) => {
    try {
      dispatch(setLoading(true));
      let feedbackObj = {
        id: getId(),
        user_id: loggedUserData.id,
        email: feedbackData.email,
        name: feedbackData.name,
        message: feedbackData.message.replace(/(\r\n|\n|\r)/gm, "\\n"),
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await createRecordTB("UserFeedback", feedbackObj);

      await API.graphql(
        graphqlOperation(sendHubspotEmail, {
          // userEmail: 'Feedback@foliolensinc.freshdesk.com',
          // userEmail : feedback.email,
          id: loggedUserData.id,
          role: "Feedback",
          code: "UFEED",
          data: JSON.stringify({
            name: feedbackData.name,
            email: feedbackData.email,
            message: feedbackData.message,
          }),
        })
      );

      dispatch(setLoading(false));
      toast.success("Thank you for providing your feedback!");
      navigate("/Support");
    } catch (error) {
      dispatch(setLoading(false));
      console.log("Err User Feedback ", error);
      toast.error("Something went wrong");
    }
  };

  const submitFeedback = (formData) => {
    onCreateFeedback(formData);
  };

  return (
    <Container className="container" title={state.name} isBack>
      <div style={{ alignItems: "center", flex: 1 }}>
        {contentFullData && documentToReactComponents(contentFullData)}
      </div>
      {state.name === "Feedback" && (
        <Form className="feedback-form" onSubmit={handleSubmit(submitFeedback)}>
          <Row>
            <Col lg="6">
              <Row>
                <Col xs="12">
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      disabled
                      placeholder="Enter Name"
                      {...register("name", { required: true })}
                    />
                    <Form.Text style={{ color: "#DC3545" }}>{errors.name && errors?.name?.message}</Form.Text>
                  </Form.Group>
                </Col>

                <Col xs="12">
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      disabled
                      placeholder="Enter Address"
                      {...register("email", { required: true })}
                    />
                    <Form.Text style={{ color: "#DC3545" }}>{errors.email && errors?.email?.message}</Form.Text>
                  </Form.Group>
                </Col>

                <Col xs="12">
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Share your feedback with us</Form.Label>
                    <Form.Control
                      type="text"
                      name="message"
                      placeholder="Feedback"
                      as="textarea"
                      rows={4}
                      {...register("message", { required: true })}
                    />
                    <Form.Text style={{ color: "#DC3545" }}>{errors.message && errors?.message?.message}</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex xl-12 justify-content-end align-items-end">
              <Button type="submit"> Submit </Button>
            </Col>
          </Row>
        </Form>
      )}
    </Container>
  );
}

export default SupportDetails;
