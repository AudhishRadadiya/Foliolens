import React, { useEffect, useState } from "react";
import { Alert, Tab, Tabs } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";

import SubscriptionDetails from "../components/Subscription/SubscriptionDetails";
import SavedCards from "../components/Subscription/SavedCards";
import Subscriptionhistory from "../components/Subscription/Subscriptionhistory";
import Container from "../components/Layout/Container";
import { fetchPaymentMethods, fetchStripeHistory, fetchUser, getRdsFN } from "../Utility/ApiService";
import { ROLES } from "../Utility";
import danger from "../Assets/images/danger.svg";

function Subscription() {
  const dispatch = useDispatch();
  const paymentMethods = useSelector(({ paymentMethods }) => paymentMethods);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const [isDowngraded, setIsDowngraded] = useState(false);

  useEffect(() => {
    if (loggedUserData.stripe_subscription_id) {
      dispatch(fetchStripeHistory());
    }
    dispatch(fetchPaymentMethods());
    dispatch(fetchUser(loggedUserData?.email));
    getPaymentSubscriptions();
  }, []);

  const getPaymentSubscriptions = async () => {
    try {
      const dataRes = await getRdsFN("tbSelect", {
        source: "psub",
        usrId: loggedUserData.id,
      });
      if (
        loggedUserData.user_role === ROLES.PropertyOwner &&
        dataRes[0].stripe_trial_end_date &&
        new Date(dataRes[0].stripe_trial_end_date) < new Date()
      ) {
        setIsDowngraded(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Container title="Subscription">
      <div className="subscription">
        {isDowngraded && (
          <Alert variant="danger">
            <div className="d-flex">
              <img className="error-img" src={danger} alt="" />
              <p className="mb-0 ps-2 pe-2" style={{ color: "black" }}>
                Please upgrade your subscription with a payment method to restore access to paid features.
              </p>
            </div>
          </Alert>
        )}
        <Tabs variant="pills" defaultActiveKey="details" id="uncontrolled-tab-example" className="mb-4 tab-v1">
          <Tab eventKey="details" title="Details">
            <SubscriptionDetails />
          </Tab>

          <Tab
            eventKey="payment"
            title="Payment"
            disabled={
              loggedUserData?.user_role === "Collaborator"
                ? true
                : loggedUserData?.user_role === "Property Owner" && paymentMethods?.length <= 0
                ? true
                : false
            }
          >
            <SavedCards />
          </Tab>

          <Tab
            eventKey="history"
            title="History"
            disabled={
              loggedUserData?.user_role === "Collaborator"
                ? true
                : loggedUserData?.user_role === "Property Owner" && paymentMethods?.length <= 0
                ? true
                : false
            }
          >
            <Subscriptionhistory />
          </Tab>
        </Tabs>
      </div>
    </Container>
  );
}

export default Subscription;
