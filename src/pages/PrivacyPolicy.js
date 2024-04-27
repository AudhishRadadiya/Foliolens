import React from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { useDispatch, useSelector } from "react-redux";
import { fetchContentfulData } from "../Utility/ApiService";

export default function PrivacyPolicy() {
  const dispatch = useDispatch();
  const contentFullData = useSelector(({ contentFullData }) => contentFullData);

  React.useEffect(() => {
    dispatch(fetchContentfulData("Privacy Policy"));
  }, []);

  return <div style={{ margin: 20 }}>{contentFullData && documentToReactComponents(contentFullData)}</div>;
}
