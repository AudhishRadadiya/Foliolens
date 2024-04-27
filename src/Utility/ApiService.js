import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";
import axios from "axios";
import envFile from "../envFile";
import { accessToken } from ".";
import toast from "react-hot-toast";
import { ROLES } from ".";
import { addPortfolio, createLambdaResolver, deleteRdsData, updateLambdaResolver } from "../graphql/mutations";
import {
  getDocumentFromS3,
  getLambdaResolver,
  getPlaidBankLogos,
  getRdsData,
  getSignedUrl,
  getStripeHistory,
  getStripePlans,
  getStripePrices,
  getTaxPayerId,
  listLambdaResolver,
} from "../graphql/queries";
import {
  setAllBankAccounts,
  setTransactionCategory,
  setTenantCategory,
  setAllCollaborators,
  setAllDocumentTypes,
  setAllProperties,
  setAllPropertyDocuments,
  setAllTasksReminders,
  setAllTransactions,
  setCanAddBankAccount,
  setCanAddTransactions,
  setCategoryPropertyParent,
  setContentFullData,
  setLoading,
  setloggedUserData,
  setNotifications,
  setOwnersPortfolio,
  setPaymentMethods,
  setPortfolios,
  setProcessDocument,
  setStripePaymentHistory,
  setStripePlans,
  setTenantProperties,
  setTenants,
  setDashboardData,
  setDashboardLayout,
  setInviteCollaboratorData,
} from "../store/reducer";
import { AlphbeticallySort } from "./GenericFuns";

export const getRdsFN = async (name, payload) => {
  if (name === "tbSelect") {
    payload = { ...payload, act: 1 };
  }
  return API.graphql(
    graphqlOperation(getRdsData, {
      name: name,
      data: JSON.stringify(payload),
    })
  ).then((res) => JSON.parse(res.data.getRdsData.response));
};

export const createRecordTB = async (tblName, payload) => {
  return API.graphql(
    graphqlOperation(createLambdaResolver, {
      table: tblName,
      data: JSON.stringify(payload),
    })
  ).then((res) => {
    const res1 = res.data.createLambdaResolver;
    if (res1.status === 200) {
      return JSON.parse(res1.response);
    } else {
      throw { message: res1.response };
    }
  });
};

export const updateRecordTB = async (tblName, payload) => {
  return API.graphql(
    graphqlOperation(updateLambdaResolver, {
      table: tblName,
      data: JSON.stringify(payload),
    })
  ).then((res) => {
    const res1 = res.data.updateLambdaResolver;
    if (res1.status === 200) {
      return JSON.parse(res1.response);
    } else {
      throw { message: res1.response };
    }
  });
};

export const getRecordTB = async (tblName, id) => {
  try {
    const res = await API.graphql(
      graphqlOperation(getLambdaResolver, {
        table: tblName,
        id: parseInt(id),
      })
    );
    if (res?.data?.getLambdaResolver?.status === 200) {
      return JSON.parse(res?.data?.getLambdaResolver?.response);
    }
    return {};
  } catch (err) {
    console.log("ERROR getRecordTB", err);
  }
};

export const deleteRecordTB = async (name, payload) => {
  return API.graphql(
    graphqlOperation(deleteRdsData, {
      name,
      data: JSON.stringify(payload),
    })
  ).then((res) => {
    console.log("res", res);
    const res1 = res.data.deleteRdsData;
    if (res1.status === 200) {
      return res1.response;
    } else {
      throw { message: res1.response };
    }
  });
};

export const getFile = async (key) => {
  const { data } = await API.graphql(
    graphqlOperation(getSignedUrl, {
      fileName: key,
      folderName: "property",
      level: "public",
    })
  );
  return data.getSignedUrl.response;
};

export const filterPropertyOwner = async (email) => {
  return getRdsFN("tbSelect", {
    source: "pOwn",
    email: email,
  });
};

export const fetchUser =
  (email, isNotStop = false) =>
  async (dispatch) => {
    dispatch(setLoading(true));
    const user = await getRdsFN("tbSelect", {
      source: "usr",
      email: email,
    });

    const collab_user = await getRdsFN("tbSelect", {
      source: "coll",
      email: user[0]?.email,
    });

    if (user[0]?.user_role === ROLES.Collaborator) {
      const res = await getRdsFN("tbSelect", {
        source: "collb",
        email: email,
        act: 1,
      });
      if (res && res.length && res[0]?.permission === "View Only") {
        dispatch(setCanAddBankAccount(false));
        dispatch(setCanAddTransactions(false));
      }
    }

    if (user[0]?.user_role === ROLES.PropertyOwner) {
      const res = await getRdsFN("checkCollab", {
        email: email,
      });

      dispatch(setCanAddTransactions(true));

      if (!res[0]?.invited) {
        dispatch(setCanAddBankAccount(false));
      }
    }

    dispatch(setloggedUserData(user[0]));
    dispatch(setInviteCollaboratorData(collab_user[0]));
    if (!isNotStop) dispatch(setLoading(false));
    return user[0];
  };

