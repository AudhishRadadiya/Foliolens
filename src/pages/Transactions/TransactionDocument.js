import React, { useState } from "react";
import { Col, Row, Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { faCircleArrowLeft, faCircleArrowRight } from "@fortawesome/free-solid-svg-icons";

export default function TransactionDocument({ show, setShow, documentPath }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  const goToPrevPage = () => setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);
  const goToNextPage = () => numPages && setPageNumber(pageNumber + 1 >= numPages ? numPages : pageNumber + 1);
  if (!documentPath) return;
  return (
    <Modal show={show} onHide={() => setShow(false)} centered className="modal-v1 border-radius-16">
      <Modal.Body>
        <div className="document-overview">
          <Row>
            <Col xs="12" lg="6">
              <div className="mb-3 document_pdfView_container">
                {documentPath?.includes("pdf") ? (
                  <Document
                    file={{
                      url: documentPath,
                    }}
                    onLoadSuccess={onDocumentLoadSuccess}
                  >
                    <Page pageNumber={pageNumber} />
                  </Document>
                ) : (
                  <img className="xyz" src={documentPath} />
                )}
                <div className="d-flex align-items-center justify-content-center mt-3 pointer">
                  <FontAwesomeIcon
                    className="me-2 document-arrow"
                    onClick={goToPrevPage}
                    icon={faCircleArrowLeft}
                    size="lg"
                  />
                  <spn>{numPages ? `${pageNumber} of ${numPages}` : pageNumber}</spn>
                  <FontAwesomeIcon
                    className="ms-2 document-arrow"
                    onClick={goToNextPage}
                    icon={faCircleArrowRight}
                    size="lg"
                  />
                </div>
              </div>
            </Col>
          </Row>
        </div>
        <div className="container m-0 p-0">
          <Row>
            <Col xs={12}>
              <Button className="w-100" onClick={() => setShow(false)}>
                Okay
              </Button>
            </Col>
          </Row>
        </div>
      </Modal.Body>
    </Modal>
  );
}
