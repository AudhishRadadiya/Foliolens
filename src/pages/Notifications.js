import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Container from "../components/Layout/Container";
import NotificationCard from "../components/Notifications/NotificationCard";

import { setLoading } from "../store/reducer";
import moment from "moment";
import { fetchInProgressDocsDocuments, fetchNotifications, updateRecordTB } from "../Utility/ApiService";
import { useLocation } from "react-router-dom";

function Notifications() {
  const dispatch = useDispatch();
  const allNotifications = useSelector(({ notifications }) => notifications);
  const notifications = allNotifications.slice(0, 100);
  const { state } = useLocation();

  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchInProgressDocsDocuments());
  }, []);

  const deleteNotification = async (notificationdata) => {
    dispatch(setLoading(true));
    await updateRecordTB("UserNotification", {
      id: notificationdata.id,
      active: 0,
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
    })
      .then(() => {
        dispatch(setLoading(false));
        dispatch(fetchNotifications());
      })
      .catch((err) => {
        dispatch(setLoading(false));
        console.log(err, "delete doc err");
      });
  };

  return (
    <Container title="Notifications">
      <div className="notifications pe-0 pe-lg-5">
        {notifications && notifications.length > 0 ? (
          notifications.map((item, index) => (
            <NotificationCard key={index} item={item} deleteNotification={deleteNotification} />
          ))
        ) : (
          <div className="empty text-center py-5">
            <img src={require("../../src/Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
          </div>
        )}
      </div>
    </Container>
  );
}

export default Notifications;
