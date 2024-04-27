import React, { useEffect } from "react";
import axios from "axios";
import { setLoading } from "../store/reducer";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import envFile from "../envFile";
import { accessToken } from "../Utility";

export default function Verification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [userId, uuid] = id.split("~");

  useEffect(() => {
    userVerify();
  }, []);

  const userVerify = async () => {
    try {
      dispatch(setLoading(true));
      const res = await accessToken();
      const response = await axios.post(
        `${envFile.PUBLIC_API_LINK}/verifyEmail`,
        {
          role: "User",
          id: userId,
          uuid,
        },
        {
          headers: {
            Authorization: res.data.access_token,
          },
        }
      );

      dispatch(setLoading(false));
      if (response.data?.status === 200) {
        navigate("/");
      } else {
        toast.error(response.data?.response || "Invalid Link!");
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Invalid Link!");
    }
  };

  return <div></div>;
}
