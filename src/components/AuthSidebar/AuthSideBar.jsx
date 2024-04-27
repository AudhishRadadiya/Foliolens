import React from "react";
import { useLocation } from "react-router-dom";
import styles from "./AuthSideBar.module.scss";

export default function AuthSideBar() {
  const location = useLocation();
  return (
    <div
      className={`${styles.form_screen_sidebar} ${
        location?.pathname !== "/" && styles.form_screen_top
      } justify-content-center align-items-center`}
    >
      <img src={require("../../Assets/images/logo.svg").default} />
    </div>
  );
}
