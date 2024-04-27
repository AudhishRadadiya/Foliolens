import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import moment from "moment";

import { deleteRecordTB, fetchAllOwnersPortfolio } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import { useconfirmAlert } from "../../Utility/Confirmation";

const OwnersHeader = ({ ownersObj, resendEmail }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const { state } = useLocation();
  const OwnersDetails = state?.owner;
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const deleteOwner = async (deleteData) => {
    try {
      dispatch(setLoading(true));
      let ownerObj = {
        id: deleteData?.id,
        userId: loggedUserData.id,
        time: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      // await updateRecordTB("PropertyOwner", ownerObj);
      await deleteRecordTB("deleteOwner", ownerObj);
      dispatch(fetchAllOwnersPortfolio());
      setShow(false);
      navigate("/Owners");
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong!");
    }
  };

  const popUpMessages = () => {
    if (loggedUserData.user_role === "Property Manager") {
      if (loggedUserData.no_of_units <= 10) {
        let text = "Are you sure you want to delete this owner? This action cannot be undone.";
        return text;
      } else {
        let text = "Are you sure you want to delete this owner? This action cannot be undone.";
        return text;
      }
    } else if (loggedUserData.user_role === "Landlord") {
      if (loggedUserData.no_of_units <= 25) {
        let text = "Are you sure you want to delete this owner? This action cannot be undone.";
        return text;
      } else {
        let text = `Are you sure you want to delete this owner? This action cannot be undone.`;
        return text;
      }
    } else {
      let text = "Are you sure you want to delete this owner? This action cannot be undone.";
      return text;
    }
  };
  const editDetails = () => {
    (ownersObj?.is_collaborator || ownersObj?.is_property_owner) && ownersObj?.permission?.toLowerCase() === "view only"
      ? toast.error("You have been permitted to View Only \nfor this owner")
      : ownersObj?.is_property_owner
      ? toast.error("You have been permitted to View Only \nfor this owner")
      : ownersObj?.created_by !== loggedUserData?.id && ownersObj?.permission === "View Only"
      ? toast.error("You have been permitted to View Only \nfor this owner")
      : navigate("/OwnersAdd", { state: { owner: ownersObj } });
  };
  const deleteDetails = () => {
    (ownersObj?.is_collaborator || ownersObj?.is_property_owner) && ownersObj?.permission?.toLowerCase() === "view only"
      ? toast.error("You have been permitted to View Only \nfor this property")
      : ownersObj?.is_property_owner
      ? toast.error("You have been permitted to View Only \nfor this property")
      : ownersObj?.created_by !== loggedUserData?.id && ownersObj?.permission === "View Only"
      ? toast.error("You have been permitted to View Only \nfor this property")
      : setShow(true);
  };
  const onDelete = (ownersObj) => {
    useconfirmAlert({
      onConfirm: () => deleteOwner(ownersObj),
      isDelete: true,
      title: "Delete owner?",
      dec: popUpMessages(),
    });
  };

  return (
    <div className="mb-4 ">
      <div className=" d-flex align-items-center justify-content-between ">
        <h3 className="mb-0">
          {`${OwnersDetails?.first_name ? OwnersDetails?.first_name : ""} 
          ${OwnersDetails?.last_name ? OwnersDetails?.last_name : ""}`}
        </h3>
        <div className="icon-btns d-flex align-items-lg-center">
          <div
            style={{ color: !ownersObj?.cognito_user_id ? "#1646AA" : "#c5c5c5" }}
            onClick={() => !ownersObj?.cognito_user_id && resendEmail(ownersObj)}
            className={`me-2 d-flex gap-1 ${!ownersObj?.cognito_user_id && "pointer"}`}
          >
            {!ownersObj?.cognito_user_id && (
              <img style={{ fill: "gray" }} src={require("../../Assets/images/icon-mail.svg").default} alt="" />
            )}
            <h4 className="m-0">Resend Email</h4>
          </div>

          <Button type="button" onClick={editDetails}>
            <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
          </Button>
          <Button type="button" onClick={() => onDelete(ownersObj)}>
            <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OwnersHeader;
