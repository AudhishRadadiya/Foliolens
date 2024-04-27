import React, { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Link, useNavigate } from "react-router-dom";
import { fetchInProgressDocsDocuments, fetchPropertyDocuments, updateRecordTB } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

import { deleteRdsData } from "../../graphql/mutations";
import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";
import { Button, Container, Modal } from "react-bootstrap";
import toast from "react-hot-toast";

export default function DocumentListCard({ isFolderView, item, document_type, inProcess }) {
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
          // console.log("deleted document successfully list", res);
          dispatch(fetchInProgressDocsDocuments());
          setShow(false);
          dispatch(setLoading(false));
        })
        .catch((err) => {
          console.log("deleted document err", err);
          dispatch(setLoading(false));
        });
    } else if (!isFolderView) {
      dispatch(setLoading(true));
      await updateRecordTB("PropertyDocument", {
        id: item.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      })
        .then((res) => {
          // console.log(res, "delete prop list doc res");
          dispatch(fetchPropertyDocuments());
          setShow(false);
          dispatch(setLoading(false));
        })
        .catch((err) => {
          console.log(err, "delete doc err");
          dispatch(setLoading(false));
        });
    } else {
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
          // console.log(res, "delete folder res");
          dispatch(fetchPropertyDocuments());
          setShow(false);
          dispatch(setLoading(false));
        })
        .catch((err) => {
          console.log(err, "delete folder err");
          dispatch(setLoading(false));
        });
    }
  };

  return (
    <div className="card mb-2">
      {isFolderView ? (
        <Row className="align-items-center pointer" onClick={() => navigate("/DocumentsDetail", { state: { item } })}>
          <Col md="6">
            <div className="card-name mb-2">
              <img src={require("../../Assets/images/img-documents.svg").default} className="me-3" />
              <strong>{document_type}</strong>
            </div>
          </Col>
          <Col xs md="3">
            <div className="card-number mb-2">
              <span className="label">Documents</span>
              {item?.count} documents
            </div>
          </Col>
        </Row>
      ) : (
        <Link to={"/DocumentsPropertyDetails"} state={item}>
          <div className="card-name mb-2">
            <img src={require("../../Assets/images/icon-files.svg").default} className="me-2 progress-list-img" />

            {document_type}
            {inProcess && item?.document_status !== "STARTED" && (
              <FontAwesomeIcon className="list_successDoc" color="#4FB980" icon={faCircle} />
            )}
          </div>
        </Link>
      )}
      <img
        src={require("../../Assets/images/icon-delete.svg").default}
        alt=""
        className="position-absolute pointer"
        style={{ top: 20, right: 25 }}
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
          {isFolderView ? (
            <Modal.Title as="h3" className="w-100 text-center">
              Delete Folder?
            </Modal.Title>
          ) : (
            <Modal.Title as="h3" className="w-100 text-center">
              Delete Document?
            </Modal.Title>
          )}
        </Modal.Header>
        {inProcess ? (
          <Modal.Body className="text-center mb-3">
            Are you sure you want to delete this user document? This action cannot be undone.
          </Modal.Body>
        ) : isFolderView ? (
          <Modal.Body className="text-center mb-3">
            Are you sure you want to delete this Folder? This action cannot be undone.
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
    </div>
  );
}
