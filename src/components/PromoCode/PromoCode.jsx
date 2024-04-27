import React, { useState } from "react";
import { faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Form } from "react-bootstrap";
import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import { API, graphqlOperation } from "aws-amplify";
import { useDispatch } from "react-redux";
import { setLoading } from "../../store/reducer";
import toast from "react-hot-toast";
import styles from "./PromoCode.module.scss";
import { getPromoCode } from "../../graphql/queries";

export default function PromoCode({ setPromoCodeRes }) {
  const dispatch = useDispatch();
  const [isPromoSuccess, setIsPromoSuccess] = useState(false);
  const [isPromoCodeShow, setIsPromoCodeShow] = useState(false);
  const [promoCode, setpromoCode] = useState("");

  const onPromoCode = async () => {
    try {
      dispatch(setLoading(true));
      const res = await API.graphql(
        graphqlOperation(getPromoCode, {
          promoCode: promoCode,
        })
      );
      if (res.data.getPromoCode.status === 200) {
        const promoCodeRes = JSON.parse(res.data.getPromoCode.response);
        setPromoCodeRes({ id: promoCodeRes.id, discount: promoCodeRes.coupon.percent_off });
        setIsPromoCodeShow(false);
        toast.success("Code Accepted.");
        setIsPromoSuccess(true);
        dispatch(setLoading(false));
      } else {
        toast.error("Please enter a valid promo code.");
        console.log("code");
        dispatch(setLoading(false));
      }
    } catch (error) {
      console.log("error confirming sign up", error);
      toast.error("Please enter a valid code");
      dispatch(setLoading(false));
    }
  };

  return (
    <div className={`${styles.promo_code} ab`}>
      <div className="text-center">
        <div className="add-btn pointer align-items-center" onClick={() => setIsPromoCodeShow(true)}>
          {!isPromoCodeShow && !isPromoSuccess && <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>}
          {!isPromoCodeShow && !isPromoSuccess && <strong>Add Promo Code</strong>}
        </div>
      </div>
      {isPromoCodeShow && (
        <div className={`${styles.promo_code_wrapper} text-start`}>
          <h4 className="mb-3 pe-5 title-with-close d-flex justify-content-between">
            Add Promo Code
            <FontAwesomeIcon
              className="inline-last-icon pointer"
              icon={faXmark}
              onClick={() => setIsPromoCodeShow(false)}
            ></FontAwesomeIcon>
          </h4>
          <div>
            <Form.Group className="mb-4" controlId="formBasicEmail">
              <Form.Control
                type="text"
                placeholder="Promo Code"
                onChange={(e) => setpromoCode(e.target.value)}
                value={promoCode}
              />
            </Form.Group>
            <Button disabled={promoCode ? false : true} className="w-100" onClick={() => onPromoCode()}>
              Apply
            </Button>
          </div>
        </div>
      )}
      {isPromoSuccess && (
        <div className="msg-success d-flex align-items-center justify-content-center">
          <FontAwesomeIcon className="x-plus" icon={faCircleCheck}></FontAwesomeIcon>Code Applied Successfully.
        </div>
      )}
    </div>
  );
}
