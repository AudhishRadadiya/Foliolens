import React, { useEffect, useState } from "react";

import { Button, Form, Modal, Card } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { API, graphqlOperation } from "aws-amplify";

import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import PromoCode from "../../components/PromoCode/PromoCode";
import { setLoading } from "../../store/reducer";
import { createRecordTB, fetchStripePlans, updateUserFN, updateRecordTB } from "../../Utility/ApiService";
import { createStripeQuote, updateStripeSubscription } from "../../graphql/mutations";
import moment from "moment";
import { getRdsData, getStripeSubscription } from "../../graphql/queries";
import env from "../../envFile";
import { checkSecondUser, formatNumber, getId, ROLES } from "../../Utility";

export default function OtherUserUpgrade() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [noOfUnits, setNoOfUnits] = useState("1");
  const [promoCodeRes, setPromoCodeRes] = useState({ id: "", discount: 0 });
  const [meteredPlans, setMeteredPlans] = useState([]);

  const [pay, setPay] = useState();
  const [datePeriod, setDatePeriod] = useState();
  const [paymentSub, setPaymentSub] = useState({});
  const [selectedPlan, setSelectedPlan] = useState({
    planId: "",
    billingCycle: "",
    amount: "",
  });
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const stripePlans = useSelector(({ stripePlans }) => stripePlans);
  const { planPrice = [] } = stripePlans;
  const paymentMethods = useSelector(({ paymentMethods }) => paymentMethods);
  const { state } = useLocation();

  useEffect(() => {
    if (state?.userType) {
      dispatch(fetchStripePlans(state?.userType));
    }
  }, [state]);

  useEffect(() => {
    getAmount();
  }, [noOfUnits, planPrice]);

  useEffect(() => {
    if (loggedUserData && loggedUserData?.stripe_subscription_id) {
      filterPayment();
      onGetStripeSubscription();
      setNoOfUnits(loggedUserData.no_of_units);
    }
  }, [loggedUserData]);

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
        //  let resData = dataRes.filter(d => d.active === 1);
        let payRes = dataRes[0].item_id;
        setPay(payRes);
        setPaymentSub(dataRes[0]);
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log(err, "err subscription");
        dispatch(setLoading(false));
      });
  };

  const submit = async () => {
    try {
      if (Number(noOfUnits) > 2500) {
        return toast.error(
          "You can manage only upto 2500 units. To add more units please contact the Foliolens team from our website."
        );
      }
      // await dispatch(
      //   updateUserFN({
      //     no_of_units: Number(noOfUnits),
      //   })
      // );
      navigate("/AddPayMethod", {
        state: {
          planId: selectedPlan.planId,
          promo_code_id: promoCodeRes.id ? promoCodeRes.id : "null",
          units: Number(noOfUnits),
          billingCycle: selectedPlan.billingCycle,
          amount: selectedPlan.amount,
          userType: state?.userType,
          planUpgrade: true,
          itemId: pay,
          paymentSub: paymentSub,
        },
      });
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error confirming sign up", error);
      toast.error(error.message || error);
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

  const onUpdateSubscription = async () => {
    try {
      if (Number(noOfUnits) > 2500) {
        return toast.error(
          "You can manage only upto 2500 units. To add more units please contact the Foliolens team from our website."
        );
      }
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(updateStripeSubscription, {
          subscriptionId: loggedUserData.stripe_subscription_id,
          priceId: selectedPlan.planId,
          units: Number(noOfUnits),
          promoCodeId: promoCodeRes.id ? promoCodeRes.id : "null",
          itemId: pay,
        })
      )
        .then((res) => {
          let status = res.data.updateStripeSubscription.status;
          let response = res.data.updateStripeSubscription.response;
          if (status === 200) {
            let stripeResponse = JSON.parse(response);
            onUpdatePayment(
              stripeResponse.plan_name,
              stripeResponse.plan_interval,
              stripeResponse.amount_paid / 100,
              stripeResponse.price_id,
              stripeResponse.subscription_id,
              stripeResponse.item_id,
              stripeResponse.units
            );
          } else {
            dispatch(setLoading(false));
            toast.error(response);
            //   Alert.alert(response, "", [{ text: "ok" }]);
          }
        })
        .catch((err) => {
          console.log(err, "error update stripe subscription ");
          dispatch(setLoading(false));
        });
    } catch (err) {
      console.log(err, "err");
    }
  };

  const onUpdatePayment = async (name, interval, amountPaid, pId, sId, iId, unit) => {
    let updatePayObj = {
      id: paymentSub.id,
      name: name,
      billing_cycle: interval,
      amount: promoCodeRes.discount ? parseInt(getDiscount(amountPaid, promoCodeRes.discount)) : amountPaid,
      card_type: paymentSub.card_type,
      card_last4: parseInt(paymentSub.card_last4),
      stripe_plan_id: pId,
      stripe_customer_id: paymentSub.stripe_customer_id,
      stripe_subscription_id: sId,
      user_id: loggedUserData.id,
      active: 1,
      expiry_month: parseInt(paymentSub.expiry_month),
      item_id: iId,
      units: unit,
      expiry_year: parseInt(paymentSub.expiry_year),
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      created_by: loggedUserData.id,
      paid_subscription_start_date: moment().format("YYYY-MM-DD"),
      paid_subscription_end_date: "1000-01-01",
    };
    dispatch(setLoading(true));

    await updateRecordTB("PaymentSubscription", updatePayObj)
      .then((res) => {
        onUpdatingUser(res.units, res.stripe_subscription_id);
      })
      .catch((err) => {
        console.log(err, "error update payment subscription ");
        dispatch(setLoading(false));
      });
  };

  const onUpdatingUser = async (unit, subId) => {
    let updatingUserObj = {
      id: loggedUserData.id,
      no_of_units: unit,
      stripe_subscription_id: subId,
      user_role: state?.userType,
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    dispatch(setLoading(true));
    await updateRecordTB("User", updatingUserObj)
      .then((res) => {
        toast.success("You’ve been successfully upgraded subscription to Foliolens");
        navigate("/Subscription");
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log(err, "subscription user error update");
        dispatch(setLoading(false));
      });
  };

  const filterDowngrades = async () => {
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
    try {
      if (Number(noOfUnits) > 2500) {
        return toast.error(
          "You can manage only upto 2500 units. To add more units please contact the Foliolens team from our website."
        );
      }
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
        downgraded_price_id: selectedPlan.planId,
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
    } catch (err) {
      console.log(err, "err1");
    }
  };

  return (
    <div className="form_screen d-flex flex-wrap h-100">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">
            How many units do you manage?
            {/* <FontAwesomeIcon className="icon-right pointer" onClick={handleShow} icon={faCircleExclamation} /> */}
          </h3>
          <div>
            <Form.Group className="mb-5">
              <Form.Control
                type="text"
                placeholder="Your Units"
                onChange={(e) => setNoOfUnits(e.target.value)}
                value={noOfUnits}
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
                        {/* {item.interval === "year" ? "yr" : "mo"} */}
                        {item.interval == "year" && promoCodeRes.discount ? (
                          <span className="discount">
                            <em>{promoCodeRes.discount + 20}% discount</em>
                          </span>
                        ) : item.interval == "month" && promoCodeRes.discount ? (
                          <span className="discount">
                            <em>{promoCodeRes.discount}% discount</em>
                          </span>
                        ) : item.interval == "year" && !promoCodeRes.discount ? (
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
              {/* {state?.userType === "Landlord" ? (
                <p className="text-grey mb-4">
                  Price Increases only $2 per additional unit after 25. Additional discount for annual plan.
                </p>
              ) : (
                <p className="text-grey mb-4">
                  Price Increases only $1.50 per additional unit after 100. Additional discount for annual plan.
                </p>
              )} */}
              <PromoCode setPromoCodeRes={setPromoCodeRes} />
            </div>
            {loggedUserData.stripe_subscription_id !== null && paymentMethods.length === 0 ? (
              <Button
                type="submit"
                className="w-100"
                onClick={submit}
                disabled={selectedPlan?.planId !== "" && noOfUnits > 0 ? false : true}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-100"
                onClick={() => {
                  if (loggedUserData.user_role === ROLES.PropertyOwner || loggedUserData.user_role === ROLES.Landlord) {
                    onUpdateSubscription();
                  } else {
                    filterDowngrades();
                  }
                }}
                disabled={selectedPlan?.planId !== "" && noOfUnits > 0 ? false : true}
              >
                Upgrade
              </Button>
            )}
          </div>
          {/* <p className="text-center pt-4 mb-0">Try 14 days For FREE</p> */}
        </div>
      </div>

      <AuthSideBar />

      {/* <Modal className="modal-v1 border-radius-16" centered show={show} onHide={handleClose}>
        <Modal.Header>
          <Modal.Title as="h3">How our Pricing Works</Modal.Title>
        </Modal.Header>
        {state?.userType === "Landlord" ? (
          <Modal.Body>
            <p>
              Our plan defaults to $25/mo (or $240/yr if paid annually) for users with up to 25 units managed. For every
              additional unit after 25, the monthly price increases by $2/unit.
            </p>
            <p>
              For example, 22 units would be the default $25/mo. 27 units would be $29/mo ($25/mo standard rate for up
              to 25 units + $2/mo x 2 units above 25 units).
            </p>
          </Modal.Body>
        ) : (
          <Modal.Body>
            <p>
              Our plan defaults to $100/mo (or $960/yr if paid annually) for users with up to 100 units managed. For
              every additional unit after 100, the monthly price increase by $1.50/unit.
            </p>
            <p>
              For example, 90 units would be the default $100/mo. 104 units would be $106/mo ($100/mo standard rate for
              up to 100 units + $1.50/mo x 4 units above 100 units).
            </p>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button className="w-100" onClick={handleClose}>
            Got It!
          </Button>
        </Modal.Footer>
      </Modal> */}
    </div>
  );
}
