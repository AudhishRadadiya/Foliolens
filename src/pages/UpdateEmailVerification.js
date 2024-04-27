import React, { useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import envFile from "../envFile";
import { accessToken, logOut } from "../Utility";
import awsmobile from "../aws-exports";
import { setLoading } from "../store/reducer";
import jwt_decode from "jwt-decode";
import { Auth } from "aws-amplify";

const UpdateEmailVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    userVerify();
  }, []);

  const checkUser = async () => {
    try {
      await Auth.currentAuthenticatedUser()
      return true;
    } catch (error) {
      return false;
    }
  }

  const userVerify = async () => {
    try {
      dispatch(setLoading(true));
      const res = await accessToken();
      const userUpdateEmailData = jwt_decode(token);
      const response = await axios.post(
        `${envFile.PUBLIC_API_LINK}/updateEmail`,
        {
          userPoolId: awsmobile.aws_user_pools_id,
          token: token,
        },
        {
          headers: {
            Authorization: res.data.access_token,
          },
        }
      );

      dispatch(setLoading(false));
      if (response?.data?.status === 500) {
        toast.error(response?.data?.response);
        navigate("/");
        return;
      } else if (response?.data?.status === 200) {
        const currentUser = await checkUser()
        toast.success(response?.data?.response);
        if (currentUser === true) {
          logOut();
        }
        navigate("/");
      }
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
      toast.error("Something went wrong!");
    }
  };
  return <div></div>;
};

export default UpdateEmailVerification;
