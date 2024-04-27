import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Form, Row, Col, Button } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
// import PaymentStatus, { useMessages } from './PaymentStatus';
// import { useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js"

import FormInput from "../../components/Form/FormInput";
import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import { setLoading } from "../../store/reducer";
import { createStripePaymentMethod, createStripeSubscription } from "../../graphql/mutations";
import { epochDateConvert, getId, ROLES } from "../../Utility";
import { createRecordTB, updateUserFN } from "../../Utility/ApiService";
import envFile from "../../envFile";
import { addPaymentValidationSchema } from "../../Utility/Validations";
import { getStripeSubscription } from "../../graphql/queries";
// import STATES from "../../Utility/states.json";

const AddPaymentMethod = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const methods = useForm({
    resolver: yupResolver(addPaymentValidationSchema),
  });

  // useEffect(() => {
  //   if (!stripe || !elements) {
  //     return;
  //   }

  //   try {
  //     const pr = stripe?.paymentRequest({
  //       currency: 'usd',
  //       country: 'US',
  //       total: {
  //         label: 'Demo payment',
  //         amount: 1999,
  //       },
  //       requestPayerName: true,
  //       requestPayerEmail: true,
  //     });

  //     pr.canMakePayment().then((result) => {
  //       if (result) {
  //         setPaymentRequest(pr);
  //       }
  //     }).catch(e => {
  //       console.log('error', e);
  //     });
  //   }
  //   catch (error) {
  //     console.log("res-error", error)
  //   }

  // }, [stripe, elements, addMessage])

  const onCreatePaymentMethod = async (stripeRes, paymentId, cId, user) => {
    const paymentObj = {
      id: getId(),
      card_type: stripeRes.card.brand,
      card_last4: parseInt(stripeRes.card.last4),
      expiry_month: parseInt(user.expiryDate.slice(0, 2)),
      expiry_year: parseInt(user.expiryDate.slice(3)),
      stripe_paymentmethod_id: paymentId,
      stripe_customer_id: cId,
      default_payment_method: 1,
      active: 1,
      created_by: loggedUserData.id,
      fingerprint: stripeRes.card.fingerprint,
      created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    await createRecordTB("PaymentMethod", paymentObj);
  };

  const addSubscription = async (stripeRes, stripeSubId, customerId, unit, itemId, user, subscriptionRes) => {
    const trial_start_date = epochDateConvert(subscriptionRes.trial_start);
    const trial_end_date = epochDateConvert(subscriptionRes.trial_end);

    const subscriptionObj = {
      id: getId(),
      name: state.billingCycle,
      // billing_cycle: 6,
      billing_cycle: state.billingCycle,
      description: "",
      amount: state.amount,
      stripe_plan_id: state.planId,
      stripe_subscription_id: stripeSubId,
      stripe_customer_id: customerId,
      card_type: stripeRes.card.brand,
      card_last4: stripeRes.card.last4,
      user_id: loggedUserData.id,
      active: 1,
      expiry_month: parseInt(user.expiryDate.slice(0, 2)),
      expiry_year: parseInt(user.expiryDate.slice(3)),
      units: unit,
      item_id: itemId,
      stripe_trial_start_date: moment(trial_start_date).format("YYYY-MM-DD HH:mm:ss"),
      stripe_trial_end_date: moment(trial_end_date).format("YYYY-MM-DD HH:mm:ss"),
      created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      created_by: loggedUserData.id,
    };

    await createRecordTB("PaymentSubscription", subscriptionObj);
    // do not remove await
    await dispatch(
      updateUserFN(
        {
          stripe_subscription_id: stripeSubId,
          stripe_customer_id: customerId,
          no_of_units: Number(state.units),
          user_role: state.user_type,
        },
        true
      )
    );
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
        if (loggedUserData.stripe_subscription_id === null) {
          const res1 = await API.graphql(
            graphqlOperation(createStripeSubscription, {
              email: loggedUserData.email,
              paymentMethodId: parsedData.id,
              priceId: state.planId,
              units: state.units,
              promoCodeId: state.promo_code ? state.promo_code : "null",
              trialPeriod: envFile.TRIAL_PERIOD,
            })
          );
          let planRes = res1.data.createStripeSubscription.response;
          let status = res1.data.createStripeSubscription.status;
          let resPlan = status === 200 ? JSON.parse(planRes) : planRes;
          if (status === 200) {
            await onCreatePaymentMethod(parsedData, resPlan.payment_method_id, resPlan.customer_id, user);
            const isPreviousRoleCol = loggedUserData.user_role === ROLES.Collaborator; // do not remove
            const getStripeSubscriptionData = await API.graphql(
              graphqlOperation(getStripeSubscription, {
                subscriptionId: resPlan?.subscription_id,
              })
            );
            let subscriptionRes = JSON.parse(getStripeSubscriptionData.data.getStripeSubscription.response);

            await addSubscription(
              parsedData,
              resPlan.subscription_id,
              resPlan.customer_id,
              resPlan.units,
              resPlan.item_id,
              user,
              subscriptionRes
            );

            dispatch(setLoading(false));
            toast.success("You've been successfully subscribed to Foliolens");
            navigate("/Dashboard", { state: { isOpen: true } });
            if (isPreviousRoleCol) {
              window.location.reload();
            }
          } else {
            toast.error("The information you provided is not \ncorrect, please retry.");
            dispatch(setLoading(false));
          }
        } else {
          toast.error("You already have a subscription.");
          dispatch(setLoading(false));
        }
      } else {
        toast.error("The information you provided is not \ncorrect, please retry.");
        dispatch(setLoading(false));
      }
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error confirming sign up", error);
      toast.error(error.message || error);
    }
  };

  return (
    <div className="form_screen d-flex h-100">
      {/* <PaymentStatus messages={messages} /> */}
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">
            <Link to="/OtherOnBoarding">
              <FontAwesomeIcon className="icon-left" icon={faAngleLeft}></FontAwesomeIcon>
            </Link>
            Add Payment Method
          </h3>
          <div>
            {/* <div>
              <Row>
                {paymentRequest &&
                  <PaymentRequestButtonElement options={{ paymentRequest }} />
                } 
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
                  <FormInput
                    type="number"
                    name="postal_code"
                    placeholder="Enter Zip Code"
                    label="Zip Code*"
                    maxLength={10}
                  />
                </Row>
                <Row className="trail-text">
                  <Form.Text>
                    After a free 30 day trial period, your card will be charged according to the selected plan
                  </Form.Text>
                </Row>

                <Row className="pt-5">
                  <Button type="submit" className="btn-md">
                    Start Free Trial
                  </Button>
                </Row>
              </Form>
            </FormProvider>
          </div>
        </div>
      </div>
      <AuthSideBar />
    </div>
  );
};

export default AddPaymentMethod;
