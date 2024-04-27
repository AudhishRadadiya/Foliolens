import { useEffect } from "react";
import { Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";

const PublicContainer = ({ children, isSingup, tabTitle }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSingup) {
      checkAuth();
    }
  }, []);

  useEffect(() => {
    document.title = tabTitle;
  }, [tabTitle]);

  const checkAuth = async () => {
    try {
      await Auth.currentAuthenticatedUser();
      navigate("/Dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  return children;
};

export default PublicContainer;
