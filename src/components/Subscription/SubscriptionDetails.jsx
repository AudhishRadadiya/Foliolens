import React, { useEffect, useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { API, graphqlOperation } from "aws-amplify";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import SubscriptionPlan from "./SubscriptionPlan";
import SubscriptionUpgradeBtns from "./SubscriptionUpgradeBtns";
import { setLoading } from "../../store/reducer";
import { getStripeSubscription } from "../../graphql/queries";
import { getRdsFN } from "../../Utility/ApiService";
import { formatNumber } from "../../Utility";
import moment from "moment";
// import envFile from "../../envFile";

export default function SubscriptionDetails() {
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const [stripeStatus, setStripeStatus] = useState();
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [datePeriod, setDatePeriod] = useState([]);
  const [trialEndPeriod, setTrialEndPeriod] = useState();

  useEffect(() => {
    if (loggedUserData?.stripe_subscription_id) {
      onGetStripeSubscription();
    }
  }, []);

  const onGetStripeSubscription = async () => {
    try {
      dispatch(setLoading(true));
      const res = await API.graphql(
        graphqlOperation(getStripeSubscription, {
          subscriptionId: loggedUserData.stripe_subscription_id,
        })
      );
      let status = res?.data?.getStripeSubscription?.status;
      let resData = JSON.parse(res.data.getStripeSubscription.response);
      if (resData && Object.keys(resData).length > 0) {
        if (status === 200) {
          // let response = JSON.parse(response);
          // let today = moment();
          let trialDate = moment(new Date(resData.trial_end * 1000)).format("MM/DD/YYYY");
          let activeDate = moment(new Date(resData.current_period_end * 1000)).format("MM/DD/YYYY");
          // let newT = moment(new Date(resData.trial_end * 1000)).diff(today, "seconds");
          // let diffValue = "";
          // let calculteValue = 0;
          // if (
          //   resData &&
          //   resData?.status === "trialing" &&
          //   moment().diff(moment(new Date(resData?.trial_end * 1000)), "days") <= 0 &&
          //   moment().diff(moment(new Date(resData?.trial_end * 1000)), "days") >= -8
          // ) {
          //   if (newT > 86400) {
          //     calculteValue = Math.floor(newT / 86400);
          //     diffValue = `${calculteValue} ${calculteValue > 1 ? "days" : "day"}`;
          //   } else if (newT > 3600) {
          //     calculteValue = Math.floor(newT / 3600);
          //     diffValue = `${calculteValue} ${calculteValue > 1 ? "hours" : "hour"}`;
          //   } else if (newT > 60) {
          //     calculteValue = Math.floor(newT / 60);
          //     diffValue = `${calculteValue} ${calculteValue > 1 ? "minutes" : "minute"}`;
          //   } else if (newT > 0) {
          //     calculteValue = newT;
          //     diffValue = `${calculteValue} ${calculteValue > 1 ? "seconds" : "second"}`;
          //   } else {
          //     diffValue = 0;
          //   }
          //   setSubEndTime(diffValue);
          // }
          setTrialEndPeriod(trialDate);
          setDatePeriod(activeDate);
          setStripeStatus(resData);
        } else {
          toast.error("Something went wrong");
          setLoading(false);
        }
      } else {
        toast.error("Something went wrong");
      }
      const dataRes = await getRdsFN("tbSelect", { source: "psub", usrId: loggedUserData?.id, act: 1 });
      const paymentInfo = dataRes.map((t) => ({
        ...t,
        checked: true,
      }));
      setPaymentDetails(paymentInfo);

      dispatch(setLoading(false));
    } catch (error) {
      console.log("get subscription data err", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong");
    }
  };

  // const trailMessage = () => {
  //   if (subEndTime) {
  //     return <p style={{ color: "gray" }}>{subEndTime} left until the end of the free trial period.</p>;
  //   } else {
  //     return null;
  //   }
  // };
  return (
    <div className="plans">
      <div>
        <Row>
          <Col xs="12" md="8">
            <SubscriptionPlan
              name="Plan"
              price={
                loggedUserData.user_role === "Landlord"
                  ? "Essential"
                  : loggedUserData.user_role === "Property Owner"
                  ? "Free"
                  : loggedUserData.user_role === "Property Manager"
                  ? "Growth"
                  : loggedUserData.user_role
              }
              info={
                loggedUserData.user_role === "Landlord"
                  ? "For individual landlords and real estate investors who want to manage their rental income, communicate with their tenants and optimize their rental portfolio."
                  : loggedUserData.user_role === "Property Manager"
                  ? "For property managers and teams who manage rentals and tenants as a business and want additional reporting capabilities and collaboration with Owners."
                  : loggedUserData.user_role === "Property Owner"
                  ? "For the individual real estate investor who wants to organize and optimize their rental portfolio whether you manage it or work with a property manager."
                  : null
              }
            />
          </Col>
          <Col xs="12" md="4">
            {paymentDetails.map(
              (paymentDetail, i) =>
                loggedUserData.user_role !== "Property Owner" && (
                  <SubscriptionPlan
                    key={i}
                    name={loggedUserData.user_role === "Property Owner" ? null : "Price"}
                    price={`${formatNumber(paymentDetail.amount)}/${paymentDetail.billing_cycle
                      .toLowerCase()
                      ?.substring(0, 2)}`}
                    units={`You have ${loggedUserData?.no_of_units} units`}
                    amount={
                      loggedUserData?.user_role === "Landlord"
                        ? "0 - 25 units"
                        : loggedUserData?.user_role === "Property Manager"
                        ? "0 - 10 units"
                        : null
                    }
                    baseUnits={
                      loggedUserData?.user_role === "Landlord"
                        ? "+ $1 per additional unit"
                        : loggedUserData?.user_role === "Property Manager"
                        ? "+ $2 per additional unit"
                        : null
                    }
                    // info={trailMessage()}
                    duration={paymentDetail.billing_cycle === "month" ? "Monthly" : "Annual"}
                    addUnit
                  />
                )
            )}
          </Col>
        </Row>
        {loggedUserData.user_role !== "Property Owner" &&
        stripeStatus &&
        stripeStatus.status === "trialing" &&
        moment().diff(moment(new Date(stripeStatus?.trial_end * 1000)), "days") <= 0 ? (
          <p style={{ color: "red" }}>Your free trial subscription expires on {trialEndPeriod}.</p>
        ) : null}
        {loggedUserData?.user_role !== "Property Owner" &&
          stripeStatus &&
          stripeStatus?.status !== "trialing" &&
          moment().diff(moment(new Date(stripeStatus?.current_period_end * 1000)), "days") >= -3 &&
          moment().diff(moment(new Date(stripeStatus?.current_period_end * 1000)), "days") <= 0 && (
            <p style={{ color: "#FF5050" }}>Your subscription is about to expire on {datePeriod}.</p>
          )}
        {/* <p className="text-grey">
          Visit your account at{" "}
          <span
            style={{ color: "#1646aa", cursor: "pointer" }}
            onClick={() => window.open(envFile.APP_SIGNIN_URL, "_blank")}
          >
            <b>foliolens.com </b>
          </span>
          to update your payment details or change your plan at any time.
        </p> */}
      </div>
      <Row className="d-flex xl-12 justify-content-end align-items-end">
        <SubscriptionUpgradeBtns stripeStatus={stripeStatus} paymentDetails={paymentDetails} />
      </Row>
    </div>
  );
}
