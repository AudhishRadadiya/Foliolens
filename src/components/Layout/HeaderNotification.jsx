import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function HeaderNotification() {
  const navigate = useNavigate();
  const notifications = useSelector(({ notifications }) => notifications);

  const unReadData = notifications.filter((data) => data.read_notification === 0);
  const unReadDatalength = unReadData.length;

  return (
    <div
      className="ms-auto header-notifications pointer"
      onClick={() => navigate("/Notifications", { state: unReadData })}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11 3C11 2.44772 11.4477 2 12 2C12.5523 2 13 2.44772 13 3V4C13 4.02774 12.9989 4.05522 12.9967 4.08239C15.836 4.55707 18 7.02582 18 10V11.9574C18 12.3881 18.156 12.8042 18.439 13.1289L19.0834 13.8682C21.1702 16.2623 19.4699 20 16.294 20H14C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20H7.70609C4.53019 20 2.82986 16.2623 4.91668 13.8682L5.56112 13.1289C5.84413 12.8042 6.00004 12.3881 6.00004 11.9574V10C6.00004 7.02585 8.16401 4.55712 11.0033 4.08241C11.0011 4.05523 11 4.02775 11 4V3ZM12 6C9.7909 6 8.00004 7.79086 8.00004 10V11.9574C8.00004 12.8712 7.66924 13.7542 7.06876 14.443L6.42432 15.1824C5.4654 16.2825 6.24672 18 7.70609 18H16.294C17.7534 18 18.5347 16.2825 17.5758 15.1824L16.9313 14.443C16.3308 13.7542 16 12.8712 16 11.9574V10C16 7.79086 14.2092 6 12 6Z"
          fill="white"
        />
      </svg>
      {unReadDatalength > 0 && (
        <span className="badge badge-counter">{unReadDatalength > 9 ? 9 : unReadDatalength}+</span>
      )}
    </div>
  );
}
