import React, { useState, useEffect } from "react";
import { Tab, Tabs } from "react-bootstrap";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import AppButton from "../../components/Button/Button";
import { setLoading } from "../../store/reducer";
import { ROLES } from "../../Utility";
import PlanDetail from "../../components/PlanDetail";

export default function WhatYouDo() {
  const [selectedType, setSelectedType] = useState(ROLES.Landlord);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const { upgrade } = state || {};
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (upgrade) {
      if (loggedUserData?.user_role && loggedUserData?.user_role !== ROLES.Collaborator) {
        setSelectedType(loggedUserData.user_role);
      }
    } else {
      if (loggedUserData?.user_role) {
        if (loggedUserData?.user_role === ROLES.Collaborator) return;
        if (loggedUserData?.user_role === ROLES.PropertyOwner) {
          navigate("/PropertyOwnerOnBoarding", { state: { userType: loggedUserData?.user_role } });
        } else {
          navigate("/OtherOnBoarding", { state: { userType: loggedUserData?.user_role } });
        }
      }
    }
  }, [loggedUserData, upgrade]);

  const submit = async () => {
    try {
      if (upgrade) {
        if (selectedType == ROLES.PropertyOwner) {
          navigate("/PropertyOwnerUpgrade", { state: { userType: ROLES.PropertyOwner } });
        } else {
          navigate("/OtherUserUpgrade", {
            state: { userType: selectedType == ROLES.Landlord ? ROLES.Landlord : ROLES.PropertyManager },
          });
        }
      } else {
        if (selectedType == ROLES.PropertyOwner) {
          navigate("/PropertyOwnerOnBoarding", { state: { userType: selectedType } });
        } else if (selectedType == ROLES.Landlord || selectedType == ROLES.PropertyManager) {
          navigate("/OtherOnBoarding", { state: { userType: selectedType } });
        }
      }
    } catch (error) {
      dispatch(setLoading(false));
      console.log("error confirming sign up", error);
      toast.error(error.message || error);
    }
  };

  return (
    <div className="form_screen d-flex h-100 align-items-center">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h3 className="mb-4 title">Select your plan</h3>
          <div>
            <div>
              <Tabs
                defaultActiveKey={ROLES.Landlord}
                id="uncontrolled-tab-example"
                className="tab-v3"
                activeKey={selectedType}
                onSelect={(k) => setSelectedType(k)}
              >
                <Tab eventKey={ROLES.PropertyOwner} title="Free">
                  <PlanDetail
                    mainTxt={
                      "For individual landlords and real estate investors who want to manage their rental income, communicate with their tenants and optimize their rental portfolio."
                    }
                    type="free"
                  />
                </Tab>
                <Tab eventKey={ROLES.Landlord} title="Essential">
                  <PlanDetail
                    mainTxt={
                      "For the individual real estate investor who wants to organize and optimize their rental portfolio whether you manage it or work with a property manager."
                    }
                    type="essential"
                  />
                </Tab>
                <Tab eventKey={ROLES.PropertyManager} title="Growth">
                  <PlanDetail
                    mainTxt={
                      "For property managers and teams who manage rentals and tenants as a business and want additional reporting capabilities and collaboration with Owners."
                    }
                    type="growth"
                  />
                </Tab>
              </Tabs>
            </div>
            <AppButton
              type="submit"
              classes="w-100"
              title="Next"
              onClick={submit}
              disabled={upgrade ? (selectedType === loggedUserData.user_role ? true : false) : false}
            />
            {/* {!upgrade && selectedType !== "Property Owner" && selectedType !== undefined ? (
              <p className="pt-3" style={{ textAlign: "center" }}>
                No Credit Card Required To Sign Up
              </p>
            ) : null} */}
          </div>
        </div>
      </div>
      <AuthSideBar />
    </div>
  );
}
