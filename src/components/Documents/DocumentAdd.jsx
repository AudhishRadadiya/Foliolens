import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Form } from "react-bootstrap";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { API, graphqlOperation, Storage } from "aws-amplify";
import moment from "moment";
import Button from "react-bootstrap/Button";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDropzone } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

import { ReactComponent as IconPdf } from "../../Assets/images/icon-pdf.svg";

import { copyDocument, transferUserDocument } from "../../graphql/mutations";
import { detectDocumentText } from "../../graphql/queries";
import { setLoading } from "../../store/reducer";
import { getId } from "../../Utility";
import { createRecordTB, fetchInProgressDocsDocuments } from "../../Utility/ApiService";

const DocumentAdd = ({ show, processTab, setShow, transactionDetail, setShowSuccessDocModal, setDocumentDetail }) => {
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const [acceptedFiles1, setAcceptedFiles] = useState([]);
  const dispatch = useDispatch();
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      const accepted_files = files.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type === "image/png" ||
          file.type === "image/jpeg" ||
          file.type === "image/jpg"
      );
      if (accepted_files?.length !== files?.length) {
        toast.error(
          "We only accept the PDFs or images document types. Files other than PDF or images are removed from the selected files."
        );
      }
      setAcceptedFiles([...acceptedFiles1, ...accepted_files]);
    },
    accept: "image/jpeg, application/pdf",
  });
  const generatePdf = async () => {
    try {
      setShow(false);
      dispatch(setLoading(true));

      await Promise.all(
        acceptedFiles1.map(async (file) => {
          const fileName = getId() + ".pdf";
          if (file.type.split("/")[1] === "png" || file.type.split("/")[1] === "jpeg") {
            const doc = new jsPDF();
            const image = new Image();
            image.src = URL.createObjectURL(file);
            doc.addImage(image, "JPEG", 15, 40, 180, 160, "", "FAST");
            file = new File([doc.output("blob")], fileName);
            URL.revokeObjectURL(image.src);
          }

          await Storage.put(`textract/${fileName}`, file, {
            level: "public",
          });

          await API.graphql(graphqlOperation(copyDocument, { fileName }));
          const userDocument = {
            id: getId(),
            user_id: loggedUserData.id,
            document_status: transactionDetail ? "COMPLETED" : "Pending",
            document_url: "",
            document_name: fileName,
            created_by: loggedUserData.id,
            name: file.name.split(".").slice(0, -1).join("."),
            active: 1,
            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
            ...(transactionDetail && { property_id: Number(transactionDetail?.property) }),
          };

          await createRecordTB("UserDocument", userDocument);
          if (transactionDetail) {
            processDocument(userDocument, file.name);
          } else {
            processTab();
            dispatch(fetchInProgressDocsDocuments());
          }
          return API.graphql(graphqlOperation(detectDocumentText, { documentId: userDocument.id }));
        })
      );
      dispatch(setLoading(false));
      setAcceptedFiles([]);
    } catch (e) {
      console.log("ERROR...", e);
      toast.error("Error in uploading file");
    }
  };

  const processDocument = async (document, fileName) => {
    try {
      const res2 = await API.graphql(
        graphqlOperation(transferUserDocument, {
          userDocumentID: document.id,
          selectedPropertyId: Number(transactionDetail?.property), //  allPropertyFilterIds.join(",")
          suggestedPropertyId: transactionDetail?.property,
          selectedDocumentTypeId: 298798878,
          suggestedDocumentTypeId: 298798878,
        })
      );
      console.log("res2 processDocument ", res2);
    } catch (error) {
      console.log("error processDocument ", error);
    }
    console.log("document ", document);

    setDocumentDetail({
      file_name: fileName,
      original_file_name: document.document_name,
    });

    setShowSuccessDocModal(true);
  };

  const fileSize = (bytes) => {
    const k = 1000;
    const sizes = ["bytes", "kb", "mb", "gb", "tb", "pb", "eb", "zb", "yb"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Modal show={show} onHide={() => setShow(false)} centered className="modal-v1 border-radius-16">
      <Modal.Header>
        <Modal.Title as="h3" className="w-100 text-center">
          Add document
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div {...getRootProps()} className="form-file-upload upload-docs mb-3">
          <input {...getInputProps()} />
          <Form.Label className="label-file-upload">
            <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
            Upload Document
          </Form.Label>
        </div>
        {acceptedFiles1.map((item, index) => (
          <div className="d-flex mb-3 justify-content-between align-items-center" key={index}>
            <div>
              <IconPdf />
            </div>
            <div className="d-flex mx-2 align-items-center">
              <span>{item.name}</span>
              <span className="text-muted ms-2">{fileSize(item.size)}</span>
            </div>
            <div
              className="pointer"
              onClick={() => {
                const sortedFile = acceptedFiles1.filter((item) => item !== acceptedFiles1[index]);
                setAcceptedFiles(sortedFile);
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0.73624 0.731357C0.345722 1.12188 0.345743 1.75507 0.73624 2.14557L3.56467 4.974L0.73624 7.80242C0.345722 8.19294 0.345743 8.82614 0.73624 9.21664C1.12674 9.60714 1.75994 9.60716 2.15045 9.21664L4.97888 6.38821L7.80731 9.21664C8.1978 9.60714 8.831 9.60716 9.22152 9.21664C9.61204 8.82612 9.61202 8.19292 9.22152 7.80242L6.39309 4.974L9.22152 2.14557C9.61204 1.75505 9.61202 1.12185 9.22152 0.731357C8.83102 0.34086 8.19783 0.340839 7.80731 0.731357L4.97888 3.55978L2.15045 0.731357C1.75996 0.34086 1.12676 0.340839 0.73624 0.731357Z"
                  fill="#FF5050"
                />
              </svg>
            </div>
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <div className="container m-0 p-0">
          <Row>
            <Col xs={6}>
              <Button
                className="btn-reset w-100"
                onClick={() => {
                  setShow(false);
                  setAcceptedFiles([]);
                }}
              >
                Cancel
              </Button>
            </Col>
            <Col xs={6}>
              <Button className="w-100" onClick={generatePdf} disabled={acceptedFiles1.length === 0 ? true : false}>
                {transactionDetail ? "Upload Files" : "Next"}
              </Button>
            </Col>
          </Row>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentAdd;
