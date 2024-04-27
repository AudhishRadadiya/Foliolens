import React from "react";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Link, useNavigate } from "react-router-dom";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { deleteRdsData } from "../../graphql/mutations";
import { setLoading } from "../../store/reducer";
import { API, graphqlOperation } from "aws-amplify";
import { fetchInProgressDocsDocuments, fetchPropertyDocuments, updateRecordTB } from "../../Utility/ApiService";
import { useState } from "react";
import { Button, Container } from "react-bootstrap";
import ClipLoader from "react-spinners/ClipLoader";
import toast from "react-hot-toast";

export default function DocumentGroupCard({ isFolderView, item, counts, inProcess = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const deleteDocument = async () => {
    if (inProcess) {
      dispatch(setLoading(true));
      let deleteObj = {
        id: item.id,
        user_id: loggedUserData.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };
      await updateRecordTB("UserDocument", deleteObj)
        .then((res) => {
          dispatch(fetchInProgressDocsDocuments());
          setShow(false);
          dispatch(setLoading(false));
        })
        .catch((err) => {
          console.log("deleted document err", err);
          dispatch(setLoading(false));
        });
    } else if (isFolderView) {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(deleteRdsData, {
          name: "deletePropertyDocumentFolder",
          data: JSON.stringify({
            userId: loggedUserData.id,
            propertyId: item.property_type_selected,
            documentTypeSelected: item.document_type_selected,
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
          }),
        })
      )
        .then((res) => {
          dispatch(fetchPropertyDocuments());
          setShow(false);
          dispatch(setLoading(false));
        })
        .catch((err) => {
          console.log(err, "delete folder err");
          dispatch(setLoading(false));
        });
    } else {
      dispatch(setLoading(true));
      await updateRecordTB("PropertyDocument", {
        id: item.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      })
        .then((res) => {
          dispatch(fetchPropertyDocuments());
          setShow(false);
          dispatch(setLoading(false));
        })
        .catch((err) => {
          console.log(err, "delete doc err");
          dispatch(setLoading(false));
        });
    }
  };

  if (isFolderView) {
    return (
      <div className="position-relative">
        <Card
          className="document-card flex-row align-items-center pb-3 pointer"
          onClick={() => navigate("/DocumentsDetail", { state: { item } })}
        >
          <div className="icon-img">
            <Card.Img src={require("../../Assets/images/img-documents.svg").default} />
          </div>
          <Card.Body className="py-0">
            <Card.Title as="h4">{item?.document_type}</Card.Title>
            <Card.Text>{item?.count} documents</Card.Text>
          </Card.Body>
        </Card>
        <img
          src={require("../../Assets/images/icon-delete.svg").default}
          alt=""
          className="position-absolute top-0 end-0 pointer"
          onClick={() => {
            if (item?.created_by !== loggedUserData?.id && item?.permission === "View Only") {
              toast.error("You have been permitted to View Only Permission");
            } else {
              setShow(true);
            }
          }}
        />
        <Modal show={show} onHide={() => setShow(false)} className="modal-v1 border-radius-16">
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              Delete Folder?
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="text-center mb-3">
            Are you sure you want to delete this folder? This action cannot be undone.
          </Modal.Body>

          <Modal.Footer>
            <Container className="m-0">
              <Row>
                <Col xs={6}>
                  <Button className="btn-reset w-100" onClick={() => setShow(false)}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button className="w-100" onClick={() => deleteDocument()}>
                    Delete
                  </Button>
                </Col>
              </Row>
            </Container>
          </Modal.Footer>
        </Modal>
      </div>
    );
  } else {
    return (
      <>
        <div className="file-card">
          <div className="item">
            <div className="document-file-card">
              {inProcess && item?.document_status !== "STARTED" ? (
                <div className="doc-successIcon">
                  <FontAwesomeIcon icon={faCircle} />
                </div>
              ) : (
                <div className="spinner">
                  <ClipLoader color="#c0c0c0" height={"20%"} width={"20%"} />
                </div>
              )}
              <div
                className="pointer"
                onClick={() => {
                  if (inProcess) {
                    if (item?.document_status !== "STARTED") {
                      navigate("/DocumentsAdd", { state: item });
                    }
                  } else {
                    navigate("/DocumentsPropertyDetails", { state: item });
                  }
                }}
                style={{ opacity: item?.document_status === "STARTED" ? "50%" : "100%" }}
              >
                {item && item.document_name?.split(".")[1] === "pdf" ? (
                  <Document
                    className="pdfView"
                    file={{
                      url: item?.url,
                    }}
                  >
                    <Page pageNumber={1} width={180} />
                  </Document>
                ) : (
                  <div className="pdfView">
                    <img src={item?.url} />
                  </div>
                )}
              </div>
              <div className="name">
                {item?.name}
                <br />
                {inProcess && <span style={{ fontSize: "11px" }}>{`STATUS:- ${item?.document_status}`}</span>}
              </div>

              <img
                src={require("../../Assets/images/icon-delete.svg").default}
                alt=""
                className="position-absolute top-0 end-0 pointer"
                onClick={() => {
                  if (item?.created_by !== loggedUserData?.id && item?.permission === "View Only") {
                    toast.error("You have been permitted to View Only Permission");
                  } else {
                    setShow(true);
                  }
                }}
              />
            </div>
          </div>
        </div>
        <Modal show={show} onHide={() => setShow(false)} className="modal-v1 border-radius-16">
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              Delete Document?
            </Modal.Title>
          </Modal.Header>
          {inProcess ? (
            <Modal.Body className="text-center mb-3">
              Are you sure you want to delete this user document? This action cannot be undone.
            </Modal.Body>
          ) : (
            <Modal.Body className="text-center mb-3">
              Are you sure you want to delete this property document? This action cannot be undone.
            </Modal.Body>
          )}
          <Modal.Footer>
            <Container className="m-0">
              <Row>
                <Col xs={6}>
                  <Button className="btn-reset w-100" onClick={() => setShow(false)}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button className="w-100" onClick={() => deleteDocument()}>
                    Delete
                  </Button>
                </Col>
              </Row>
            </Container>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}
