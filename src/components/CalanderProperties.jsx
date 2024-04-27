import React, { useRef } from "react";
import { Col, Modal, Overlay, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

const DateData = ({ eventDate, onHide }) => {
  const navigate = useNavigate();

  const propertyDate = (date) => {
    return moment(date).format("MMMM DD, YYYY");
  };

  return (
    <div className="properties-box high-level-tasks">
      <div className="pointer float-end" style={{ margin: "10px" }}>
        <FontAwesomeIcon icon={faCircleXmark} onClick={onHide} />
      </div>
      {
        eventDate.length > 0 &&
          eventDate.map((data, index) => (
            <div key={index}>
              <ul>
                <li className="pt-3 mb-0">
                  <label>{propertyDate(data.created_at)}</label>
                  <div className="d-flex justify-content-between my-3">
                    <div className="d-flex align-items-center w-100">
                      <div className={`dot ${data.type === "Reminder" ? "danger" : "success"}`} />
                      <h6 className="title-wrapper">{data.title}</h6>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button className="btn-edit">
                        <img
                          src={require("../Assets/images/icon-edit.svg").default}
                          alt=""
                          onClick={() => navigate("/AddTask", { state: data })}
                        />
                      </button>
                    </div>
                  </div>
                  <Row>
                    <label>Property</label>
                    <p>{data.property_name}</p>
                  </Row>
                </li>
              </ul>
            </div>
          ))
        // (
        //   <div>
        //     <p>No task and reminder exist for this date</p>
        //   </div>
        // )
      }
    </div>
  );
};

const CalanderProperties = ({ event, isShowInfo, onHide }) => {
  const target = useRef(null);
  const allTasksReminders = useSelector(({ allTasksReminders }) => allTasksReminders);

  const filterDate = allTasksReminders.filter((data) => {
    const diffDays = moment(event.date).isSame(data.created_at, "day");
    return diffDays;
  });
  return (
    <div className="main-box" ref={target}>
      <span>{event.dayNumberText}</span>

      {window.innerWidth > 991 ? (
        <Overlay target={target.current} show={isShowInfo} placement="left">
          {({ placement, arrowProps, show: _show, popper, ...props }) => (
            <div
              {...props}
              style={{
                ...props.style,
                zIndex: 10,
              }}
            >
              {filterDate.length > 0 && <DateData eventDate={filterDate} onHide={onHide} />}
            </div>
          )}
        </Overlay>
      ) : (
        <Modal size="sm" className="customize-modal properties-box-modal" centered show={isShowInfo} onHide={onHide}>
          <Modal.Body className="p-0">
            {filterDate.length > 0 && <DateData eventDate={filterDate} onHide={onHide} />}
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default CalanderProperties;
