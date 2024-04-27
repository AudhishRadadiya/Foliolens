import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import { createRecordTB, fetchStripePlans, updateUserFN } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import { getId } from "../../Utility";
import { createFreeSubscription } from "../../graphql/mutations";

export default function PropertyOwnerOnBoarding() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [noOfUnits, setNoOfUnits] = useState("");
  const stripePlans = useSelector(({ stripePlans }) => stripePlans);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const { state } = useLocation();
  const { userType } = state;

  useEffect(() => {
    if (loggedUserData && userType) {
      dispatch(fetchStripePlans(userType));
    }
    // if (loggedUserData?.stripe_subscription_id && checkIsNotSecondUser(loggedUserData)) {
    //   navigate("/Portfolios");
    // }
  }, [loggedUserData, userType]);

  const submit = async () => {
    try {
      if (Number(noOfUnits) > 2500) {
        return toast.error(
          "You can manage only upto 2500 units. To add more units please contact the Foliolens team from our website."
        );
      }
      dispatch(setLoading(true));
      let customer_name = loggedUserData ? `${loggedUserData?.first_name} ${loggedUserData?.last_name} ` : " ";
      const res = await API.graphql(
        graphqlOperation(createFreeSubscription, {
          email: loggedUserData.email,
          priceId: stripePlans.planPrice[0].id,
          name: customer_name,
          units: Number(noOfUnits),
        })
      );

      const stripeRes = JSON.parse(res.data.createFreeSubscription.response);
      const subscriptionObj = {
        id: getId(),
        name: userType,
        description: "",
        amount: 0,
        billing_cycle: stripeRes.plan_interval,
        stripe_plan_id: stripeRes.plan_id,
        stripe_subscription_id: stripeRes.subscription_id,
        stripe_customer_id: stripeRes.customer_id,
        item_id: stripeRes.item_id,
        units: Number(noOfUnits),
        active: 1,
        user_id: loggedUserData.id,
        created_by: loggedUserData.id,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await createRecordTB("PaymentSubscription", subscriptionObj);
      // do not remove await
      await dispatch(
        updateUserFN(
          {
            no_of_units: Number(noOfUnits),
            stripe_subscription_id: stripeRes.subscription_id,
            stripe_customer_id: stripeRes.customer_id,
            user_role: userType,
          },
          true
        )
      );
      dispatch(setLoading(false));
      toast.success("You've been successfully subscribed to Foliolens");
      navigate("/Dashboard", { state: { isOpen: true } });
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error confirming sign up", error);
      toast.error("Something went wrong while creating a payment subscription");
    }
  };

  return (
    <div className="form_screen d-flex flex-wrap h-100">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">How many units do you own?</h3>
          <div>
            <Form.Group className="mb-5 star-field" controlId="formBasicEmail">
              <Form.Control
                type="text"
                placeholder="Your Units"
                onChange={(e) => setNoOfUnits(e.target.value)}
                value={noOfUnits}
              />
            </Form.Group>

            <Button className="w-100" onClick={submit} disabled={Number(noOfUnits) > 0 ? false : true}>
              Next
            </Button>
          </div>
        </div>
      </div>

      <AuthSideBar />
    </div>
  );
}
