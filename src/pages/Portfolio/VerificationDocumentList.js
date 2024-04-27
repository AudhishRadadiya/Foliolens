import React, { useEffect, useState } from "react";
import { Button, Card, Col, Modal, Row } from "react-bootstrap";
import Container from "../../components/Layout/Container";
import { useLocation, useNavigate } from "react-router-dom";
import { API, graphqlOperation } from "aws-amplify";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";

import AppButton from "../../components/Button/Button";
import { fetchDwollaDocuments, getDwollaDocumentStatus } from "../../graphql/queries";
import { formatDate } from "../../Utility";
import { setLoading } from "../../store/reducer";

const VerificationDocumentList = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [documentsData, setDocuments] = useState([]);
  const [documentHint, setDocumentHint] = useState({});
  const [docInstructionModal, setDocInstructionModal] = useState(false);
  const { isOwner, dwolla_beneficial_owner_id, dwolla_customer_id } = state;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isOwner) {
      setDocumentHint("Upload document for owner verification");
    } else {
      if (dwolla_customer_id) {
        getDocumentStatus();
      }
    }
  }, [state]);

  const getDocumentStatus = async () => {
    try {
      dispatch(setLoading(true));
      const res = await API.graphql(
        graphqlOperation(getDwollaDocumentStatus, {
          customerId: dwolla_customer_id,
        })
      );
      if (res?.data?.getDwollaDocumentStatus?.status === 200) {
        setDocumentHint(JSON.parse(res?.data?.getDwollaDocumentStatus?.response));
      }
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const fetchData = async () => {
    try {
      dispatch(setLoading(true));
      let res = await API.graphql(
        graphqlOperation(fetchDwollaDocuments, {
          customerId: isOwner ? dwolla_beneficial_owner_id : dwolla_customer_id,
          owner: isOwner ? 1 : 0,
        })
      );
      res = res.data.fetchDwollaDocuments;
      if (res.status === 200) {
        setDocuments(JSON.parse(res?.response));
      }
      dispatch(setLoading(false));
    } catch (error) {
      console.log(error);
      toast.error("Error while fetch the data");
      dispatch(setLoading(false));
    }
  };

  return (
    <>
      <Container title={"Account Verification Documents"} docInstruction={() => setDocInstructionModal(true)} isBack>
        <div className="float-end d-flex flex-column flex-lg-row">
          <AppButton
            type="button"
            classes="no-img ms-0 ms-lg-3"
            title="Add Document"
            onClick={() =>
              navigate("/PortfolioDocumentVerify", { state: { ...state, documentHint: documentHint?.requiredDoc } })
            }
          />
        </div>
        <div>
          <div>
            {documentHint?.rejectedMsg?.length > 0 && (
              <div>
                <div className="h6 fw-bold">Your document was rejected due to following reasons:</div>
                {documentHint?.rejectedMsg.map((item) => {
                  return (
                    <ul>
                      <li>{item}</li>
                    </ul>
                  );
                })}
              </div>
            )}
            {documentHint?.requiredDoc && <div className="h6 mb-4 fw-bold">{documentHint?.requiredDoc}</div>}
          </div>
          <div className="portfolios grid">
            {documentsData.length > 0 &&
              documentsData.map((doc_data, i) => (
                <div key={i}>
                  <Card className="portfolio-card">
                    <Card.Body className="pointer">
                      <div className="mb-2 card-subtitle">
                        <span>
                          <b>Document Name: </b> {doc_data.name}
                        </span>
                      </div>
                      <div className="mb-2 card-subtitle">
                        <span>
                          <b>Status: </b>

                          {doc_data.status}
                        </span>
                      </div>
                      <div className="mb-2 card-subtitle">
                        <span>
                          <b>Date: </b>
                          {formatDate(doc_data.date)}
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
          </div>
          {documentsData.length === 0 && (
            <div className="empty text-center py-5">
              <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
            </div>
          )}
        </div>
      </Container>
      <Modal
        show={docInstructionModal}
        onHide={() => setDocInstructionModal(false)}
        className="modal-v1 border-radius-16"
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100"></Modal.Title>
        </Modal.Header>
        <Modal.Body className="mb-3">
          <p>
            Customer Identification Program (CIP), which every financial institution is required by U.S. law to
            implement. CIP includes collecting documentation and validating information about the identity of customers
            opening bank accounts on our platform. When a customer successfully completes CIP verification and adds a
            bank account, that user is created as a Verified Customer on our platform and is now able to send and
            receive funds.
          </p>
          <div>
            Through our platform, we gather required personal information (and banking information) from our customers
            and then pass the information to our partner (Dwolla) to fulfill our requirements for identity verification.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Row className="w-100">
            <Col xs={12}>
              <Button className="btn-reset w-100" onClick={() => setDocInstructionModal(false)}>
                Ok
              </Button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default VerificationDocumentList;
