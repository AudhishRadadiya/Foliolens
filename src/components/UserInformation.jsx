import moment from "moment";
import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { setLoading } from "../store/reducer";
import { logOut } from "../Utility";
import { updateUserFN } from "../Utility/ApiService";
import ProfileAvatar from "./ProfileAvatar/ProfileAvatar";

export default function UserInformation() {
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const dispatch = useDispatch();

  const [showPrfoileAvatar, setShowPrfoileAvatar] = useState(false);

  const handleSelectAvatar = async (selectedAvatarId) => {
    setShowPrfoileAvatar(false);
    const data = {
      id: loggedUserData.id,
      profile_photo_url: parseInt(selectedAvatarId),
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    await dispatch(
      updateUserFN({
        ...data,
      })
    );
  };

  return (
    <Dropdown align="end" className="dropdown-user">
      <ProfileAvatar
        handleSelectAvatar={handleSelectAvatar}
        showPrfoileAvatar={showPrfoileAvatar}
        setShowPrfoileAvatar={setShowPrfoileAvatar}
      />
      <img
        src={require(`../Assets/images/avatar${
          loggedUserData?.profile_photo_url === " " || !loggedUserData?.profile_photo_url
            ? ""
            : loggedUserData?.profile_photo_url
        }.png`)}
        className="me-2 profile-picture"
        onClick={() => setShowPrfoileAvatar(true)}
      />
      <Dropdown.Toggle id="dropdown-basic" className="p-0 no-clr name-user">
        {loggedUserData ? `${loggedUserData?.first_name} ${loggedUserData?.last_name} ` : " "}
      </Dropdown.Toggle>

      <Dropdown.Menu className="profile-dropdown">
        <Dropdown.Item as={Link} to="/MyAccount" className="my-account">
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 0C5.23858 0 3 2.23858 3 5C3 7.76142 5.23858 10 8 10C10.7614 10 13 7.76142 13 5C13 2.23858 10.7614 0 8 0ZM5 5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5C11 6.65685 9.65685 8 8 8C6.34315 8 5 6.65685 5 5Z"
              fill="#06122B"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5 12C2.23858 12 0 14.2386 0 17C0 18.6569 1.34315 20 3 20H13C14.6569 20 16 18.6569 16 17C16 14.2386 13.7614 12 11 12H5ZM2 17C2 15.3431 3.34315 14 5 14H11C12.6569 14 14 15.3431 14 17C14 17.5523 13.5523 18 13 18H3C2.44772 18 2 17.5523 2 17Z"
              fill="#06122B"
            />
          </svg>
          My Account
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => {
            dispatch(setLoading(true));
            logOut().finally(() => {
              dispatch(setLoading(false));
            });
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 16C8.44771 16 8 16.4477 8 17C8 17.5523 8.44771 18 9 18H12.2413C13.0463 18 13.7106 18 14.2518 17.9558C14.8139 17.9099 15.3306 17.8113 15.816 17.564C16.5686 17.1805 17.1805 16.5686 17.564 15.816C17.8113 15.3306 17.9099 14.8139 17.9558 14.2518C18 13.7106 18 13.0463 18 12.2413V5.75872C18 4.95374 18 4.28937 17.9558 3.74817C17.9099 3.18608 17.8113 2.66937 17.564 2.18404C17.1805 1.43139 16.5686 0.819468 15.816 0.435975C15.3306 0.188683 14.8139 0.0901192 14.2518 0.0441941C13.7106 -2.20649e-05 13.0463 -1.25008e-05 12.2413 4.3978e-07H9C8.44771 4.3978e-07 8 0.447717 8 1C8 1.55229 8.44772 2 9 2L12.2 2C13.0566 2 13.6389 2.00078 14.089 2.03755C14.5274 2.07337 14.7516 2.1383 14.908 2.21799C15.2843 2.40973 15.5903 2.71569 15.782 3.09202C15.8617 3.24842 15.9266 3.47262 15.9624 3.91104C15.9992 4.36113 16 4.94342 16 5.8V12.2C16 13.0566 15.9992 13.6389 15.9624 14.089C15.9266 14.5274 15.8617 14.7516 15.782 14.908C15.5903 15.2843 15.2843 15.5903 14.908 15.782C14.7516 15.8617 14.5274 15.9266 14.089 15.9624C13.6389 15.9992 13.0566 16 12.2 16L9 16Z"
              fill="#06122B"
            />
            <path
              d="M4.70711 12.7071C5.09763 12.3166 5.09763 11.6834 4.70711 11.2929L3.41421 10H12C12.5523 10 13 9.55228 13 9C13 8.44772 12.5523 8 12 8H3.41421L4.70711 6.70711C5.09763 6.31658 5.09763 5.68342 4.70711 5.29289C4.31658 4.90237 3.68342 4.90237 3.29289 5.29289L0.292893 8.29289C-0.0976311 8.68342 -0.0976311 9.31658 0.292893 9.70711L3.29289 12.7071C3.68342 13.0976 4.31658 13.0976 4.70711 12.7071Z"
              fill="#06122B"
            />
          </svg>
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
