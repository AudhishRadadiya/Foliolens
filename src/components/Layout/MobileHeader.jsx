import React from "react";
import { Link } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import UserInformation from "../UserInformation";
import { SideMenu } from "../SidebarNav/SideMenu";
import HeaderNotification from "./HeaderNotification";

export default function MobileHeader() {
  return (
    <Navbar expand="xxl" className="nav_header bg-blue d-lg-none" fixed="top">
      <Navbar.Brand as={Link} to="/">
        <img src={require("../../Assets/images/logo.svg").default} />
      </Navbar.Brand>
      <HeaderNotification />
      <Navbar.Toggle aria-controls="navbarScroll" />
      <Navbar.Collapse id="navbarScroll">
        <UserInformation />
        <SideMenu />
      </Navbar.Collapse>
    </Navbar>
  );
}