export const fetchAllTenants = () => async (dispatch, store) => {
  try {
    const loggedUserData = store().loggedUserData;
    dispatch(setLoading(true));
    const response = await getRdsFN("tenants", {
      userId: loggedUserData?.id,
      email: loggedUserData?.email,
    });
    const groupByProperties = [];
    response.forEach((item) => {
      const isExit = groupByProperties.find((i) => i.property_id === item.property_id);
      if (isExit) {
        isExit.tenants.push(item);
      } else {
        groupByProperties.push({
          property_id: item.property_id,
          property_name: item.address1,
          tenants: [item],
        });
      }
    });
    dispatch(setTenants(groupByProperties));
    dispatch(setLoading(false));
    return groupByProperties;
  } catch (error) {
    console.log(error);
    dispatch(setLoading(false));
    toast.error("Error fetching tenants.");
  }
};

export const fetchAllOwnersPortfolio = () => async (dispatch, store) => {
  const loggedUserData = store().loggedUserData;
  dispatch(setLoading(true));
  // const response = await getRdsFN("pOwnerPortfolio", {
  //   userId: loggedUserData.id,
  // });portfolioOwners
  const response = await getRdsFN("portfolioOwners", {
    userId: loggedUserData.id,
  });
  const grouppByResponse = [];
  response.forEach((item) => {
    const isExit = grouppByResponse.find((i) => i.portfolio_id === item.portfolio_id);
    if (isExit) {
      isExit.owners.push(item);
    } else {
      grouppByResponse.push({
        portfolio_id: item.p_id,
        portfolio_name: item.portfolio_name,
        owners: [item],
      });
    }
  });
  dispatch(setOwnersPortfolio(grouppByResponse));
  dispatch(setLoading(false));
  return grouppByResponse;
};

export const fetchStripePlans = (userType) => async (dispatch, store) => {
  dispatch(setLoading(true));
  const response = await API.graphql(graphqlOperation(getStripePlans));
  const parsedData = JSON.parse(response.data.getStripePlans.response);
  const userPlan = parsedData.data.find((item) => item.metadata?.user_type === userType);
  const mapData = await API.graphql(
    graphqlOperation(getStripePrices, {
      productId: userPlan?.id,
    })
  )
    .then((dataRes) => {
      let planPrice = JSON.parse(dataRes.data.getStripePrices.response);
      return { ...userPlan, planPrice };
    })
    .catch((error) => {
      console.log(error);
      dispatch(setLoading(false));
    });

  dispatch(setLoading(false));
  dispatch(setStripePlans(mapData));
  return mapData;
};

export const updateUserFN =
  (data, isNotStop = false) =>
  async (dispatch, store) => {
    const loggedUserData = store().loggedUserData;
    dispatch(setLoading(true));

    const userRes = await updateRecordTB("User", {
      id: loggedUserData?.id,
      ...data,
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
    });
    await dispatch(fetchUser(loggedUserData.email, isNotStop)); // do not remove await
    if (!isNotStop) dispatch(setLoading(false));
    return userRes;
  };

export const fetchAllPortfolios = () => async (dispatch, store) => {
  try {
    const loggedUserData = store().loggedUserData;
    dispatch(setLoading(true));
    const response = await getRdsFN(
      loggedUserData?.user_role === "Property Owner" ? "sharedPortfolioOwner" : "sharedPortfolio",
      {
        userId: loggedUserData?.id,
        email: loggedUserData?.email,
      }
    );
    dispatch(setPortfolios(response));
    dispatch(setLoading(false));
    return response;
  } catch (error) {
    console.log(error);
    dispatch(setLoading(false));
    toast.error("Error fetching portfolios");
  }
};

