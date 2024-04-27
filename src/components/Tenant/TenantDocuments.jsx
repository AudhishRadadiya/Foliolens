import React, { useState, useEffect } from "react";
import { Table, Col, Button, Modal, Row, Form, InputGroup } from "react-bootstrap";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { ReactComponent as IconPdf } from "../../Assets/images/icon-pdf.svg";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { API, graphqlOperation, Storage } from "aws-amplify";

import { createRecordTB, getFile, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import { formatDate, getId } from "../../Utility";
import { useconfirmAlert } from "../../Utility/Confirmation";
import SearchBox from "../Portfolios/SearchBox";
import { ReactComponent as IconGroup } from "../../Assets/images/icon-group-filter.svg";
import { ReactComponent as IconList } from "../../Assets/images/icon-list-filter.svg";

const TenantDocuments = ({ tenantId, property_unit_id }) => {
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const [searchText, setSearchText] = useState("");
  const [isListView, setIsListView] = useState(true);
  const [isAddDocShow, setIsAddDocShow] = useState(false);
  const [tpDocuments, setTpDocuments] = useState([]);
  const [acceptedFiles1, setAcceptedFiles] = useState([]);
  const [descValArr, setDescValArr] = useState([]);

  const [toggleButtons, setToggleButtons] = useState();

  useEffect(() => {
    if (tpDocuments) {
      const documents = tpDocuments?.filter((item) => item.property_unit_id === property_unit_id);
      documents?.map((item, index) => {
        // setValue(`documents.${index}.doc_description`, item?.description);
        descValArr[index] = item?.description;
      });
      setDescValArr([...descValArr]);
    }
  }, [tpDocuments]);

  const { getRootProps, getInputProps, fileRejections } = useDropzone({
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
    accept: {
      "image/jpeg": [".jpeg", ".jpg", ".png"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
  });

  useEffect(() => {
    if (fileRejections.length > 0) {
      toast.error("File type not supported");
    }
  }, [fileRejections]);

  useEffect(() => {
    if (tenantId) fetchAllPropertyUnitDocs();
  }, [tenantId]);

  const filteredDocument = tpDocuments
    .filter((item) => item.property_unit_id === property_unit_id)
    .filter((item) => (searchText ? item?.document_name?.toLowerCase().includes(searchText.toLowerCase()) : true));

  const fetchAllPropertyUnitDocs = async () => {
    try {
      dispatch(setLoading(true));
      const propertiesData = await getRdsFN("tenantAndPmDocs", {
        tpId: tenantId,
        uId: loggedUserData?.id,
      });
      const allProperties = await Promise.all(propertiesData.map((property) => fetchPropertiesDoc(property)));
      setTpDocuments(allProperties);
      dispatch(setLoading(false));
    } catch (error) {
      console.log("ddf ", error);
      dispatch(setLoading(false));
    }
  };

  const fetchPropertiesDoc = (unitDoc) => {
    if (unitDoc.document_name !== null) {
      return new Promise((resolve) => {
        getFile(unitDoc.document_name).then((res) => {
          var newProperty = Object.assign({}, unitDoc);
          newProperty.path = res;
          resolve(newProperty);
        });
      });
    } else {
      return new Promise((resolve) => {
        var newProperty = Object.assign({}, unitDoc);
        let res = "https://foliolens160827-dev.s3.amazonaws.com/public/property/house.jpeg";
        newProperty.path = res;
        resolve(newProperty);
      });
    }
  };

  const addPhotosToS3 = async () => {
    try {
      dispatch(setLoading(true));
      await Promise.all(
        acceptedFiles1.map(async (file) => {
          await Storage.put(`property/${file.name}`, file, {
            level: "public",
            contentType: file.type,
          });
          const propertyUnitDoc = {
            created_at: new Date(),
            created_by: loggedUserData.id,
            document_name: file.name,
            document_type: file.type,
            id: getId(),
            active: 1,
            property_unit_id: property_unit_id,
            description: file.descriptions,
          };

          await createRecordTB("PropertyUnitDocument", propertyUnitDoc);
        })
      );
      setIsAddDocShow(false);
      setAcceptedFiles([]);
      dispatch(setLoading(false));

      fetchAllPropertyUnitDocs();
    } catch (error) {
      dispatch(setLoading(false));
      console.log("Error uploading file: ", error);
    }
  };

  const downloadImage = (selectedDocument) => {
    axios({ url: selectedDocument.path, method: "GET", responseType: "blob" }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", selectedDocument.document_name);
      document.body.appendChild(link);
      link.click();
    });
  };

  const deleteDocument = async (docID) => {
    try {
      dispatch(setLoading(true));
      await updateRecordTB("PropertyUnitDocument", {
        active: 0,
        id: docID,
      });

      fetchAllPropertyUnitDocs();
      dispatch(setLoading(false));
    } catch (error) {
      console.log(" error ", error);
      dispatch(setLoading(false));
    }
  };

  const onDelete = (selectedDocument) => {
    useconfirmAlert({
      onConfirm: () => deleteDocument(selectedDocument.id),
      isDelete: true,
      title: "Delete Document?",
      dec: "Are you sure you want to delete this Document? This action cannot be undone.",
    });
  };

  const fileSize = (bytes) => {
    const k = 1000;
    const sizes = ["bytes", "kb", "mb", "gb", "tb", "pb", "eb", "zb", "yb"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const updateDocument = async (data, fieldValue) => {
    try {
      dispatch(setLoading(true));
      await updateRecordTB("PropertyUnitDocument", {
        id: data?.id,
        description: fieldValue,
      });
      fetchAllPropertyUnitDocs();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  return (
    <div>
      <div className="mb-3 d-flex justify-content-between">
        <div className="fw-bold">List of Document</div>
        <div className="d-flex gap-3">
          <div className="d-flex align-items-center">
            <IconGroup
              style={{ color: isListView ? "#06122B" : "#1646AA" }}
              onClick={() => setIsListView(!isListView)}
              className="mx-1 pointer btn-effect"
            />
            <IconList
              style={{ color: isListView ? "#1646AA" : "#06122B" }}
              onClick={() => setIsListView(!isListView)}
              className="mx-1 pointer btn-effect"
            />
          </div>
          <Button className="btn-reset" onClick={() => setIsAddDocShow(true)}>
            Add Document
          </Button>
        </div>
      </div>
      <div className="mb-3">
        <SearchBox placeholder="Search" onChange={(e) => setSearchText(e.target.value)} />
      </div>
      {isListView ? (
        <Table responsive="md" borderless={true}>
          <thead>
            <tr className="text-muted ">
              <td>Document Name</td>
              <td>Description</td>
              <td>Upload Date</td>
              <td>File type</td>
              <td>Uploaded by</td>
            </tr>
          </thead>
          <tbody className="table-body tenant-transaction">
            {filteredDocument.map((item, index) => (
              <tr style={{ borderBottom: "1px solid #EDEDED" }}>
                <td className="align-middle">
                  <Col className="d-flex gap-2">
                    <img src={require("../../Assets/images/icon-doc.svg").default} />
                    <div>{item?.document_name}</div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <InputGroup className="unit-inputGroup">
                      <Form.Control
                        onChange={(e) => {
                          descValArr[index] = e.target.value;
                          setDescValArr([...descValArr]);
                        }}
                        value={descValArr[index] || ""}
                        placeholder="Enter Description"
                        className={toggleButtons === index && "form-inputUnit"}
                        onFocus={() => setToggleButtons(index)}
                        onBlur={() => setToggleButtons()}
                      />
                      {toggleButtons === index ? (
                        <InputGroup.Text className="unitInput-addition">
                          <img
                            src={require("../../Assets/images/field-cancel.svg").default}
                            alt=""
                            className="pointer"
                          />
                          <img
                            src={require("../../Assets/images/icon-check-green.svg").default}
                            alt=""
                            className="pointer"
                            onMouseDown={() => {
                              setToggleButtons();
                              updateDocument(item, descValArr[index]);
                            }}
                          />
                        </InputGroup.Text>
                      ) : null}
                    </InputGroup>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <div>{formatDate(item?.created_at)}</div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <div>{item?.document_name.split(".").pop()}</div>
                  </Col>
                </td>
                <td className="align-middle">
                  <Col>
                    <div>{item?.tp_name || item?.pm_name}</div>
                  </Col>
                </td>
                <td>
                  <Col className="d-flex gap-3">
                    <div className="doc-action-btn" onClick={() => downloadImage(item)}>
                      <img src={require("../../Assets/images/icon-document-download.svg").default} alt="" />
                    </div>
                    <div className="doc-action-btn" onClick={() => onDelete(item)}>
                      <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                    </div>
                  </Col>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="documents documents-grid">
          {filteredDocument.map((item) => (
            <div className="file-card">
              <div className="item">
                <div className="document-file-card">
                  <div className="pdfView">
                    <img style={{ width: "96%" }} src={require("../../Assets/images/icon-doc.svg").default} />
                  </div>
                  <div className="name">{item?.document_name}</div>
                  <div className="document-delete doc-action-btn" onClick={() => onDelete(item)}>
                    <img src={require("../../Assets/images/icon-cross.svg").default} alt="" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={isAddDocShow} onHide={() => setIsAddDocShow(false)} centered className="modal-v1 border-radius-16">
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
                    setIsAddDocShow(false);
                    setAcceptedFiles([]);
                  }}
                >
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button className="w-100" onClick={addPhotosToS3} disabled={acceptedFiles1.length === 0 ? true : false}>
                  Save
                </Button>
              </Col>
            </Row>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TenantDocuments;
