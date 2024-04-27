import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";
import { API, graphqlOperation } from "aws-amplify";

import { getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import { fetchAllProperties } from "../../Utility/ApiService";
import { getRdsData } from "../../graphql/queries";
import AppButton from "../Button/Button";
import { useconfirmAlert } from "../../Utility/Confirmation";

export default function PropertyName({ propertyObj }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];
  const [documentsLength, setDocumentsLength] = useState([]);
  const [collabData, setCollabData] = useState();
  const portfolioData = allPortfolios?.find((i) => i.id === propertyObj.portfolio_id);

  const propertyName = [propertyObj?.address1, propertyObj?.city, propertyObj?.state, propertyObj?.zipcode]
    ?.filter((i) => i)
    ?.join(", ");

  useEffect(() => {
    if (Object.keys(propertyObj)?.length > 0) {
      filterDocuments();
      getCollaboratorData();
    }
  }, [propertyObj]);

  const getCollaboratorData = async () => {
    const res = await getRdsFN("tbSelect", {
      source: "coll",
      email: loggedUserData.email,
    });
    setCollabData(res[0]);
  };

  const filterDocuments = async () => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(getRdsData, {
          name: "tbSelect",
          data: JSON.stringify({
            source: "propDoc",
            propSelected: propertyObj.id,
          }),
        })
      )
        .then((res) => {
          let data = JSON.parse(res?.data?.getRdsData?.response);
          let parsedData = data.filter((p) => p.active === 1);
          setDocumentsLength(parsedData);
          dispatch(setLoading(false));
        })
        .catch((err) => console.log(err, "error"));
    } catch (err) {
      console.log("error while fetching Property Docs", err);
      dispatch(setLoading(false));
    }
  };

  const deleteProperty = async () => {
    try {
      dispatch(setLoading(true));

      const res = await getRdsFN("tbSelect", {
        source: "propUnit",
        propId: propertyObj.id,
      });
      const unitIds = res.map((p) => p.id);
      const res2 = await Promise.all(
        unitIds.map((uid) => {
          return getRdsFN("tbSelect", {
            source: "propLease",
            propUnitId: uid,
          });
        })
      );
      const propertyLeases = [];
      res2.forEach((l) => {
        propertyLeases.push(...l);
      });
      const allTenantIds = propertyLeases.map((pl) => pl.tenant_id);
      const leaseIds = propertyLeases.map((pl) => pl.id);
      const ps2 = [];

      unitIds.forEach((uid) => {
        ps2.push(
          updateRecordTB("PropertyUnit", {
            id: uid,
            active: 0,
            last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_by: loggedUserData.id,
          })
        );
      });
      allTenantIds.forEach((tid) => {
        ps2.push(
          updateRecordTB("Tenant", {
            id: tid,
            active: 0,
            last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          })
        );
      });
      leaseIds.forEach((lid) => {
        ps2.push(
          updateRecordTB("PropertyLease", {
            id: lid,
            active: 0,
            last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          })
        );
      });
      await Promise.all(ps2);
      await updateRecordTB("Property", {
        id: propertyObj.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      });

      dispatch(fetchAllProperties());
      navigate("/Properties");
      dispatch(setLoading(false));
    } catch (err) {
      dispatch(setLoading(false));
      console.log("Delete Property Err", err);
      toast.error("Error while deleting property");
    }
  };

  const popUpMessages = () => {
    if (loggedUserData.user_role === "Property Manager") {
      if (loggedUserData.no_of_units <= 10) {
        let text = "Are you sure you want to delete this property?";
        return text;
      } else {
        let text = "Are you sure you want to delete this property?\n This task cannot be undone.";
        return text;
      }
    } else if (loggedUserData.user_role === "Landlord") {
      if (loggedUserData.no_of_units <= 25) {
        let text = "Are you sure you want to delete this property?";
        return text;
      } else {
        let text = `Are you sure you want to delete this property?\n This task cannot be undone.`;
        return text;
      }
    } else {
      let text = "Are you sure you want to delete this property?";
      return text;
    }
  };
  const onDelete = () => {
    useconfirmAlert({
      onConfirm: () => deleteProperty(),
      isDelete: true,
      title: "Delete Property ?",
      dec: popUpMessages(),
    });
  };
  return (
    <div className="mb-4 d-flex align-items-lg-center flex-column flex-lg-row justify-content-between">
      <div className="property-name d-flex align-items-center justify-content-between mb-4 mb-lg-0">
        <h2 className="mb-0">{propertyName}</h2>
        <div className="icon-btns d-flex">
          <Button
            type="button"
            onClick={() =>
              (propertyObj?.is_collaborator || propertyObj?.is_property_owner) &&
              propertyObj?.permission?.toLowerCase() === "view only"
                ? toast.error("You have been granted View Only permissions for this portfolio.")
                : propertyObj?.is_property_owner
                ? toast.error("You have been permitted to View Only \nfor this property")
                : propertyObj?.created_by !== loggedUserData?.id && propertyObj?.permission === "View Only"
                ? toast.error("You have been permitted to View Only \nfor this property")
                : propertyObj?.is_collaborator === 1 && propertyObj?.permission === "View Only"
                ? toast.error("You have been granted View Only permissions for this portfolio.")
                : navigate("/PropertyAdd", { state: { propertyData: propertyObj } })
            }
          >
            <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
          </Button>
          <Button
            type="button"
            onClick={() =>
              (propertyObj?.is_collaborator || propertyObj?.is_property_owner) &&
              propertyObj?.permission?.toLowerCase() === "view only"
                ? toast.error("You have been granted View Only permissions for this portfolio.")
                : propertyObj?.is_property_owner
                ? toast.error("You have been permitted to View Only \nfor this property")
                : propertyObj?.created_by !== loggedUserData?.id && propertyObj?.permission === "View Only"
                ? toast.error("You have been permitted to View Only \nfor this property")
                : propertyObj?.is_collaborator === 1 && propertyObj?.permission === "View Only"
                ? toast.error("You have been granted View Only permissions for this portfolio.")
                : onDelete()
            }
          >
            <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
          </Button>
        </div>
      </div>
      <div className="d-flex flex-column">
        <AppButton
          type="button"
          classes="no-img oceanblue"
          title={`View Files (${documentsLength?.length})`}
          disabled={documentsLength?.length <= 0 ? true : false}
          onClick={() => navigate("/Documents", { state: { propertyObj } })}
        />
      </div>
    </div>
  );
}