export const fetchAllProperties = () => async (dispatch, store) => {
  try {
    dispatch(setLoading(true));
    const loggedUserData = store().loggedUserData;
    const response = await getRdsFN("allProperties", {
      userId: loggedUserData?.id,
      email: loggedUserData?.email,
    });

    const PropertiesWithAllData = await Promise.all(
      response.map(async (property) => {
        let cover_photo =
          "https://foliolensprod160448-production.s3.amazonaws.com/public/Logos/property_placeholder.jpg";
        let photos = [];

        let dd = [];
        if (property.cover_photo) {
          dd = property.cover_photo.split(",");
          photos = await Promise.all(dd.map((item) => getFile(item.replace("property/", ""))));
          cover_photo = photos[0];
        }

        return {
          ...property,
          cover_photo,
          photos: photos,
          mainCoverPhotos: dd,
        };
      })
    );
    dispatch(setAllProperties(PropertiesWithAllData));
    dispatch(setLoading(false));
    return response;
  } catch (error) {
    console.log(error);
    dispatch(setLoading(false));
    toast.error("Error fetching Properties");
  }
};

export const fetchBankAccounts = () => async (dispatch, store) => {
  try {
    dispatch(setLoading(true));
    const loggedUserData = store().loggedUserData;
    const accounts = await getRdsFN("bankAccounts", {
      userId: loggedUserData.id,
    });

    const bankAccounts = await getBankAccountPhotos(accounts);

    dispatch(setAllBankAccounts(bankAccounts.filter((item) => item.account_active || item.business_account === 1)));
    dispatch(setLoading(false));

    return bankAccounts;
  } catch (err) {
    dispatch(setLoading(false));
    console.log("getBusinessAccounts Error", err);
    toast.error("Error fetching Bank Accounts");
  }
};

export const getBankAccountPhotos = (bankAccounts) => {
  return Promise.all(
    bankAccounts.map((bankAccount) => {
      if (bankAccount.bankLogo !== null) {
        return API.graphql(
          graphqlOperation(getPlaidBankLogos, {
            insitutionID: bankAccount?.institution_id,
          })
        ).then((result) => {
          let res = result.data.getPlaidBankLogos.response;
          return { ...bankAccount, bankLogo: res };
        });
      } else {
        return { ...bankAccount, bankLogo: "https://foliolens160827-dev.s3.amazonaws.com/public/property/house.jpeg" };
      }
    })
  );
};

export const fetchTenantProperties = () => async (dispatch, store) => {
  const loggedUserData = store().loggedUserData;
  dispatch(setLoading(true));
  const response = await getRdsFN("tenantProperties", {
    userId: loggedUserData.id,
    email: loggedUserData.email,
  });
  dispatch(setTenantProperties(response));
  dispatch(setLoading(false));
  return response;
};

export const onGetTaxPayerId = async (taxPayerId) => {
  return API.graphql(
    graphqlOperation(getTaxPayerId, {
      token: taxPayerId,
    })
  ).then((res) => {
    return res.data.getTaxPayerId.response;
  });
};

export const fetchInProgressDocsDocuments = () => async (dispatch, store) => {
  dispatch(setLoading(true));
  const loggedUserData = store().loggedUserData;
  const response = await getRdsFN("inProgressDocs", {
    userId: loggedUserData.id,
    act: 1,
  });
  const document2withURL = await fetchDocumentFromS3(response);
  const dataVal = document2withURL.sort((a, b) => moment(b.created_at) - moment(a.created_at));
  dispatch(setProcessDocument(dataVal));
  dispatch(setLoading(false));
  return response;
};

export const fetchPropertyDocuments = (propertyId, docId) => async (dispatch, store) => {
  dispatch(setLoading(true));
  const loggedUserData = store().loggedUserData;
  const response = await getRdsFN("allPropertyDocuments", {
    userId: loggedUserData.id,
    ...(propertyId !== "All" && { propertyId: propertyId ? propertyId : "" }),
    fetchDocument: true,
    documentType: docId ? docId : "",
  });
  const documentwithURL = await fetchDocumentFromS3(response);
  let dTypes = {};
  let dTypeData = {};

  documentwithURL.map((doc) => {
    if (dTypeData.hasOwnProperty(doc.document_type_selected)) {
      dTypes[doc.document_type_selected].count += 1;
      dTypes[doc.document_type_selected].permission =
        dTypes[doc.document_type_selected].permission === "View Only" ? "View Only" : "Manage";
      dTypeData[doc.document_type_selected].push(doc);
    } else {
      dTypes[doc.document_type_selected] = {
        document_type: doc.document_type,
        document_type_selected: doc.document_type_selected,
        count: 1,
        permission: doc.permission,
      };
      dTypeData[doc.document_type_selected] = [doc];
    }
  });

  dispatch(setAllPropertyDocuments({ types: Object.values(dTypes), data: dTypeData, allDocs: documentwithURL }));
  dispatch(setLoading(false));
  return response;
};

