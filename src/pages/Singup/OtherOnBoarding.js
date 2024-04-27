import React, { useEffect, useState } from "react";
import { Button, Form, Card } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";

import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import PromoCode from "../../components/PromoCode/PromoCode";
import { setLoading } from "../../store/reducer";
import { createRecordTB, fetchStripePlans, updateUserFN } from "../../Utility/ApiService";
import { createStripeFreeTrial, createStripeQuote } from "../../graphql/mutations";
import { checkIsNotSecondUser, getId } from "../../Utility";
import envFile from "../../envFile";
import { formatNumber } from "../../Utility/index";

export default function OtherOnBoarding() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const [noOfUnits, setNoOfUnits] = useState("1");
  const [promoCodeRes, setPromoCodeRes] = useState({ id: "", discount: 0 });
  const [meteredPlans, setMeteredPlans] = useState([]);
  const { state } = useLocation();
  const { userType } = state || {};
  const [selectedPlan, setSelectedPlan] = useState({
    planId: "",
    billingCycle: "",
    amount: "",
  });
  const stripePlans = useSelector(({ stripePlans }) => stripePlans);
  const { planPrice = [] } = stripePlans;

  useEffect(() => {
    if (loggedUserData) {
      dispatch(fetchStripePlans(userType));
    }
    if (loggedUserData?.stripe_subscription_id && checkIsNotSecondUser(loggedUserData)) {
      navigate("/Dashboard");
    }
  }, [loggedUserData]);

  useEffect(() => {
    getAmount();
  }, [noOfUnits, planPrice]);

  const submit = async () => {
    try {
      if (Number(noOfUnits) > 2500) {
        return toast.error(
          "You can manage only upto 2500 units. To add more units please contact the Foliolens team from our website."
        );
      }
      dispatch(setLoading(true));
      // let customer_name = loggedUserData ? `${loggedUserData?.first_name} ${loggedUserData?.last_name} ` : " ";

      // const res = await API.graphql(
      //   graphqlOperation(createStripeFreeTrial, {
      //     email: loggedUserData.email,
      //     priceId: selectedPlan.planId,
      //     name: customer_name,
      //     units: Number(noOfUnits),
      //     trialPeriod: envFile.TRIAL_PERIOD,
      //   })
      // );
      // const parsedRes = JSON.parse(res.data.createStripeFreeTrial.response);

      // const subscriptionObj = {
      //   id: getId(),
      //   name: userType,
      //   billing_cycle: parsedRes?.plan_interval,
      //   description: "",
      //   amount: selectedPlan.amount,
      //   stripe_plan_id: parsedRes?.price_id,
      //   stripe_subscription_id: parsedRes?.subscription_id,
      //   stripe_customer_id: parsedRes?.customer_id,
      //   user_id: loggedUserData.id,
      //   active: 1,
      //   units: Number(noOfUnits),
      //   item_id: parsedRes?.item_id,
      //   created_by: loggedUserData.id,
      //   created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      //   last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      //   stripe_trial_start_date: parsedRes.trial_start_date,
      //   stripe_trial_end_date: parsedRes.trial_end_date,
      // };
      // await createRecordTB("PaymentSubscription", subscriptionObj);

      // await dispatch(
      //   updateUserFN({
      //     no_of_units: Number(noOfUnits),
      //     stripe_subscription_id: parsedRes?.subscription_id,
      //     stripe_customer_id: parsedRes?.customer_id,
      //     user_role: userType,
      //   })
      // );

      // setTimeout(() => {
      //   dispatch(setLoading(false));
      //   toast.success("You've been successfully subscribed to Foliolens");
      //   navigate("/Properties", { state: { isOpen: true } });
      // }, 2000);

      navigate("/AddPaymentMethod", {
        state: {
          planId: selectedPlan.planId,
          promo_code_id: promoCodeRes.id,
          units: Number(noOfUnits),
          billingCycle: selectedPlan.billingCycle,
          amount: selectedPlan.amount,
          user_type: userType,
        },
      });

      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error confirming sign up", error);
      toast.error("Something went wrong while creating a payment subscription");
    }
  };

  const getDiscount = (n, d) => {
    n = Number(n);
    d = Number(d);
    if (!d) return n;
    let m = n - Number(Number((d / 100) * n).toFixed(2));
    if (m === Math.floor(m)) return m + "";
    return m.toFixed(2);
  };

  const getAmount = async () => {
    try {
      if (planPrice.length > 0) {
        dispatch(setLoading(true));
        const res = await Promise.all(
          planPrice.map((plan) => {
            return API.graphql(
              graphqlOperation(createStripeQuote, {
                priceId: plan.id,
                units: Number(noOfUnits),
              })
            ).then((data) => JSON.parse(data.data.createStripeQuote.response));
          })
        );
        const newPlans = res.map((data, i) => ({
          id: i,
          amount: data.amount_total,
          interval: data?.computed?.recurring?.interval,
          priceId: planPrice[i].id,
        }));
        newPlans.sort(function (a, b) {
          return b.id - a.id;
        });
        setMeteredPlans(newPlans);
        dispatch(setLoading(false));
      }
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error confirming sign up", error);
      toast.error(error.message || error);
    }
  };

  return (
    <div className="form_screen d-flex flex-wrap h-100">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">
            {userType === "Landlord" ? "How many units do you own?" : "How many units do you manage?"}
          </h3>
          <div>
            <Form.Group className="mb-5">
              <Form.Control
                type="text"
                placeholder="Your Units"
                onChange={(e) => setNoOfUnits(e.target.value)}
                value={noOfUnits}
                defaultValue={loggedUserData?.no_of_units}
              />
            </Form.Group>

            <div className="text-center mb-5">
              <h4 className="mb-3">Select your plan</h4>
              <div className="select-plan d-flex mb-4">
                {meteredPlans.map((item) => (
                  <Card
                    className={`flex-fill ${selectedPlan.planId === item.priceId ? "active" : ""}`}
                    key={item.id}
                    onClick={() => {
                      setSelectedPlan({
                        planId: item.priceId,
                        billingCycle: item.interval,
                        amount: getDiscount(item.amount / 100, promoCodeRes.discount),
                      });
                    }}
                  >
                    <Card.Body>
                      <Card.Title as="h6" className="mb-3">
                        {item.interval === "year" ? "Annual" : "Monthly"}
                      </Card.Title>
                      <Card.Text>
                        {formatNumber(getDiscount(item.amount / 100, promoCodeRes.discount))}
                        {/* /{item.interval === "year" ? "yr" : "mo"} */}
                        {item.interval === "year" && promoCodeRes.discount ? (
                          <span className="discount">
                            <em>{promoCodeRes.discount + 20}% discount</em>
                          </span>
                        ) : item.interval === "month" && promoCodeRes.discount ? (
                          <span className="discount">
                            <em>{promoCodeRes.discount}% discount</em>
                          </span>
                        ) : item.interval === "year" && !promoCodeRes.discount ? (
                          <span className="discount">
                            <em>20% discount</em>
                          </span>
                        ) : (
                          ""
                        )}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                ))}
              </div>

              <PromoCode setPromoCodeRes={setPromoCodeRes} />
            </div>

            <Button
              type="submit"
              className="w-100"
              onClick={() => {
                submit();
              }}
              disabled={selectedPlan?.planId !== "" && noOfUnits > 0 ? false : true}
            >
              Next
            </Button>
          </div>
          {/* <p className="pt-3" style={{ textAlign: "center" }}>
            No Credit Card Required To Sign Up
          </p> */}
        </div>
      </div>

      <AuthSideBar />
    </div>
  );
}
