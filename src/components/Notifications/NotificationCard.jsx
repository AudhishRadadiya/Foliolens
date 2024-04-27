import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { Col, Container, Modal, Row } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { formatDate } from "../../Utility";
import { getRecordTB } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";

const transactionNotifications = ["Transaction Successful", "Transaction Failed", "Transaction Cancelled"];

const accountNotifications = [
  "Customer Document Failed",
  "Customer Deactivated",
  "Beneficial Customer Created",
  "Beneficial Owner Document Failed",
  "Beneficial Account Verified",
];

export default function NotificationCard({ item, deleteNotification }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const allProcessDocument = useSelector(({ allProcessDocument }) => allProcessDocument);
  const processData = allProcessDocument.find((it) => it.id === item.user_document_id);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const dispatch = useDispatch();

  const notification = async () => {
    switch (item.notification_type) {
      case "Event":
        navigate("/Calender", {
          state: {
            id: item.resource_id,
            type: item.title,
          },
        });
        break;

      case "Document Status":
        if (allProperties.length <= 0) {
          toast.error("You can not proceed the document \ntranslation without any property");
        } else {
          dispatch(setLoading(true));
          const documentDetail = await getRecordTB("UserDocument", item.user_document_id);

          if (documentDetail?.active !== 1) {
            toast.error("This document has been removed.");
            deleteNotification(item);
            dispatch(setLoading(false));

            return;
          }
          dispatch(setLoading(false));
          navigate("/DocumentsAdd", {
            state: processData,
          });
        }
        break;

      case "Customer Reverification Needed":
        navigate("/PortfolioDetailVerify", {
          state: {
            id: Number(item.resource_id),
          },
        });
        break;
      case "Customer Document Needed":
      case "Benificial Owner Reverification Needed": //EditDwollaBeneficiaryOwner
        navigate("/PortfolioDocumentVerify", {
          state: {
            id: Number(item.resource_id),
          },
        });
        break;

      case item.notification_type == "Customer Verified":
      case item.notification_type == "Customer Suspended":
        navigate("/Portfolios");

      default:
        break;
    }

    if (accountNotifications.includes(item.notification_type)) {
      navigate("/Portfolios");
    }

    if (transactionNotifications.includes(item.notification_type)) {
      navigate("/Transactions", {
        state: { id: item.resource_id, type: item.title },
      });
    }
    deleteNotification(item);
  };

  return (
    <Card>
      <Card.Body className={`p-0 pointer`}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div
            className="nofication-header align-items-center justify-content-between mb-2"
            onClick={() => notification()}
          >
            <div>
              <span className={`${item.read_notification === 0 ? "report-tag" : ""} latest`}>{item.title}</span>
              <span className="date d-none d-lg-inline-flex">{formatDate(item.created_at)}</span>
            </div>
            <div className="notification-body pt-2">
              <h4>{item.message}</h4>
            </div>
          </div>
          <div onClick={() => setShow(true)} style={{ marginBottom: 55 }}>
            <Button className="delete-btn p-0 m-0 no-clr">
              <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
            </Button>
          </div>
          {/* <div className="notification-body"  onClick={() => notification()}>
          <h4>{item.message}</h4> */}
          {/* <div className="owner-summary">
            <span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14 8H15C15.2652 8 15.5196 7.89464 15.7071 7.70711C15.8946 7.51957 16 7.26522 16 7C16 6.73478 15.8946 6.48043 15.7071 6.29289C15.5196 6.10536 15.2652 6 15 6H14C13.7348 6 13.4804 6.10536 13.2929 6.29289C13.1054 6.48043 13 6.73478 13 7C13 7.26522 13.1054 7.51957 13.2929 7.70711C13.4804 7.89464 13.7348 8 14 8ZM14 12H15C15.2652 12 15.5196 11.8946 15.7071 11.7071C15.8946 11.5196 16 11.2652 16 11C16 10.7348 15.8946 10.4804 15.7071 10.2929C15.5196 10.1054 15.2652 10 15 10H14C13.7348 10 13.4804 10.1054 13.2929 10.2929C13.1054 10.4804 13 10.7348 13 11C13 11.2652 13.1054 11.5196 13.2929 11.7071C13.4804 11.8946 13.7348 12 14 12ZM9 8H10C10.2652 8 10.5196 7.89464 10.7071 7.70711C10.8946 7.51957 11 7.26522 11 7C11 6.73478 10.8946 6.48043 10.7071 6.29289C10.5196 6.10536 10.2652 6 10 6H9C8.73478 6 8.48043 6.10536 8.29289 6.29289C8.10536 6.48043 8 6.73478 8 7C8 7.26522 8.10536 7.51957 8.29289 7.70711C8.48043 7.89464 8.73478 8 9 8ZM9 12H10C10.2652 12 10.5196 11.8946 10.7071 11.7071C10.8946 11.5196 11 11.2652 11 11C11 10.7348 10.8946 10.4804 10.7071 10.2929C10.5196 10.1054 10.2652 10 10 10H9C8.73478 10 8.48043 10.1054 8.29289 10.2929C8.10536 10.4804 8 10.7348 8 11C8 11.2652 8.10536 11.5196 8.29289 11.7071C8.48043 11.8946 8.73478 12 9 12ZM21 20H20V3C20 2.73478 19.8946 2.48043 19.7071 2.29289C19.5196 2.10536 19.2652 2 19 2H5C4.73478 2 4.48043 2.10536 4.29289 2.29289C4.10536 2.48043 4 2.73478 4 3V20H3C2.73478 20 2.48043 20.1054 2.29289 20.2929C2.10536 20.4804 2 20.7348 2 21C2 21.2652 2.10536 21.5196 2.29289 21.7071C2.48043 21.8946 2.73478 22 3 22H21C21.2652 22 21.5196 21.8946 21.7071 21.7071C21.8946 21.5196 22 21.2652 22 21C22 20.7348 21.8946 20.4804 21.7071 20.2929C21.5196 20.1054 21.2652 20 21 20ZM13 20H11V16H13V20ZM18 20H15V15C15 14.7348 14.8946 14.4804 14.7071 14.2929C14.5196 14.1054 14.2652 14 14 14H10C9.73478 14 9.48043 14.1054 9.29289 14.2929C9.10536 14.4804 9 14.7348 9 15V20H6V4H18V20Z"
                  fill="#06122B"
                />
              </svg>
              Portfolios
            </span>
            <span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15.71 12.7096C16.6904 11.9383 17.406 10.8806 17.7572 9.68358C18.1085 8.4866 18.0779 7.2099 17.6698 6.0311C17.2617 4.85231 16.4963 3.83003 15.4801 3.10649C14.4639 2.38296 13.2474 1.99414 12 1.99414C10.7525 1.99414 9.53611 2.38296 8.51993 3.10649C7.50374 3.83003 6.73834 4.85231 6.33021 6.0311C5.92208 7.2099 5.89151 8.4866 6.24276 9.68358C6.59401 10.8806 7.3096 11.9383 8.29 12.7096C6.61007 13.3827 5.14428 14.499 4.04889 15.9396C2.95349 17.3801 2.26956 19.0909 2.07 20.8896C2.05555 21.021 2.06711 21.1538 2.10402 21.2807C2.14093 21.4075 2.20246 21.5259 2.28511 21.629C2.45202 21.8371 2.69478 21.9705 2.96 21.9996C3.22521 22.0288 3.49116 21.9514 3.69932 21.7845C3.90749 21.6176 4.04082 21.3749 4.07 21.1096C4.28958 19.1548 5.22168 17.3494 6.68822 16.0384C8.15475 14.7274 10.0529 14.0027 12.02 14.0027C13.9871 14.0027 15.8852 14.7274 17.3518 16.0384C18.8183 17.3494 19.7504 19.1548 19.97 21.1096C19.9972 21.3554 20.1144 21.5823 20.2991 21.7467C20.4838 21.911 20.7228 22.0011 20.97 21.9996H21.08C21.3421 21.9695 21.5817 21.8369 21.7466 21.6309C21.9114 21.4248 21.9881 21.162 21.96 20.8996C21.7595 19.0958 21.0719 17.3806 19.9708 15.9378C18.8698 14.4951 17.3969 13.3791 15.71 12.7096ZM12 11.9996C11.2089 11.9996 10.4355 11.765 9.77772 11.3255C9.11992 10.886 8.60723 10.2613 8.30448 9.53037C8.00173 8.79947 7.92251 7.9952 8.07686 7.21928C8.2312 6.44335 8.61216 5.73062 9.17157 5.17121C9.73098 4.6118 10.4437 4.23084 11.2196 4.0765C11.9956 3.92215 12.7998 4.00137 13.5307 4.30412C14.2616 4.60687 14.8863 5.11956 15.3259 5.77736C15.7654 6.43515 16 7.20851 16 7.99964C16 9.0605 15.5786 10.0779 14.8284 10.8281C14.0783 11.5782 13.0609 11.9996 12 11.9996Z"
                  fill="#06122B"
                />
              </svg>
              {item.send_by}
            </span>
          </div> */}
          {/* </div> */}
        </div>
        <Modal show={show} onHide={() => setShow(false)} className="modal-v1 border-radius-16">
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              Delete Notification?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center mb-3">
            Are you sure you want to delete this Notification? This action cannot be undone.
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
                  <Button
                    className="w-100"
                    onClick={() => {
                      deleteNotification(item);
                      setShow(false);
                    }}
                  >
                    Delete
                  </Button>
                </Col>
              </Row>
            </Container>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
}
