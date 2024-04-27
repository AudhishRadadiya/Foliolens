import React, { useEffect, useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { setLoading } from "../../store/reducer";
import { updateStripeSubscription } from "../../graphql/mutations";
import { getStripePlans, getStripePrices } from "../../graphql/queries";
import { fetchUser, updateRecordTB } from "../../Utility/ApiService";
import { ROLES } from "../../Utility";

export default function SubscriptionUpgradeBtns({ stripeStatus, paymentDetails }) {
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const navigate = useNavigate();
  const [planData, setPlanData] = useState();

  useEffect(() => {
    onGetPlans();
  }, []);

  const onGetPlans = async () => {
    await API.graphql(graphqlOperation(getStripePlans))
      .then((res) => {
        let data = res?.data?.getStripePlans?.response;
        let parsedData = JSON.parse(data);
        let parsedPlan = parsedData?.data;
        let data1 = parsedPlan?.find((p) => {
          return p?.metadata?.user_type === "Property Owner";
        });
        if (data1) {
          API.graphql(
            graphqlOperation(getStripePrices, {
              productId: data1?.id,
            })
          )
            .then((res) => {
              let Response = JSON.parse(res.data.getStripePrices.response);
              setPlanData(Response[0]);
            })
            .catch((err) => {
              console.log("err", err);
            });
        }
      })
      .catch((err) => {
        console.log(err, "err plans");
      });
  };

  const onUpdateSubscription = async () => {
    dispatch(setLoading(true));
    await API.graphql(
      graphqlOperation(updateStripeSubscription, {
        subscriptionId: loggedUserData.stripe_subscription_id,
        priceId: planData.id,
        units: 10,
        promoCodeId: "null",
        itemId: paymentDetails[0].item_id,
      })
    )
      .then(async (res) => {
        if (res.data.updateStripeSubscription.status === 200) {
          updateRecordTB("User", {
            id: loggedUserData.id,
            user_role: "Property Owner",
            no_of_units: 10,
            last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          })
            .then(async (res) => {
              updateRecordTB("PaymentSubscription", {
                id: paymentDetails[0].id,
                item_id: stripeStatus.items.data[0].id,
                units: 10,
                amount: 0,
                last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
                paid_subscription_end_date: moment().format("YYYY-MM-DD"),
              })
                .then((res) => {
                  dispatch(fetchUser(loggedUserData?.email));

                  handleClose();
                  dispatch(setLoading(false));
                })
                .catch((err) => {
                  console.log("payment err ", err);
                  dispatch(setLoading(false));
                });
            })
            .catch((err) => {
              console.log(err, "Err user");
              dispatch(setLoading(false));
            });
        } else {
          Alert.alert("Something went wrong, please try again", "", [
            {
              text: "Ok",
              onPress: () => dispatch(setLoading(false)),
            },
          ]);
        }
      })
      .catch((err) => {
        console.log(err, "err");
        dispatch(setLoading(false));
      });
  };
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div>
      <Row className="pt-2">
        <Col>
          {loggedUserData.user_role !== "Property Owner" && (
            <Button className="btn-md btn-delete" onClick={handleShow}>
              Cancel Subscription
            </Button>
          )}
        </Col>
        <Col className="text-end">
          <Button
            className="btn-md btn-next"
            onClick={() => {
              navigate("/WhatYouDo", {
                state: { upgrade: loggedUserData?.user_role === ROLES.Collaborator ? false : true },
              });
            }}
          >
            Upgrade
          </Button>
        </Col>
      </Row>

      <Modal show={show} onHide={handleClose} centered className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Subscription Cancellation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">Are you sure you want to cancel?</Modal.Body>
        <Modal.Footer>
          <Container className="m-0">
            <Row>
              <Col xs={6}>
                <Button className="btn-reset w-100" onClick={handleClose}>
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="btn-delete w-100" onClick={onUpdateSubscription}>
                  Yes
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
