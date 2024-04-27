import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Form, Row, Col, Button } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import toast from "react-hot-toast";
// import { useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js"

import FormInput from "../../components/Form/FormInput";
import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import { setLoading } from "../../store/reducer";
import {
  addStripePaymentMethod,
  createStripePaymentMethod,
  updateStripePaymentMethod,
  updateStripeSubscription,
} from "../../graphql/mutations";
import { getId } from "../../Utility";
import { addPaymentValidationSchema } from "../../Utility/Validations";
import { createRecordTB, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
// import { updateUserFN } from "../../Utility/ApiService";
// import envFile from "../../envFile";
// import STATES from "../../Utility/states.json";

const AddPayMethod = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  // const [pay, setPay] = useState();
  const [paymentSub, setPaymentSub] = useState({});
  // const stripe = useStripe();
  // const elements = useElements();

  // const [messages, addMessage] = useMessages();
  // const [paymentRequest, setPaymentRequest] = useState(null);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const methods = useForm({
    resolver: yupResolver(addPaymentValidationSchema),
  });

  useEffect(() => {
    filterPayment();
  }, [loggedUserData]);

  const filterPayment = async () => {
    try {
      dispatch(setLoading(true));
      const dataRes = await getRdsFN("tbSelect", {
        source: "psub",
        usrId: loggedUserData.id,
      });
      if (dataRes[0]) setPaymentSub(dataRes[0]);
      dispatch(setLoading(false));
    } catch (error) {
      console.log(error);
      dispatch(setLoading(false));
    }
  };

  const upgradePaymentMethods = async (data, user) => {
    try {
      dispatch(setLoading(true));
      const dataRes = await getRdsFN("tbSelect", {
        source: "payMethod",
        cBy: loggedUserData?.id,
        fPrint: data?.card.fingerprint,
      });

      if (dataRes && dataRes.length > 0) {
        dispatch(setLoading(false));
        toast.error("Card already exists");
        return;
      }

      const res2 = await API.graphql(
        graphqlOperation(addStripePaymentMethod, {
          customerId: loggedUserData.stripe_customer_id,
          paymentMethodId: data?.id,
        })
      );
      let planRes = res2?.data?.addStripePaymentMethod?.response;
      let status = res2?.data?.addStripePaymentMethod?.status;
      // let resPlan = status === 200 ? JSON.parse(planRes) : planRes;
      if (status === 200) {
        await onUpdateSubscription(data, JSON.parse(planRes).payment_method_id);
        await onUpdatePaymentMethod(data, user);
      } else {
        toast.error("The information you provided is not correct, please retry.");
        dispatch(setLoading(false));
      }
    } catch (error) {
      dispatch(setLoading(false));
      console.log("Update cust PM Err", error);
    }
  };

  const onUpdatePaymentMethod = async (stripeRes, user) => {
    try {
      dispatch(setLoading(true));
      let updatePaymentObj = {
        id: getId(),
        card_type: stripeRes.card.brand,
        card_last4: parseInt(stripeRes.card.last4),
        expiry_month: parseInt(user.expiryDate.slice(0, 2)),
        expiry_year: parseInt(user.expiryDate.slice(3)),
        stripe_paymentmethod_id: stripeRes.id,
        stripe_customer_id: loggedUserData.stripe_customer_id,
        default_payment_method: 1,
        active: 1,
        created_by: loggedUserData.id,
        fingerprint: stripeRes.card.fingerprint,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await createRecordTB("PaymentMethod", updatePaymentObj);
      dispatch(setLoading(false));
      toast.success("You’ve been successfully subscribed to Foliolens");
      navigate("/Subscription");
      window.location.reload();
    } catch (err) {
      console.log("Update PM Err", err);
      dispatch(setLoading(false));
    }
  };

  const onUpdateSubscription = async (data, id) => {
    try {
      dispatch(setLoading(true));
      const res = await API.graphql(
        graphqlOperation(updateStripePaymentMethod, {
          subscriptionId: loggedUserData.stripe_subscription_id,
          paymentMethodId: id,
        })
      );

      let status = res?.data?.updateStripePaymentMethod?.status;
      if (status === 200) {
        await API.graphql(
          graphqlOperation(updateStripeSubscription, {
            subscriptionId: loggedUserData.stripe_subscription_id,
            priceId: state?.planId ? state?.planId : paymentSub?.stripe_plan_id,
            units: state?.units ? state?.units : paymentSub?.units,
            promoCodeId: state?.promo_code_id ? state?.promo_code_id : "null",
            itemId: state?.itemId ? state?.itemId : paymentSub?.item_id,
          })
        ).then((res) => {
          let status = res?.data?.updateStripeSubscription?.status;
          let response = res?.data?.updateStripeSubscription?.response;
          if (status === 200) {
            // let stripeResponse = JSON.parse(response);
            onUpdatePayment(data);
          } else {
            toast.error(response);
            dispatch(setLoading(false));
          }
        });
      }
    } catch (err) {
      console.log("Default Payment Err", err);
      dispatch(setLoading(false));
    }
  };

  const onUpdatePayment = async (data) => {
    try {
      dispatch(setLoading(true));
      let updatePayObj = {
        id: state?.paymentSub?.id ? state?.paymentSub?.id : paymentSub?.id,
        name: state?.userType ? state?.userType : loggedUserData.user_role,
        billing_cycle: state?.billingCycle ? state?.billingCycle : paymentSub?.billing_cycle,
        amount: state?.amount ? state?.amount : paymentSub?.amount,
        card_type: data.card.brand,
        card_last4: parseInt(data.card.last4),
        stripe_plan_id: state?.planId ? state?.planId : paymentSub?.stripe_plan_id,
        stripe_customer_id: loggedUserData.stripe_customer_id,
        stripe_subscription_id: loggedUserData.stripe_subscription_id,
        user_id: loggedUserData.id,
        active: 1,
        expiry_month: parseInt(data.card.exp_month),
        item_id: state?.itemId ? state?.itemId : paymentSub?.item_id,
        units: state?.units ? state?.units : paymentSub?.units,
        expiry_year: parseInt(data.card.exp_year),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        paid_subscription_start_date: moment().format("YYYY-MM-DD"),
      };
      await updateRecordTB("PaymentSubscription", updatePayObj);

      let updateUserObj = {
        id: loggedUserData.id,
        user_role: state?.userType ? state?.userType : loggedUserData.user_role,
        no_of_units: state?.units ? state?.units : loggedUserData.units,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await updateRecordTB("User", updateUserObj);

      dispatch(setLoading(false));
    } catch (err) {
      console.log("Update Payment Subs Err", err);
      dispatch(setLoading(false));
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
        await upgradePaymentMethods(parsedData, user);
      } else {
        dispatch(setLoading(false));
        toast.error("The information you provided is not correct, please retry.");
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
          <h3 className="mb-4 title" style={{ fontSize: 24 }}>
            <Link to="/OtherUserUpgrade">
              <FontAwesomeIcon className="icon-left" icon={faAngleLeft}></FontAwesomeIcon>
            </Link>
            Add Payment Method
          </h3>
          <div>
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
                    // searchType="country"
                  /> */}

                  <FormInput
                    type="number"
                    name="postal_code"
                    placeholder="Enter Zip Code"
                    label="Zip Code*"
                    maxLength={10}
                  />
                </Row>
                <Row className="pt-5">
                  <Button type="submit" className="btn-md">
                    Pay
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

export default AddPayMethod;