export const fetchCollaborators = (pFolioIds) => async (dispatch, store) => {
  dispatch(setLoading(true));
  const loggedUserData = store().loggedUserData;
  // const response = await getRdsFN("tbSelect", {
  //   source: "collb",
  //   ...(pFolioIds
  //     ? {
  //         in: {
  //           field: "pfolioId",
  //           data: pFolioIds,
  //         },
  //       }
  //     : { usrId: loggedUserData.id }),
  //   act: 1,
  // });
  const res = await API.graphql(
    graphqlOperation(getRdsData, {
      name: "collaborators",
      data: JSON.stringify({
        userId: loggedUserData.id,
      }),
    })
  );
  const collabs = JSON.parse(res.data.getRdsData.response);

  dispatch(setAllCollaborators(collabs));
  dispatch(setLoading(false));
};

export const fetchDocumentFromS3 = async (docs) => {
  return Promise.all(
    docs.map(async (doc) => {
      const res = await API.graphql(graphqlOperation(getDocumentFromS3, { fileName: doc.document_name }));
      let data = res.data.getDocumentFromS3.response;
      return { ...doc, url: data };
    })
  );
};

export const fetchDocumentTypes = () => async (dispatch) => {
  dispatch(setLoading(true));
  const response = await API.graphql(graphqlOperation(listLambdaResolver, { table: "DocumentType" }));
  const data = JSON.parse(response.data.listLambdaResolver.response || "[]");
  const categoryInfo = data.map((c) => ({
    ...c,
    text: c.document_type,
  }));

  const sortedList = AlphbeticallySort(categoryInfo);

  dispatch(setAllDocumentTypes(sortedList));
  dispatch(setLoading(false));
  return response;
};

export const fetchStripeHistory = () => async (dispatch, store) => {
  try {
    const loggedUserData = store().loggedUserData;
    dispatch(setLoading(true));
    const res = await API.graphql(
      graphqlOperation(getStripeHistory, {
        customerId: loggedUserData.stripe_customer_id,
        subscriptionId: loggedUserData.stripe_subscription_id,
      })
    );
    const resData = JSON.parse(res.data.getStripeHistory.response);
    if (resData?.statusCode !== 400) {
      dispatch(setStripePaymentHistory(resData));
    }
    dispatch(setLoading(false));
  } catch (error) {
    console.log("err fetchStripeHistory", error);
    dispatch(setLoading(false));
    toast.error("Error fetching Stripe History");
  }
};

export const fetchPaymentMethods = () => async (dispatch, store) => {
  try {
    const loggedUserData = store().loggedUserData;
    dispatch(setLoading(true));
    const dataRes = await getRdsFN("tbSelect", { source: "payMethod", cBy: loggedUserData?.id, act: 1 });
    dispatch(setPaymentMethods(dataRes));
    dispatch(setLoading(false));
  } catch (error) {
    console.log("err fetchPaymentMethods", error);
    dispatch(setLoading(false));
    toast.error("Error fetching payment methods");
  }
};

export const fetchAllTasksReminders = () => async (dispatch, store) => {
  try {
    dispatch(setLoading(true));
    const loggedUserData = store().loggedUserData;
    const response = await getRdsFN("events", { userId: loggedUserData.id });
    const activeTasksReminders = response.filter((item) => item.next_occurance !== null);
    for (let k = 0; k < activeTasksReminders.length; k++) {
      const UTCFormattedDate = moment(activeTasksReminders[k]?.next_occurance).format("MM/DD/YYYY HH:mm:SS UTC");
      var newDate = new Date(UTCFormattedDate);
      activeTasksReminders[k].next_occurance = moment(newDate).format("YYYY-MM-DD HH:mm:SS");
    }
    // setAllTasksReminders(activeTasksReminders);
    // reFormatMarkedDates(activeTasksReminders);
    dispatch(setAllTasksReminders(activeTasksReminders));
    dispatch(setLoading(false));
  } catch (error) {
    dispatch(setLoading(false));
    console.log("fetchAllTasksReminders error ", error);
  }
};

