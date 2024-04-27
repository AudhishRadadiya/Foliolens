import React, { useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { API, graphqlOperation } from "aws-amplify";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";

import SavedCardDetails from "./SavedCardDetails";
import AddPaymentDialog from "./AddPaymentDialog";
import { fetchPaymentMethods, updateRecordTB } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import AddPayment from "./AddPayment";
import { updateStripePaymentMethod } from "../../graphql/mutations";

export default function SavedCards() {
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const paymentMethods = useSelector(({ paymentMethods }) => paymentMethods);

  const onDefaultCardChange = async (card) => {
    try {
      dispatch(setLoading(true));

      await API.graphql(
        graphqlOperation(updateStripePaymentMethod, {
          subscriptionId: loggedUserData.stripe_subscription_id,
          paymentMethodId: card.stripe_paymentmethod_id,
        })
      );

      const card_active = paymentMethods.find((pm) => pm.default_payment_method === 1);
      if (card_active) {
        await updateRecordTB("PaymentMethod", {
          id: card_active?.id,
          default_payment_method: 0,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      }
      await updateRecordTB("PaymentMethod", {
        id: card?.id,
        default_payment_method: 1,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      dispatch(fetchPaymentMethods());
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      console.log(error, "err default");
      toast.error("Something went wrong");
    }
  };

  const deletePaymentMethode = async (card) => {
    try {
      dispatch(setLoading(true));

      await updateRecordTB("PaymentMethod", {
        id: card.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      dispatch(fetchPaymentMethods());
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      console.log("payment method not deleted", error);
      toast.error("Something went wrong");
    }
  };

  const handleClose = () => setShow(false);

  return (
    <div>
      {paymentMethods?.length > 0 ? (
        <div>
          <h4 className="mt-5 mb-3 lh-base">Saved Cards</h4>
          <div className="save-cards">
            <div className="save-card-header">
              <Row>
                <Col md="6">Card Name</Col>
                <Col md="2">Card Number</Col>
                <Col md="2">Expiry</Col>
                <Col md="1">Default</Col>
              </Row>
            </div>

            {paymentMethods.map((item, i) => (
              <SavedCardDetails
                key={i}
                item={item}
                deletePaymentMethode={deletePaymentMethode}
                onDefaultCardChange={onDefaultCardChange}
              />
            ))}
            {loggedUserData.user_role !== "Property Owner" && (
              <div className="add-btn mb-5">
                <span className="pointer" onClick={() => setShow(true)}>
                  <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                  <strong> Add Payment Method</strong>
                </span>
              </div>
            )}
          </div>
          <AddPaymentDialog show={show} handleClose={handleClose} />
        </div>
      ) : (
        <AddPayment />
      )}
    </div>
  );
}
