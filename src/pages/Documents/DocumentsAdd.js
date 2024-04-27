import React, { useEffect, useState } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useLocation, useNavigate } from "react-router-dom";

import Container from "../../components/Layout/Container";
import { useSelector } from "react-redux";

export default function DocumentsAdd() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(true);
  const { state } = useLocation();
  const allProperties = useSelector(({ allProperties }) => allProperties);

  useEffect(() => {
    setTimeout(() => {
      setIsScanning(false);
    }, 2000);
  }, []);

  return (
    <Container title="Add documents" isBack>
      <div className="document-progress">
        {isScanning ? (
          <div>
            <div className="text-center text-grey mb-3">Document translation in progress…</div>

            <div className="card mb-3">
              <h4>Address</h4>
              <ProgressBar now={80} />
            </div>

            <div className="card mb-3">
              <h4>Category</h4>
              <ProgressBar now={60} />
            </div>
          </div>
        ) : (
          <div>
            {allProperties?.length > 0 ? (
              <div className="card mb-3 progress-completed">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15.7071 10.7071C16.0976 10.3166 16.0976 9.68342 15.7071 9.29289C15.3166 8.90237 14.6834 8.90237 14.2929 9.29289L11 12.5858L9.70711 11.2929C9.31658 10.9024 8.68342 10.9024 8.29289 11.2929C7.90237 11.6834 7.90237 12.3166 8.29289 12.7071L10.2929 14.7071C10.6834 15.0976 11.3166 15.0976 11.7071 14.7071L15.7071 10.7071Z"
                    fill="#4FB980"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z"
                    fill="#4FB980"
                  />
                </svg>
                Processing completed. Proceed to confirm or edit
              </div>
            ) : (
              <div className="card mb-3 text-center">
                You can not proceed the document translation without any property
              </div>
            )}

            <div className="pt-3">
              {allProperties?.length > 0 ? (
                <Row>
                  {/* <Col xs={6}>
                    <Button
                      className="btn-reset w-100"
                      onClick={() =>
                        navigate("/DocumentReview", {
                          state: state,
                        })
                      }
                    >
                      Edit
                    </Button>
                  </Col> */}
                  <Col xs={12} className="d-flex justify-content-center">
                    <Button
                      className="w-75"
                      onClick={() =>
                        navigate("/DocumentReview", {
                          state: { data: state, edit: true },
                        })
                      }
                    >
                      Review
                    </Button>
                  </Col>
                </Row>
              ) : (
                <Row>
                  <Col xs={12}>
                    <Button
                      className="btn-reset w-100"
                      onClick={() =>
                        navigate("/Documents", {
                          state: { tab: "inProcess" },
                        })
                      }
                    >
                      Ok
                    </Button>
                  </Col>
                </Row>
              )}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
