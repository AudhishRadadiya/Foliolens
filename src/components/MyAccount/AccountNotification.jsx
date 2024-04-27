import React, { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../../store/reducer";
import moment from "moment";
import { updateRecordTB } from "../../Utility/ApiService";

const TaskNotification = () => (
  <>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 2C7.55229 2 8 2.44772 8 3V5.00008L8.35719 5H15.6428L16 5.00008V3C16 2.44772 16.4477 2 17 2C17.5523 2 18 2.44772 18 3V5.03669C18.1062 5.0427 18.2091 5.04969 18.3086 5.05782C19.0375 5.11737 19.6777 5.24318 20.27 5.54497C21.2108 6.02433 21.9757 6.78924 22.455 7.73005C22.7568 8.32234 22.8826 8.96253 22.9422 9.69138C23 10.3992 23 11.2733 23 12.3571V12.3572V15.6428V15.6429C23 16.7267 23 17.6008 22.9422 18.3086C22.8826 19.0375 22.7568 19.6777 22.455 20.27C21.9757 21.2108 21.2108 21.9757 20.27 22.455C19.6777 22.7568 19.0375 22.8826 18.3086 22.9422C17.6008 23 16.7267 23 15.6429 23H15.6428H8.35717H8.35707C7.27334 23 6.39923 23 5.69138 22.9422C4.96253 22.8826 4.32234 22.7568 3.73005 22.455C2.78924 21.9757 2.02434 21.2108 1.54497 20.27C1.24318 19.6777 1.11737 19.0375 1.05782 18.3086C0.999983 17.6007 0.999991 16.7266 1 15.6428V15.6428V12.3572V12.3572C0.999991 11.2734 0.999983 10.3993 1.05782 9.69138C1.11737 8.96253 1.24318 8.32234 1.54497 7.73005C2.02434 6.78924 2.78924 6.02433 3.73005 5.54497C4.32234 5.24318 4.96253 5.11737 5.69138 5.05782C5.79092 5.04969 5.89376 5.0427 6 5.03669V3C6 2.44772 6.44772 2 7 2ZM16 7.00012V8C16 8.55228 16.4477 9 17 9C17.5523 9 18 8.55228 18 8V7.04039C18.0497 7.04371 18.0982 7.04729 18.1458 7.05118C18.7509 7.10062 19.0986 7.19279 19.362 7.32698C19.9265 7.6146 20.3854 8.07354 20.673 8.63803C20.8072 8.90138 20.8994 9.24907 20.9488 9.85424C20.9992 10.4711 21 11.2634 21 12.4V15.6C21 16.7366 20.9992 17.5289 20.9488 18.1458C20.8994 18.7509 20.8072 19.0986 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C19.0986 20.8072 18.7509 20.8994 18.1458 20.9488C17.5289 20.9992 16.7366 21 15.6 21H8.4C7.26339 21 6.47108 20.9992 5.85424 20.9488C5.24907 20.8994 4.90138 20.8072 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3.1928 19.0986 3.10062 18.7509 3.05118 18.1458C3.00078 17.5289 3 16.7366 3 15.6V12.4C3 11.2634 3.00078 10.4711 3.05118 9.85424C3.10062 9.24907 3.1928 8.90138 3.32698 8.63803C3.6146 8.07354 4.07354 7.6146 4.63803 7.32698C4.90138 7.19279 5.24907 7.10062 5.85424 7.05118C5.90176 7.04729 5.95032 7.04371 6 7.04039V8C6 8.55228 6.44772 9 7 9C7.55229 9 8 8.55228 8 8V7.00012L8.4 7H15.6L16 7.00012ZM6 12C6 11.4477 6.44772 11 7 11C7.55229 11 8 11.4477 8 12C8 12.5523 7.55229 13 7 13C6.44772 13 6 12.5523 6 12ZM17 11C16.4477 11 16 11.4477 16 12C16 12.5523 16.4477 13 17 13C17.5523 13 18 12.5523 18 12C18 11.4477 17.5523 11 17 11ZM11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12ZM12 16C11.4477 16 11 16.4477 11 17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17C13 16.4477 12.5523 16 12 16ZM16 17C16 16.4477 16.4477 16 17 16C17.5523 16 18 16.4477 18 17C18 17.5523 17.5523 18 17 18C16.4477 18 16 17.5523 16 17ZM7 16C6.44772 16 6 16.4477 6 17C6 17.5523 6.44772 18 7 18C7.55229 18 8 17.5523 8 17C8 16.4477 7.55229 16 7 16Z"
        fill="#06122B"
      />
    </svg>
  </>
);
const AlertNotification = () => (
  <>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
      <path
        d="M12 7C12.5523 7 13 7.44772 13 8V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V8C11 7.44772 11.4477 7 12 7Z"
        fill="#06122B"
      />
      <path
        d="M11 16C11 15.4477 11.4477 15 12 15C12.5523 15 13 15.4477 13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16Z"
        fill="#06122B"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.6428 3H10.3572C9.27341 2.99999 8.39925 2.99998 7.69138 3.05782C6.96253 3.11737 6.32234 3.24318 5.73005 3.54497C4.78924 4.02434 4.02434 4.78924 3.54497 5.73005C3.24318 6.32234 3.11737 6.96253 3.05782 7.69138C2.99998 8.39925 2.99999 9.2734 3 10.3572V13.6428C2.99999 14.7266 2.99998 15.6007 3.05782 16.3086C3.11737 17.0375 3.24318 17.6777 3.54497 18.27C4.02434 19.2108 4.78924 19.9757 5.73005 20.455C6.32234 20.7568 6.96253 20.8826 7.69138 20.9422C8.39923 21 9.27334 21 10.3571 21H13.6428C14.7266 21 15.6008 21 16.3086 20.9422C17.0375 20.8826 17.6777 20.7568 18.27 20.455C19.2108 19.9757 19.9757 19.2108 20.455 18.27C20.7568 17.6777 20.8826 17.0375 20.9422 16.3086C21 15.6008 21 14.7267 21 13.6429V10.3572C21 9.27344 21 8.39923 20.9422 7.69138C20.8826 6.96253 20.7568 6.32234 20.455 5.73005C19.9757 4.78924 19.2108 4.02434 18.27 3.54497C17.6777 3.24318 17.0375 3.11737 16.3086 3.05782C15.6007 2.99998 14.7266 2.99999 13.6428 3ZM6.63803 5.32698C6.90138 5.1928 7.24907 5.10062 7.85424 5.05118C8.47108 5.00078 9.2634 5 10.4 5H13.6C14.7366 5 15.5289 5.00078 16.1458 5.05118C16.7509 5.10062 17.0986 5.1928 17.362 5.32698C17.9265 5.6146 18.3854 6.07354 18.673 6.63803C18.8072 6.90138 18.8994 7.24907 18.9488 7.85424C18.9992 8.47108 19 9.2634 19 10.4V13.6C19 14.7366 18.9992 15.5289 18.9488 16.1458C18.8994 16.7509 18.8072 17.0986 18.673 17.362C18.3854 17.9265 17.9265 18.3854 17.362 18.673C17.0986 18.8072 16.7509 18.8994 16.1458 18.9488C15.5289 18.9992 14.7366 19 13.6 19H10.4C9.26339 19 8.47108 18.9992 7.85424 18.9488C7.24907 18.8994 6.90138 18.8072 6.63803 18.673C6.07354 18.3854 5.6146 17.9265 5.32698 17.362C5.1928 17.0986 5.10062 16.7509 5.05118 16.1458C5.00078 15.5289 5 14.7366 5 13.6V10.4C5 9.26339 5.00078 8.47108 5.05118 7.85424C5.10062 7.24907 5.1928 6.90138 5.32698 6.63803C5.6146 6.07354 6.07354 5.6146 6.63803 5.32698Z"
        fill="#06122B"
      />
    </svg>
  </>
);
const InsightNotification = () => (
  <>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.5878 3.29906C12.2974 3.62379 11.93 4.34801 11.5218 5.99192C10.89 8.53579 9.31643 9.9768 8.16963 10.5935L7.11386 19.4499C8.33723 19.6218 9.70315 19.8406 11.0807 20.0614C11.3576 20.1058 11.6349 20.1502 11.9117 20.1943C13.955 20.5203 15.9679 20.8308 17.59 20.9941C18.1962 21.0551 18.9102 20.6502 19.6013 19.4425C20.2693 18.2751 20.7447 16.6149 20.9122 14.8933C21.043 13.5487 21.1026 12.2529 20.9923 11.1645C20.879 10.0453 20.6032 9.33103 20.2303 8.9557C20.1949 8.92008 19.9923 8.79583 19.4093 8.80997C18.8759 8.82291 18.2259 8.94703 17.5651 9.12575C16.9131 9.30207 16.2938 9.51947 15.8341 9.69453C15.6054 9.78165 15.4188 9.85732 15.2904 9.91071C15.2263 9.93738 15.1769 9.95843 15.1443 9.97249L15.1081 9.98816L15.1 9.99172L15.0988 9.99227C14.3072 10.3434 13.4925 9.5455 13.8002 8.71953L13.8006 8.71847L13.8032 8.7113L13.8165 8.67424C13.8286 8.63979 13.8472 8.58609 13.8709 8.51445C13.9184 8.37111 13.9864 8.15624 14.0647 7.88015C14.2216 7.32731 14.4191 6.53271 14.5772 5.57811C14.7532 4.51481 14.5563 3.85673 14.3183 3.4973C14.0825 3.14129 13.7615 2.99893 13.4711 2.99893C12.9819 2.99893 12.7901 3.07275 12.5878 3.29906ZM16.1916 7.45454C16.298 7.00147 16.4053 6.48287 16.4997 5.91258C16.7372 4.47862 16.5206 3.26376 15.9317 2.37457C15.3405 1.48195 14.4211 1 13.4711 1C12.7199 1 11.8781 1.13428 11.1501 1.9485C10.5101 2.66429 10.0506 3.81301 9.63194 5.49877C9.10023 7.63974 7.71799 8.63386 7.09269 8.90797H4.17979C2.61059 8.90797 1.32094 10.1772 1.25708 11.7843L1.00247 18.1917C0.934826 19.8941 2.26298 21.3121 3.92518 21.3121H5.96882C7.36796 21.4898 9.04272 21.7581 10.7755 22.0357C11.0531 22.0802 11.3321 22.1249 11.6118 22.1695C13.6476 22.4943 15.7138 22.8138 17.3994 22.9834C19.1582 23.1605 20.4606 21.8916 21.2833 20.4539C22.1292 18.9757 22.6652 17.0188 22.8527 15.0917C22.9875 13.7058 23.0629 12.2501 22.932 10.958C22.8042 9.69662 22.4627 8.40124 21.5967 7.52949C20.9705 6.89918 20.0672 6.79452 19.3632 6.8116C18.6098 6.82987 17.7919 6.99709 17.0676 7.19296C16.7638 7.27513 16.4686 7.36454 16.1916 7.45454ZM5.16556 19.3132L6.16767 10.9069H4.17979C3.65672 10.9069 3.22684 11.33 3.20555 11.8657L2.95095 18.2731C2.9284 18.8405 3.37111 19.3132 3.92518 19.3132H5.16556Z"
        fill="#06122B"
      />
    </svg>
  </>
);

const notifications = [
  {
    id: 1,
    title: "Scheduled Tasks & Reminders",
    push: "Push Notification",
    email: "Email Notification",
  },
  {
    id: 2,
    title: "Business Alerts & Notifications",
    push: "Push Notification",
    email: "Email Notification",
  },
  {
    id: 3,
    title: "Insights & Recommendations",
    push: "Push Notification",
    email: "Email Notification",
  },
];

export default function AccountNotification() {
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const dispatch = useDispatch();

  const onUpdateUser = async (val, id, notification) => {
    try {
      dispatch(setLoading(true));
      let updateUserTPushObj = {
        id: loggedUserData.id,
        notification_task_reminder_push: val,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      let updateUserTEmailObj = {
        id: loggedUserData.id,
        notification_task_reminder_email: val,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      let updateUserGPushObj = {
        id: loggedUserData.id,
        notification_general_push: val,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      let updateUserGEmailObj = {
        id: loggedUserData.id,
        notification_general_email: val,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      let updateUserIPushObj = {
        id: loggedUserData.id,
        notification_insights_push: val,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      let updateUserIEmailObj = {
        id: loggedUserData.id,
        notification_insights_email: val,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      let updateUserObj = {
        id: loggedUserData.id,
        notification_task_reminder_push: loggedUserData?.notification_task_reminder_push,
        notification_task_reminder_email: loggedUserData?.notification_task_reminder_email,
        notification_general_push: loggedUserData?.notification_general_push,
        notification_general_email: loggedUserData?.notification_general_email,
        notification_insights_push: loggedUserData?.notification_task_reminder_push,
        notification_insights_email: loggedUserData?.notification_insights_email,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await updateRecordTB(
        "User",
        id === 1 && notification === "Push Notification"
          ? updateUserTPushObj
          : id === 1 && notification === "Email Notification"
          ? updateUserTEmailObj
          : id === 2 && notification === "Push Notification"
          ? updateUserGPushObj
          : id === 2 && notification === "Email Notification"
          ? updateUserGEmailObj
          : id === 3 && notification === "Push Notification"
          ? updateUserIPushObj
          : id === 3 && notification === "Email Notification"
          ? updateUserIEmailObj
          : updateUserObj
      );

      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };
  return (
    <Row>
      {notifications.map((notification, i) => {
        return (
          <Col md="6" xl="6" key={i}>
            <h4 className="d-flex align-items-center mt-4">
              {notification?.id === 1 ? (
                <TaskNotification />
              ) : notification?.id === 2 ? (
                <AlertNotification />
              ) : (
                <InsightNotification />
              )}
              {notification?.title}
            </h4>
            <Card className="mb-3">
              <Card.Body className="p-0 d-flex justify-content-between">
                <Card.Title as="h6">{notification?.push}</Card.Title>
                <div className="notification-list-switch">
                  <label className="theme-switch">
                    {notification?.id === 1 && notification?.push ? (
                      <input
                        type="checkbox"
                        defaultChecked={loggedUserData?.notification_task_reminder_push === 1 ? true : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onUpdateUser(1, notification.id, notification.push);
                          } else {
                            onUpdateUser(0, notification.id, notification.push);
                          }
                        }}
                      />
                    ) : notification?.id === 2 && notification?.push ? (
                      <input
                        type="checkbox"
                        defaultChecked={loggedUserData?.notification_general_push === 1 ? true : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onUpdateUser(1, notification.id, notification.push);
                          } else {
                            onUpdateUser(0, notification.id, notification.push);
                          }
                        }}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        defaultChecked={loggedUserData?.notification_insights_push === 1 ? true : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onUpdateUser(1, notification.id, notification.push);
                          } else {
                            onUpdateUser(0, notification.id, notification.push);
                          }
                        }}
                      />
                    )}

                    <span className="theme-slider theme-round"></span>
                  </label>
                </div>
              </Card.Body>
            </Card>
            <Card className="mb-3">
              <Card.Body className="p-0 d-flex justify-content-between">
                <Card.Title as="h6">{notification?.email}</Card.Title>
                <div className="notification-list-switch">
                  <label className="theme-switch">
                    {notification?.id === 1 && notification?.email ? (
                      <input
                        type="checkbox"
                        defaultChecked={loggedUserData?.notification_task_reminder_email === 1 ? true : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onUpdateUser(1, notification.id, notification.email);
                          } else {
                            onUpdateUser(0, notification.id, notification.email);
                          }
                        }}
                      />
                    ) : notification?.id === 2 && notification?.email ? (
                      <input
                        type="checkbox"
                        defaultChecked={loggedUserData?.notification_general_email === 1 ? true : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onUpdateUser(1, notification.id, notification.email);
                          } else {
                            onUpdateUser(0, notification.id, notification.email);
                          }
                        }}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        defaultChecked={loggedUserData?.notification_insights_email === 1 ? true : false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onUpdateUser(1, notification.id, notification.email);
                          } else {
                            onUpdateUser(0, notification.id, notification.email);
                          }
                        }}
                      />
                    )}
                    <span className="theme-slider theme-round"></span>
                  </label>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
