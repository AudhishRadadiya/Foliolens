import React, { useState, useEffect } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import AppButton from "./Button/Button";
import { Auth, Hub } from "aws-amplify";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import moment from "moment";

import { setLoading } from "../store/reducer";
import { createDefaultPortfolio, createRecordTB, fetchUser, getRdsFN } from "../Utility/ApiService";
import { getId, logOut } from "../Utility";
import envFile from "../envFile";

export default function SignUpSignInTabs() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search.substring(1) : " ");

  const collaboratorId = params.get("collaboratorId") || "";
  const propertyownerId = params.get("propertyownerId") || "";

  const goToSignUpEmail = () => {
    navigate("/SignUpEmail");
  };

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", (data) => {
      const signInSelected = localStorage.getItem("signInSelected");
      switch (data.payload.event) {
        case "cognitoHostedUI":
          if (signInSelected === "signup") {
            onSocialSignup(data.payload.data);
          } else if (signInSelected === "signin") {
            onSocialSignIn(data.payload.data);
          }
          break;

        default:
      }
    });

    return unsubscribe;
  }, []);

  const onSocialClick = async (type, action) => {
    try {
      localStorage.setItem("signInSelected", action);
      await Auth.federatedSignIn({ provider: type });
    } catch (error) {
      console.log("federatedSignIn err", error);
      toast.error("Singin failed");
    }
  };

  const onSocialSignIn = async (fetchedUserData) => {
    const singInemail = fetchedUserData.signInUserSession?.idToken?.payload?.email;
    const user = await dispatch(fetchUser(singInemail));
    if (!user) {
      await logOut();
      dispatch(setLoading(false));
      return toast.error("User not found");
    }
  };

  const onSocialSignup = async (authUserdata) => {
    try {
      const singUpemail = authUserdata.signInUserSession?.idToken?.payload?.email;
      const name = authUserdata.signInUserSession?.idToken?.payload?.given_name || "";
      const firstName = name.split(" ")[0] || "";
      const lastName = name.split(" ")[1] || "";
      if (!singUpemail) {
        return toast.error("We could not find an email from your social account.");
      }

      dispatch(setLoading(true));
      const res = await getRdsFN("tbSelect", {
        source: "usr",
        email: singUpemail,
      });

      if (res[0]?.email === singUpemail) {
        // navigate("/");
        dispatch(setLoading(false));
        return toast.error("A user with this email already exists.");
      } else {
        const obj = {
          id: getId(),
          cognito_user_id: authUserdata.signInUserSession.idToken.payload.sub,
          email: singUpemail,
          first_name: firstName,
          last_name: lastName,
          user_role: "",
          phone: "",
          middle_name: "",
          profile_photo_url: "",
          country: "",
          state: "",
          city: "",
          address: "",
          zipcode: "",
          device_token: "",
          device_type: "",
          active: 1,
          email_verification: 1,
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        const role = collaboratorId ? "Collaborator" : propertyownerId ? "Property Owner" : "";
        if (role) {
          obj["user_role"] = role;
        }

        await createRecordTB("User", obj);
        dispatch(fetchUser(singUpemail));

        if (role === "Collaborator" || role === "Property Owner") {
          if (role !== "Collaborator") {
            dispatch(createDefaultPortfolio(obj.email, obj.id, obj.first_name, obj.last_name));
            if (role !== "Property Owner") {
              navigate("/WhatYouDo");
            } else {
              navigate("/Dashboard", { state: { isOpen: true } });
            }
          } else {
            navigate("/Dashboard", { state: { isOpen: true } });
          }
        } else {
          dispatch(createDefaultPortfolio(obj.email, obj.id, obj.first_name, obj.last_name));
          if (role !== "Property Owner") {
            navigate("/WhatYouDo");
          } else {
            navigate("/Dashboard", { state: { isOpen: true } });
          }
        }
        dispatch(setLoading(false));
      }
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong while signUp.\n please contact support team.");
    }
  };

  return (
    <Tabs defaultActiveKey="signin">
      <Tab eventKey="signup" title="Sign Up">
        <AppButton
          type="button"
          classes="w-100 mb-3 apple-app"
          image={require("../Assets/images/apple.svg").default}
          title="Sign Up with Apple"
          onClick={() => onSocialClick("SignInWithApple", "signup")}
        />
        <AppButton
          type="button"
          classes="w-100"
          image={require("../Assets/images/google.svg").default}
          title="Sign Up with Google"
          onClick={() => onSocialClick("Google", "signup")}
        />
        <p className="text-grey text-center mb-0 py-4 fw-bold">or</p>
        <AppButton type="button" classes="w-100 mb-3" title="Sign Up with Email" onClick={goToSignUpEmail} />
        <p className="text-center mb-1">
          Are you a Tenant?{" "}
          <a href={envFile.TENANT_PORTAL_LINK} target="_self">
            <strong>Sign up here</strong>
          </a>
        </p>
      </Tab>
      <Tab eventKey="signin" title="Sign In">
        <AppButton
          type="button"
          classes="w-100 mb-3 apple-app"
          image={require("../Assets/images/apple.svg").default}
          title="Sign In with Apple"
          onClick={() => onSocialClick("SignInWithApple", "signin")}
        />
        <AppButton
          type="button"
          classes="w-100"
          image={require("../Assets/images/google.svg").default}
          title="Sign In with Google"
          onClick={() => onSocialClick("Google", "signin")}
        />
        <p className="text-grey text-center mb-0 py-4 fw-bold">or</p>
        <AppButton
          type="button"
          classes="w-100 mb-3"
          onClick={() => navigate("/SignInEmail")}
          title="Sign In with Email"
        />
        <p className="text-center mb-0">
          Don't have an account?{" "}
          <Link to="/SignUpEmail">
            <strong>Sign Up</strong>
          </Link>
        </p>
      </Tab>
    </Tabs>
  );
}
