import React, { useEffect } from "react";
import Container from "../../components/Layout/Container";
import DocumentGroupCard from "../../components/Documents/DocumentGroupCard";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPropertyDocuments } from "../../Utility/ApiService";

export default function PropertyDocuments() {
  const { state } = useLocation();
  const dispatch = useDispatch();
  const allPropertyDocuments = useSelector(({ allPropertyDocuments }) => allPropertyDocuments);

  const { propertyObj } = state;

  useEffect(() => {
    if (propertyObj?.id) {
      dispatch(fetchPropertyDocuments(propertyObj?.id));
    }
  }, [propertyObj]);

  return (
    <Container title="Documents" isBack>
      {allPropertyDocuments.length > 0 ? (
        <div className="documents-grid">
          {allPropertyDocuments.map((item) => (
            <DocumentGroupCard counts={0} isFolderView={false} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty text-center py-5">
          <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}
    </Container>
  );
}
