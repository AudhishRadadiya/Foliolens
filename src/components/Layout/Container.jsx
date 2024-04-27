import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import MobileHeader from "./MobileHeader";
import PageHeader from "./PageHeader";
import SidebarNav from "../SidebarNav/SidebarNav";

const Container = ({ title, children, isBack, className, onBack, isOpen, docInstruction }) => {
  const navigate = useNavigate();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  useEffect(() => {
    if (!loggedUserData?.stripe_subscription_id) {
      if (
        !loggedUserData?.user_role ||
        (loggedUserData?.user_role !== "Collaborator" && loggedUserData?.user_role !== "Property Owner")
      ) {
        navigate("/WhatYouDo");
      }
    }
  }, [loggedUserData]);

  return (
    <div className="wrapper">
      <MobileHeader />

      <div id="layout-wrapper" className="layout-wrapper">
        <SidebarNav />

        <div className="layoutsidenav_content bg-white">
          <PageHeader className title={title} isBack={isBack} onBack={onBack} docInstruction={docInstruction} />

          <div
            style={{ minHeight: className && "calc(100vh - 174px)", position: isOpen && "relative" }}
            className="content-wrapper"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Container;