export const fetchContentfulData = (elementName) => async (dispatch, store) => {
  try {
    dispatch(setLoading(true));
    const tokenResponse = await accessToken();
    const res = await axios.post(
      `${envFile.PUBLIC_API_LINK}/getSignedUrl`,
      {
        level: "public",
        folderName: "contentful",
        fileName: "contentful_data.json",
      },
      {
        headers: {
          Authorization: tokenResponse?.data?.access_token,
        },
      }
    );
    const result = await fetch(res?.data?.response);
    const data = await result.json();
    let content_data = data || [];
    let filterData = content_data.length > 0 ? content_data.find((i) => i.fields.name === elementName) : null;
    const response = filterData?.fields?.html || filterData?.fields?.contentv2;
    dispatch(setContentFullData(response));
    dispatch(setLoading(false));
  } catch (error) {
    dispatch(setLoading(false));
    console.log("err fetchContentfulData", error);
  }
};

export const fetchTransactions = () => async (dispatch, store) => {
  try {
    dispatch(setLoading(true));
    const loggedUserData = store().loggedUserData;

    const data = await getRdsFN("transactions", {
      userId: loggedUserData.id,
      portfolioId: null,
    });

    dispatch(setAllTransactions(data));
    dispatch(setLoading(false));
  } catch (err) {
    dispatch(setLoading(false));
    console.log("Something went wrong while getting transaction history!", err);
  }
};

export const fetchNotifications = () => async (dispatch, store) => {
  try {
    dispatch(setLoading(true));
    const loggedUserData = store().loggedUserData;

    const parsed_data = await getRdsFN("tbSelect", {
      source: "unotif",
      orderBy: "cDate:desc",
      usrId: loggedUserData?.id,
      act: 1,
    });
    const filterNotification = parsed_data?.filter((notification) => {
      return notification.status !== "COMPLETED";
    });
    dispatch(setNotifications(filterNotification));
    dispatch(setLoading(false));
  } catch (err) {
    dispatch(setLoading(false));
    console.log("Something went wrong while getting Notifications", err);
  }
};

export const createDefaultPortfolio = (email, userId, first_name, last_name) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    await API.graphql(
      graphqlOperation(addPortfolio, {
        data: JSON.stringify({
          owners: [
            {
              ownership: 100,
              invite: false,
              email: email,
              last_name: last_name,
              first_name: first_name,
            },
          ],
          created_by: userId,
          portfolio_name: "Default Portfolio",
          time: moment().format("YYYY-MM-DD HH:mm:ss"),
        }),
      })
    );
    dispatch(setLoading(false));
  } catch (error) {
    console.log("Error adding Default Portfolio ", error);
    dispatch(setLoading(false));
    toast.error(error?.message || error.errors[0]?.message || error);
  }
};

export const fetchPropertyParentCategory = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await API.graphql(graphqlOperation(listLambdaResolver, { table: "ParentProformaCategory" }));
    const data = JSON.parse(response.data.listLambdaResolver.response || "[]");
    dispatch(setCategoryPropertyParent(data));
    dispatch(setLoading(false));
  } catch (error) {
    dispatch(setLoading(false));
    console.log(error);
  }
};

export const fetchTenantCategory = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await API.graphql(graphqlOperation(listLambdaResolver, { table: "TenantCategory" }));
    const data = JSON.parse(response.data.listLambdaResolver.response || "[]");
    dispatch(setTenantCategory(data));
    dispatch(setLoading(false));
  } catch (error) {
    dispatch(setLoading(false));
    console.log(error);
  }
};

export const fetchTransactionCategory = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await API.graphql(graphqlOperation(listLambdaResolver, { table: "TransactionCategory" }));
    const data = JSON.parse(response.data.listLambdaResolver.response || "[]");
    dispatch(setTransactionCategory(data));
    dispatch(setLoading(false));
  } catch (error) {
    dispatch(setLoading(false));
    console.log(error);
  }
};

export const fetchTransactionDocument = async (document_name) => {
  const res = await API.graphql(graphqlOperation(getDocumentFromS3, { fileName: document_name }));
  let data = res.data.getDocumentFromS3.response;
  return data;
};

export const fetchDashboardData = (portfolioIds) => async (dispatch, store) => {
  try {
    const loggedUserData = store().loggedUserData;
    dispatch(setLoading(true));
    const response = await getRdsFN("dashboardData", {
      userId: loggedUserData.id,
      portfolioIds,
    });

    dispatch(setDashboardData(response));
    dispatch(setLoading(false));
  } catch (error) {
    dispatch(setLoading(false));
    console.log(error);
  }
};

export const fetchDashboardLayout = () => async (dispatch, store) => {
  try {
    const loggedUserData = store().loggedUserData;

    const response = await getRdsFN("tbSelect", {
      source: "uDashboard",
      cBy: loggedUserData.id,
    });

    dispatch(setDashboardLayout(response?.length ? response[0] : {}));
  } catch (error) {
    console.log(error);
  }
};
