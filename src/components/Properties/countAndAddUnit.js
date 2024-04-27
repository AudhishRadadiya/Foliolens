import { toast } from "react-hot-toast";
import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";

import { updateStripeUnits } from "../../graphql/mutations";
import { getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { store } from "../../store/index";
import { setLoading } from "../../store/reducer";
import { useconfirmAlert } from "../../Utility/Confirmation";
import { ROLES } from "../../Utility";

const updateUnits = async (newUnits, oldUnits, usedUnits) => {
  try {
    const { loggedUserData } = store.getState();
    let propertyUnits = newUnits ? newUnits : 1;
    if (oldUnits) {
      propertyUnits = Math.abs(oldUnits - propertyUnits);
    }
    const total_units = parseInt(usedUnits.no_of_units) - parseInt(usedUnits.used_units) - parseInt(propertyUnits);
    const data_units = Math.abs(total_units) + usedUnits.no_of_units;
    const data = await API.graphql(
      graphqlOperation(updateStripeUnits, {
        subscriptionId: loggedUserData.stripe_subscription_id,
        units: parseInt(data_units),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      })
    );
    if (data?.data?.updateStripeUnits?.status === 200) {
      await updateRecordTB("User", {
        id: loggedUserData.id,
        no_of_units: parseInt(data_units),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      });
      store.dispatch(setLoading(false));
    } else {
      toast.error("You cannot update a subscription that is canceled or incomplete_expired");
      store.dispatch(setLoading(false));
    }
  } catch (err) {
    console.log("Update stripe units Err", err);
    store.dispatch(setLoading(false));
  }
};

export const countAndAddUnit = async (newUnits, oldUnits, portfolioId) => {
  store.dispatch(setLoading(true));
  const { allPortfolio, sharedPortfolio, loggedUserData } = store.getState();
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];

  const isSharedPortfolio =
    loggedUserData.user_role === ROLES.Collaborator || loggedUserData.user_role === ROLES.PropertyOwner
      ? allPortfolios.find((item1) => item1.id === Number(portfolioId) && item1?.is_collaborator === 1)
      : false;

  const response = await getRdsFN("userUsedUnits", {
    userId: isSharedPortfolio ? isSharedPortfolio.user_id : loggedUserData.id,
  });
  const usedUnits = response[0];

  const propertyUnits = newUnits ? parseInt(newUnits) : 1;
  let isUnitsLimits;

  if (parseInt(usedUnits.used_units) + propertyUnits > 2500) {
    toast.error(
      "You can manage only upto 2500 units. To add more units please contact the Foliolens team from our website."
    );
    store.dispatch(setLoading(false));
    return false;
  }

  let pUnits = 0;
  if (oldUnits) {
    if (oldUnits === propertyUnits) {
      pUnits = 0;
    } else {
      pUnits = propertyUnits - oldUnits;
    }
    isUnitsLimits = oldUnits < propertyUnits && usedUnits.no_of_units < usedUnits.used_units + Math.abs(pUnits);
  } else {
    isUnitsLimits = usedUnits.no_of_units - usedUnits.used_units - propertyUnits < 0;
  }
  console.log("loggedUserData?.user_role ", loggedUserData?.user_role);

  if (isUnitsLimits && loggedUserData?.user_role !== "Property Owner") {
    return new Promise((resolve, reject) => {
      useconfirmAlert({
        onConfirm: async () =>
          updateUnits(newUnits, oldUnits, usedUnits)
            .then(() => {
              store.dispatch(setLoading(false));
              resolve(true);
            })
            .catch((e) => reject(e)),
        onCancel: () => {
          store.dispatch(setLoading(false));
          resolve(false);
        },
        isDelete: false,
        isOnlyOk: isSharedPortfolio ? true : false,
        title: isSharedPortfolio ? "Unit limit reached on your subscription" : "Confirm Subscription change?",
        dec: isSharedPortfolio
          ? `Your current subscription plan allows upto ${parseInt(
              usedUnits.no_of_units
            )} units,\n please ask your Property Manager to upgrade their subscription to onboard additional units.`
          : `Your current subscription plan allows upto ${parseInt(
              usedUnits.no_of_units
            )} units, this action will change your subscription plan to ${
              usedUnits.used_units + parseInt(oldUnits ? pUnits : propertyUnits)
            } units and you will be charged for the additional units.\n Confirm to proceed?`,
      });
    });
  } else {
    return true;
  }
};
