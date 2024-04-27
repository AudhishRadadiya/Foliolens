import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { API, graphqlOperation } from "aws-amplify";
import { updateStripeUnits } from "../../graphql/mutations";
import moment from "moment";
import { setLoading } from "../../store/reducer";
import { toast } from "react-hot-toast";
import { fetchUser } from "../../Utility/ApiService";

export default function SubscriptionPlan(props) {
  const dispatch = useDispatch();
  const [addUnitModal, setAddUnitModal] = useState(false);
  const [decreaseUnit, setDecreaseUnit] = useState(false);
  const [unitData, setUnitData] = useState({});
  const [increaseUnit, setIncreaseUnit] = useState(0);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setIncreaseUnit(loggedUserData?.no_of_units);
    setDecreaseUnit(false);
  }, [addUnitModal]);

  const fetchData = async () => {
    const response = await getRdsFN("userUsedUnits", {
      userId: loggedUserData?.id,
    });
    const usedUnits = response[0];
    setUnitData(usedUnits);
  };

  const updateUnits = async () => {
    try {
      dispatch(setLoading(true));
      const data = await API.graphql(
        graphqlOperation(updateStripeUnits, {
          subscriptionId: loggedUserData?.stripe_subscription_id,
          units: parseInt(increaseUnit),
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        })
      );
      if (data?.data?.updateStripeUnits?.status === 200) {
        await updateRecordTB("User", {
          id: loggedUserData?.id,
          no_of_units: parseInt(increaseUnit),
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
        dispatch(setLoading(false));
      } else {
        toast.error("You cannot update a subscription that is canceled or incomplete_expired");
        dispatch(setLoading(false));
      }
      dispatch(fetchUser(loggedUserData?.email));
      setAddUnitModal(false);
      dispatch(setLoading(false));
    } catch (err) {
      console.log("Update stripe units Err", err);
      dispatch(setLoading(false));
    }
  };

  return (
    <>
      <div className="card">
        <div className="plan-name">
          <h4 className="d-flex mb-3 lh-base">
            {props?.name}
            <span>{props?.duration}</span>
          </h4>
        </div>
        <div className="plan-price">
          <h3>{props?.price?.split("/")[0]}</h3>
        </div>
        <div className="plan-details mb-2">{props?.info}</div>
        <div className="plan-name">
          <p className="d-flex mb-3 lh-base" style={{ color: "#06122B" }}>
            {props?.units}
          </p>
        </div>
        {props?.addUnit && (
          <div className="plan-name d-flex justify-content-between">
            <h4 className="d-flex mb-3 lh-base" style={{ color: "#8C8C8C", fontWeight: "400" }}>
              {/* {props?.amount} */}
              {/* <span>{props?.baseUnits}</span> */}
              {`Used Units : ${unitData?.used_units}`}
            </h4>
            {props?.addUnit && (
              <div
                className={`add-btn d-inline-flex justify-content-center align-items-center mb-2 pointer`}
                onClick={() => setAddUnitModal(true)}
              >
                <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                <strong>Add More Unit</strong>
              </div>
            )}
          </div>
        )}
      </div>
      <Modal show={addUnitModal} onHide={() => setAddUnitModal(false)} centered className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Add More Units
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          <Row className="text-start">
            <Col>
              <Form.Group className={`mb-3 check ${decreaseUnit ? "is-invalid" : ""} `}>
                <Form.Label>Unit</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Please Enter Unit"
                  value={increaseUnit}
                  onChange={(e) => {
                    setIncreaseUnit(Number(e.target.value));
                    if (Number(e.target.value) < loggedUserData?.no_of_units) {
                      setDecreaseUnit(true);
                    } else {
                      setDecreaseUnit(false);
                    }
                  }}
                />
                <Form.Text className="ms-1" style={{ color: "#DC3545" }}>
                  {decreaseUnit && "Please contact Foliolens help for decreasing the unit."}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Container className="m-0">
            <Row>
              <Col xs={6}>
                <Button className="btn-reset w-100" onClick={() => setAddUnitModal(false)}>
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button type="submit" className=" w-100" disabled={decreaseUnit} onClick={updateUnits}>
                  Save
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
    </>
  );
}
