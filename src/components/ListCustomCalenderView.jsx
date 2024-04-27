import React, { useState } from "react";
import { createPlugin } from "@fullcalendar/react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAllTasksReminders, updateRecordTB } from "../Utility/ApiService";
import { setLoading } from "../store/reducer";

const ListCustomCalenderView = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [show, setShow] = useState();
  const [removeItem, setRemoveItem] = useState({});
  const allTasksReminders = useSelector(({ allTasksReminders }) => allTasksReminders);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const startDate = props.dateProfile.activeRange.start;
  const endDate = props.dateProfile.activeRange.end;
  const filterData = allTasksReminders.filter((item) => {
    // return item.next_occurance !== null;
    return new Date(item.created_at) >= new Date(startDate) && new Date(item.created_at) < new Date(endDate);
  });

  const handleRemove = async (removeItem) => {
    try {
      dispatch(setLoading(true));
      const itemTobeRemoved = {
        id: removeItem.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };
      await updateRecordTB("Event", itemTobeRemoved);

      setShow(false);
      dispatch(fetchAllTasksReminders());
      dispatch(setLoading(false));
    } catch (error) {
      console.log("handleRemove error ", error);
      dispatch(setLoading(false));
    }
  };

  const propertyDate = (date) => {
    return moment(date).format("MMM DD, YYYY");
  };

  const propertyTime = (p_Time) => {
    return moment(p_Time).format("HH:mm");
  };

  const handleShow = (item) => {
    setShow(true);
    setRemoveItem(item);
  };

  return (
    <>
      <div className="list-view-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Property</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filterData && filterData.length > 0 ? (
              filterData.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-start",
                      }}
                    >
                      <div className="dot-container">
                        <div
                          className={`dot ${
                            item.type === "Reminder" && item.description === null ? "success" : "danger"
                          }`}
                        ></div>
                      </div>
                      <div className="title-container">
                        <b>{item.title}</b>
                      </div>
                    </div>
                  </td>
                  <td>{propertyDate(item.created_at)}</td>
                  <td>{item.property_name}</td>
                  {/* <td>{propertyTime(item.created_at)}</td> */}
                  <td width="240px">{item.description}</td>
                  <td>
                    <div className="d-flex justify-content-end">
                      <button className="btn-edit">
                        <img
                          src={require("../Assets/images/icon-edit.svg").default}
                          alt=""
                          onClick={() => navigate("/AddTask", { state: item })}
                        />
                      </button>
                      <button className="btn-delete">
                        <img
                          src={require("../Assets/images/icon-delete.svg").default}
                          alt=""
                          onClick={() => handleShow(item)}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No Data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="mobile-list-view">
          <ul>
            {filterData && filterData.length > 0 ? (
              filterData.map((item, index) => (
                <li key={index}>
                  <div className="d-flex justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <div className="dot success"></div>
                      <h6>{item.name}</h6>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button className="btn-edit">
                        <img src={require("../Assets/images/icon-edit.svg").default} alt="" />
                      </button>
                      <button className="btn-delete">
                        <img src={require("../Assets/images/icon-delete.svg").default} alt="" />
                      </button>
                    </div>
                  </div>
                  <Row>
                    <Col xs="6">
                      <label>Date</label>
                      <p>{item.Date}</p>
                    </Col>
                    <Col xs="6">
                      <label>Property</label>
                      <p>{item.Property}</p>
                    </Col>
                    <Col xs="12">
                      <label>Description</label>
                      <p>{item.Description}</p>
                    </Col>
                  </Row>
                </li>
              ))
            ) : (
              <li style={{ textAlign: "center" }}>No Data Found</li>
            )}
          </ul>
        </div>
      </div>
      <Modal show={show} onHide={() => setShow(false)} className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            {`Delete Task / Reminder?`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          {`Are you sure you want to Delete this Task / Reminder ? This action cannot be undone.`}
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
                <Button className="w-100" onClick={() => handleRemove(removeItem)}>
                  Delete
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default createPlugin({
  views: {
    ListCustomCalenderView: ListCustomCalenderView,
  },
});
