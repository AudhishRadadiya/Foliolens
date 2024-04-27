import React from "react";
import { Col, Form, Row, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { API, graphqlOperation } from "aws-amplify";
import toast from "react-hot-toast";
import { setLoading } from "../../store/reducer";
import Container from "../../components/Layout/Container";
import { sendHubspotEmail } from "../../graphql/queries";

const contactUsSchema = yup
  .object({
    message: yup.string().typeError("Please enter your Feedback").required("Please enter your Feedback"),
  })
  .required();

const ContactUs = () => {
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(contactUsSchema),
  });

  const onsendEmail = async (contactUsData) => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(sendHubspotEmail, {
          role: loggedUserData.user_role,
          code: "CONTACT",
          data: JSON.stringify({
            message: contactUsData.message,
          }),
        })
      )
        .then((res) => {
          dispatch(setLoading(false));
          console.log("Send Email Res", res);
          toast.success("Thank you for contacting us, someone from our team will respond to you soon.");
          navigate("/Support");
        })
        .catch((err) => {
          toast.error("Something went wrong!");
          dispatch(setLoading(false));
          console.log("Send Email Err", err);
        });
    } catch (err) {
      dispatch(setLoading(false));
      console.log("Email Send Email Err", err);
      dispatch(setLoading(false));
    }
  };

  const submitContactUs = (formData) => {
    onsendEmail(formData);
  };

  return (
    <Container className="container" title={"Contact Us"} isBack>
      <Form className="contactus-form" onSubmit={handleSubmit(submitContactUs)}>
        <Row>
          <Col lg="6">
            <Row>
              <Col xs="12">
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>How may we help you ?</Form.Label>
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
    </Container>
  );
};

export default ContactUs;
