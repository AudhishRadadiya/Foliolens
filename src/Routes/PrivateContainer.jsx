import { Auth } from "aws-amplify";
import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { SpinnerLoading } from "../components/Loadings";
import { logOut } from "../Utility";
import {
  fetchAllPortfolios,
  fetchAllProperties,
  fetchAllTenants,
  fetchDocumentTypes,
  fetchNotifications,
  fetchPropertyParentCategory,
  fetchTenantCategory,
  fetchTransactionCategory,
  fetchUser,
} from "../Utility/ApiService";
import envFile from "../envFile";

const PrivateContainer = ({ children, roles, tabTitle }) => {
  const [isLoggedIn, setisLoggedIn] = useState(false);
  const [isLoadinng, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (tabTitle) document.title = tabTitle;
  }, [tabTitle]);

  const checkAuth = async () => {
    try {
      const data = await Auth.currentAuthenticatedUser();
      const resUser = await dispatch(fetchUser(data.attributes?.email));
      if (data.attributes?.identities && !resUser) {
        setLoading(false);
        setisLoggedIn(true);
        return;
      }
      if (!roles.includes(resUser?.user_role) && loggedUserData?.stripe_subscription_id) {
        await logOut();
        throw new Error("role is not match");
      }

      if (resUser?.email_verification !== 1) {
        const createdDate = moment(resUser?.created_at);
        const today = moment();
        const noOfday = today.diff(createdDate, "days");
        if (noOfday > envFile.EXPIRED_DAY) {
          navigate("/EmailNotVerify");
        }
      }
      dispatch(fetchAllPortfolios());
      dispatch(fetchAllProperties());
      dispatch(fetchDocumentTypes());
      dispatch(fetchNotifications());
      dispatch(fetchPropertyParentCategory());
      dispatch(fetchTenantCategory());
      dispatch(fetchTransactionCategory());
      dispatch(fetchAllTenants());

      setLoading(false);
      setisLoggedIn(true);
    } catch {
      navigate("/");
      setLoading(false);
      setisLoggedIn(false);
    }
  };

  return isLoadinng ? (
    <div className="loadingSpinner">
      <SpinnerLoading />
    </div>
  ) : isLoggedIn ? (
    <div>{children}</div>
  ) : null;
};

export default PrivateContainer;
