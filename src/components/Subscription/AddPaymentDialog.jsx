import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Row, Col, Button, Modal } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import toast from "react-hot-toast";

import FormInput from "../../components/Form/FormInput";
import { setLoading } from "../../store/reducer";
import { addStripePaymentMethod, createStripePaymentMethod } from "../../graphql/mutations";
import { getId } from "../../Utility";
import { createRecordTB, fetchPaymentMethods, getRdsFN } from "../../Utility/ApiService";
import { addPaymentValidationSchema } from "../../Utility/Validations";
// import STATES from "../../Utility/states.json";

const AddPaymentDialog = ({ show, handleClose }) => {
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const methods = useForm({
    resolver: yupResolver(addPaymentValidationSchema),
  });

  const onUpdatePaymentMethod = async (stripeRes, user) => {
    const res = await API.graphql(
      graphqlOperation(addStripePaymentMethod, {
        customerId: loggedUserData.stripe_customer_id,
        paymentMethodId: stripeRes.id,
      })
    );
    const status = res.data.addStripePaymentMethod.status;
    if (status === 200) {
      await createRecordTB("PaymentMethod", {
        id: getId(),
        card_type: stripeRes.card.brand,
        card_last4: parseInt(stripeRes.card.last4),
        expiry_month: parseInt(user.expiryDate.slice(0, 2)),
        expiry_year: parseInt(user.expiryDate.slice(3)),
        stripe_paymentmethod_id: stripeRes.id,
        stripe_customer_id: loggedUserData.stripe_customer_id,
        default_payment_method: 0,
        active: 1,
        created_by: loggedUserData.id,
        fingerprint: stripeRes.card.fingerprint,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      dispatch(fetchPaymentMethods());
      toast.success("You have added a New Card to the \nFoliolens successfully!");
      handleClose();
    } else {
      toast.error("The information you provided is not \ncorrect, please retry.");
    }
  };

  const onSubmit = async (user) => {
    try {
      dispatch(setLoading(true));
      const res = await API.graphql(
        graphqlOperation(createStripePaymentMethod, {
          number: user.cardNumber,
          cvc: user.cvv,
          exp_month: parseInt(user.expiryDate.slice(0, 2)),
          exp_year: parseInt(user.expiryDate.slice(3)),
          name: user.name,
          address: "",
          city: "",
          state: "",
          zip: user.postal_code,
        })
      );
      const status = res.data.createStripePaymentMethod.status;
      if (status === 200) {
        const parsedData = JSON.parse(res.data.createStripePaymentMethod.response);
        const dataRes = await getRdsFN("tbSelect", {
          source: "payMethod",
          cBy: loggedUserData?.id,
          fPrint: parsedData?.card.fingerprint,
          act: 1,
        });
        if (dataRes && dataRes.length > 0) {
          toast.error("Card already exists");
        } else {
          await onUpdatePaymentMethod(parsedData, user);
        }
      } else {
        toast.error("The information you provided is not \ncorrect, please retry.");
        console.log("error");
      }
      dispatch(setLoading(false));
      methods.reset();
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error confirming sign up", error);
      toast.error(error.message || error);
    }
  };

  return (
    <Modal centered show={show} onHide={handleClose} className="modal-v1 border-radius-16">
      <Modal.Header>
        <Modal.Title as="h3" className="w-100 text-center title">
          Add Payment Method
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="mb-3">
        {/* <div>
          <Row>
            <Button className="apple-btn">
              <FontAwesomeIcon className="mx-2" icon={faAppleAlt} />
              Pay
            </Button>
          </Row>
        </div>
        <div
          className="w-100 text-center border-1"
          style={{ height: "15px", borderBottom: "1px solid #D9D9D9", margin: "10px 0px" }}
        >
          <span style={{ fontSize: "14px", backgroundColor: "#F3F5F6", padding: "0 10px" }}>or</span>
        </div> */}
        {/* <div className="my-4">
          <span className="fw-bold">Add Credit Card</span>
        </div> */}
        <FormProvider {...methods}>
          <Form onSubmit={methods.handleSubmit(onSubmit)}>
            <Row>
              <FormInput
                name="cardNumber"
                type="card"
                placeholder="0000 0000 0000 0000"
                label="Card Number*"
                maxLength={16}
                onInput={(e) => {
                  if (e.target.value.length > e.target.maxLength)
                    e.target.value = e.target.value.slice(0, e.target.maxLength);
                }}
              />
            </Row>

            <Row>
              <Col md="6" xl="6" sm="6" xs="6">
                <FormInput
                  name="expiryDate"
                  placeholder="MM/YY"
                  // label="MM/YYYY*"
                  maxLength={5}
                  onInput={(e) => {
                    if (e.target.value === "0" || Number(e.target.value) || e.target.value.search("/") >= 0) {
                      e.target.value =
                        e.target.value.replace(/\//g, "").substring(0, 2) +
                        (e.target.value.length > 2 ? "/" : "") +
                        e.target.value.replace(/\//g, "").substring(2, 5);

                      if (e.target.value.length > e.target.maxLength) {
                        e.target.value = e.target.value.slice(0, e.target.maxLength);
                      }
                    } else {
                      e.target.value = "";
                    }
                  }}
                />
              </Col>
              <Col md="6" xl="6" sm="6" xs="6">
                <FormInput
                  name="cvv"
                  type="number"
                  placeholder="CVC"
                  // label="CVV*"
                  maxLength={4}
                  onKeyDown={(evt) => {
                    if (evt.key === "e") {
                      evt.preventDefault();
                    }
                  }}
                  onInput={(e) => {
                    if (e.target.value.length > e.target.maxLength)
                      e.target.value = e.target.value.slice(0, e.target.maxLength);
                  }}
                />
              </Col>
            </Row>
            <Row>
              <FormInput name="name" placeholder="Enter Name on Card" label="Name on Card*" />
            </Row>

            <Row>
              {/* <FormInput
                name="country"
                // type=""
                placeholder="Enter Country"
                label="Country*"
              /> */}

              <FormInput
                type="number"
                name="postal_code"
                placeholder="Enter Zip Code"
                label="Zip Code*"
                maxLength={10}
              />
            </Row>

            {/* <Row>
              <Form.Text>After a free 14 day period your card will be debited according to the selected plan</Form.Text>
            </Row> */}
            <Row className="pt-5">
              <Col md="6">
                <Button onClick={handleClose} className="btn-reset w-100 mb-0">
                  Cancel
                </Button>
              </Col>
              <Col md="6">
                <Button type="submit" className="btn-md w-100">
                  Save
                </Button>
              </Col>
            </Row>
          </Form>
        </FormProvider>
      </Modal.Body>
    </Modal>
  );
};

export default AddPaymentDialog;
