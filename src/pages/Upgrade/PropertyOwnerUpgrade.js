import React, { useState, useEffect } from "react";
// import { faCircleExclamation, faListCheck } from "@fortawesome/free-solid-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import { createRecordTB, fetchStripePlans } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import { getId, ROLES } from "../../Utility";
import { getRdsData, getStripeSubscription } from "../../graphql/queries";
import env from "../../envFile";

export default function PropertyOwnerUpgrade() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const [show, setShow] = useState(false);
  const [datePeriod, setDatePeriod] = useState();
  const [paymentSub, setPaymentSub] = useState({});
  const [noOfUnits, setNoOfUnits] = useState("");
  const stripePlans = useSelector(({ stripePlans }) => stripePlans);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  // const { planPrice = [] } = stripePlans;
  const { state } = useLocation();

  useEffect(() => {
    if (loggedUserData && loggedUserData?.stripe_subscription_id) {
      filterPayment();
      onGetStripeSubscription();
      setNoOfUnits(loggedUserData.no_of_units);
    }
  }, [loggedUserData]);

  useEffect(() => {
    if (state?.userType) {
      dispatch(fetchStripePlans(ROLES.PropertyOwner));
    }
  }, [state]);

  const onGetStripeSubscription = async () => {
    dispatch(setLoading(true));
    await API.graphql(
      graphqlOperation(getStripeSubscription, {
        subscriptionId: loggedUserData.stripe_subscription_id,
      })
    )
      .then((res) => {
        let resData = JSON.parse(res.data.getStripeSubscription.response);
        let endDate = moment(new Date(resData.current_period_end * 1000)).format("YYYY-MM-DD");

        setDatePeriod(endDate);
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log("get subscription data err", err);
        dispatch(setLoading(false));
      });
  };

  const filterPayment = async () => {
    dispatch(setLoading(true));
    await API.graphql(
      graphqlOperation(getRdsData, {
        name: "tbSelect",
        data: JSON.stringify({
          source: "psub",
          usrId: loggedUserData.id,
          act: 1,
        }),
      })
    )
      .then((res) => {
        let data = res.data.getRdsData.response;
        let dataRes = JSON.parse(data);
        // let payRes = dataRes[0].item_id;
        // setPay(payRes);
        setPaymentSub(dataRes[0]);
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log(err, "err subscription");
        dispatch(setLoading(false));
      });
  };

  const filterDowngrades = async () => {
    if (Number(noOfUnits) > 2500) {
      return toast.error(
        "You can manage only upto 2500 units. To add more units please contact the Foliolens team from our website."
      );
    }
    dispatch(setLoading(true));
    await API.graphql(
      graphqlOperation(getRdsData, {
        name: "tbSelect",
        data: JSON.stringify({
          source: "sdown",
          strSubId: loggedUserData.stripe_subscription_id,
          act: 1,
        }),
      })
    )
      .then((res) => {
        let data = res.data.getRdsData.response;
        let dataRes = JSON.parse(data);
        if (dataRes.length === 0) {
          onDowngradeSubscription();
        } else {
          toast.error("You have already one downgrade subscription in process");
          dispatch(setLoading(false));
        }
      })
      .catch((err) => {
        console.log(err, "err subscription");
        dispatch(setLoading(false));
      });
  };

  const onDowngradeSubscription = async () => {
    dispatch(setLoading(true));
    let tomorrow = moment().add(1, "days");
    let LDate = moment(new Date(tomorrow)).format("YYYY-MM-DD");
    let downgradeObj = {
      id: getId(),
      user_id: loggedUserData.id,
      stripe_subscription_id: loggedUserData.stripe_subscription_id,
      current_price_id: paymentSub.stripe_plan_id,
      current_item_id: paymentSub.item_id,
      current_period_end: env.DOWNGRADE_PERIOD_END === false ? LDate : datePeriod,
      current_quantity: loggedUserData.no_of_units,
      downgraded_price_id: stripePlans.planPrice[0].id,
      active: 1,
      stripe_status: "PENDING",
      downgraded_quantity: Number(noOfUnits),
      created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    await createRecordTB("StripeDowngrade", downgradeObj)
      .then((res) => {
        toast.success(
          `You’ve been successfully updated subscription to Foliolens You can use your premium tier till ${
            env.DOWNGRADE_PERIOD_END === false ? LDate : datePeriod
          }`
        );
        dispatch(setLoading(false));
        navigate("/Subscription");
      })
      .catch((err) => {
        console.log(err, "error create downgrade stripe subscription ");
        dispatch(setLoading(false));
      });
  };
  // const handleClose = () => setShow(false);
  // const handleShow = () => setShow(true);

  return (
    <div className="form_screen d-flex flex-wrap h-100">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">
            How many units do you own?
            {/* <FontAwesomeIcon
              className="icon-right pointer"
              onClick={handleShow}
              icon={faCircleExclamation}
            ></FontAwesomeIcon> */}
          </h3>
          <div>
            <Form.Group className="mb-5 star-field" controlId="formBasicEmail">
              <Form.Control
                type="text"
                placeholder="Your Units"
                onChange={(e) => setNoOfUnits(e.target.value)}
                value={noOfUnits}
              />
              {/* <label>Your Units</label> */}
            </Form.Group>

            <Button className="w-100" onClick={filterDowngrades} disabled={Number(noOfUnits) > 0 ? false : true}>
              Next
            </Button>
          </div>
        </div>
      </div>

      <AuthSideBar />
    </div>
  );
}
