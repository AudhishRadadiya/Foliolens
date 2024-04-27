import React from "react";
import AuthSideBar from "../../components/AuthSidebar/AuthSideBar";
import SignUpSignInTabs from "../../components/SignUpSignInTabs";

export default function Auth() {
  return (
    <div className="form_screen d-flex h-100">
      <div className="form_screen_content d-flex align-items-md-center">
        <div className="form_wrapper bg-white">
          <h2 className="mb-3 text_wrap">Welcome!</h2>
          <SignUpSignInTabs />
        </div>
      </div>
      <AuthSideBar />
    </div>
  );
}
