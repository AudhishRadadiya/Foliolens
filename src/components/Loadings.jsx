import React from "react";
import ClipLoader from "react-spinners/ClipLoader";
import Spinner from "react-spinner-material";

const SpinnerLoading = ({ isLoading }) => {
  if (isLoading) {
    return (
      <div className="loadingSpinner">
        <Spinner size={120} color={"#ffff"} visible={isLoading} />
      </div>
    );
  }
};

const ClipLoading = ({ loading = false, color = "#ccc" }) => (
  <ClipLoader loading={loading} color={color} height={"20%"} width={"20%"} />
);

export { ClipLoading, SpinnerLoading };
