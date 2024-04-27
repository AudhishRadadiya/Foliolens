import React from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import Amplify from "aws-amplify";
import { useSelector } from "react-redux";
import { ToastBar, Toaster, toast } from "react-hot-toast";
import { useIdleTimer } from "react-idle-timer";
import TagManager from "react-gtm-module";

import PrivateContainer from "./Routes/PrivateContainer";
import PublicContainer from "./Routes/PublicContainer";
import Verification from "./pages/Verification";

import awsExports from "./aws-exports";
import { ROUTES } from "./Routes";
import { SpinnerLoading } from "./components/Loadings";
import { logOut } from "./Utility";
import envFile from "./envFile";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-datepicker/dist/react-datepicker.css";
import "./Assets/styles/global.scss";
import "react-confirm-alert/src/react-confirm-alert.css";
import UpdateEmailVerification from "./pages/UpdateEmailVerification";

// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';

TagManager.initialize({
  gtmId: envFile.GTMID,
});
Amplify.configure(awsExports);

const App = () => {
  const isLoading = useSelector(({ isLoading }) => isLoading);
  // const stripePromise = loadStripe('pk_test_ks0IJmPV9SbyMKdd6dhB8L8z')

  const handleOnIdle = () => {
    console.log("user is idle and last active", getLastActiveTime());
    logOut();
  };

  const { getLastActiveTime } = useIdleTimer({
    timeout: 1800000, //
    onIdle: handleOnIdle,
    debounce: 500,
    crossTab: true,
  });

  return (
    <div className="h-100 overflow-auto">
      {/* <Elements stripe={stripePromise}> */}
      <Router>
        <Routes>
          {ROUTES.map(({ Component, isPrivate, path, roles, tabTitle }) => (
            <Route
              exact
              path={path}
              key={path}
              element={
                isPrivate ? (
                  <PrivateContainer tabTitle={tabTitle} roles={roles}>
                    <Component />
                  </PrivateContainer>
                ) : (
                  <PublicContainer tabTitle={tabTitle}>
                    <Component />
                  </PublicContainer>
                )
              }
            />
          ))}
          <Route exact path="/Verification/:id" element={<Verification />} />
          <Route exact path="/updateEmailVerfication/:token" element={<UpdateEmailVerification />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          error: {
            className: "alert error toast-contain",
          },
          success: {
            className: "alert success toast-contain",
          },
        }}
      >
        {(t) => (
          <ToastBar
            toast={t}
            children={(props) => (
              <div>
                {props.message}
                <p className="close-error" onClick={() => toast.dismiss(t.id)}>
                  {props.icon}
                </p>
              </div>
            )}
            style={{
              ...t.style,
              animation: t.visible ? "custom-enter 1s ease" : "custom-exit 1s ease",
            }}
          />
        )}
      </Toaster>
      <SpinnerLoading isLoading={isLoading} />
      {/* </Elements> */}
    </div>
  );
};

export default App;
