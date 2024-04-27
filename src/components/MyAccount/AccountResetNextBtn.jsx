import React, { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import toast from "react-hot-toast";
import { API, graphqlOperation } from "aws-amplify";
import { useDispatch, useSelector } from "react-redux";

import { setLoading } from "../../store/reducer";
import { deleteUserAccountV2 } from "../../graphql/mutations";
import { sendHubspotEmail } from "../../graphql/queries";
import envFile from "../../envFile";
// import { getCurrentUser, getId } from "../../Utility";
import awsmobile from "../../aws-exports";
import { getRdsFN } from "../../Utility/ApiService";
import { logOut } from "../../Utility";

export default function AccountResetNextBtn() {
  const [show, setShow] = useState(false);
  const [disableDelete, setDisableDelete] = useState(false);
  const dispatch = useDispatch();

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    disabledDelete();
  }, []);

  const disabledDelete = async () => {
    try {
      dispatch(setLoading(true));
      const parsedResponse = await getRdsFN("tbSelect", {
        source: "duser",
        usrId: loggedUserData?.id,
      });
      if (parsedResponse.length > 0) {
        setDisableDelete(true);
      } else {
        setDisableDelete(false);
      }
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error disabledDelete", error);
      setDisableDelete(false);
      dispatch(setLoading(false));
    }
  };

  const deleteAccount = async () => {
    try {
      dispatch(setLoading(true));
      // const someDate = new Date();
      // const numberOfDaysToAdd = envFile.USER_DELETE_DAYS;
      // const deletionDate = someDate.setDate(someDate.getDate() + numberOfDaysToAdd);
      // const currentAuthenticaedUser = await getCurrentUser();

      const deleteObj = {
        userPoolId: awsmobile.aws_user_pools_id,
        username: loggedUserData.cognito_user_id,
        userId: loggedUserData.id,
        subscriptionId: loggedUserData.stripe_subscription_id,
      };
      await API.graphql(graphqlOperation(deleteUserAccountV2, deleteObj));
      await API.graphql(
        graphqlOperation(sendHubspotEmail, {
          id: loggedUserData.id,
          role: "User",
          code: "DACCOUNT",
          data: JSON.stringify({
            days: envFile.USER_DELETE_DAYS,
          }),
        })
      );
      disabledDelete();
      await logOut();
      dispatch(setLoading(false));
      handleClose();
    } catch (error) {
      console.log("Delete Account ", error);
      toast.error("Something went wrong while deleting \nyour account");
      dispatch(setLoading(false));
    }
  };

  return (
    <div>
      <Row className="pt-5">
        <Col>
          <Button
            className="btn-md btn-delete"
            onClick={() => {
              if (disableDelete) {
                alert("Your request for closing this account is in progress");
              } else {
                handleShow();
              }
            }}
          >
            Delete Account
          </Button>
        </Col>
        <Col className="text-end">
          <Button type="submit" className="btn-md">
            Save
          </Button>
        </Col>
      </Row>

      <Modal show={show} onHide={handleClose} centered className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Delete account?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          {"Are you sure you want to Delete Your Account? It will be deleted and can't be undone."}
        </Modal.Body>
        <Modal.Footer>
          <Container className="m-0">
            <Row>
              <Col xs={6}>
                <Button className="btn-reset w-100" onClick={handleClose}>
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="btn-delete w-100" onClick={deleteAccount}>
                  Delete
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
