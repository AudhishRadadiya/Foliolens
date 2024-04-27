import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import Container from "../../components/Layout/Container";
import DocumentGroupCard from "../../components/Documents/DocumentGroupCard";

export default function DocumentsDetail() {
  const { state } = useLocation();
  const { item } = state;
  const allPropertyDocuments = useSelector(({ allPropertyDocuments }) => allPropertyDocuments);

  return (
    <Container title={item?.document_type} isBack>
      <div className="documents documents-grid">
        {Object.keys(allPropertyDocuments)?.length > 0 &&
          allPropertyDocuments?.data[item?.document_type_selected]?.map((item, i) => (
            <DocumentGroupCard key={i} isFolderView={false} item={item} />
          ))}
      </div>
    </Container>
  );
}
