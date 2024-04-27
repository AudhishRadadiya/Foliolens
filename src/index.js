import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./store";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import envFile from "./envFile";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <GoogleReCaptchaProvider reCaptchaKey={envFile.reCaptchaKey}>
    <Provider store={store}>
      <App />
    </Provider>
  </GoogleReCaptchaProvider>
  // </React.StrictMode>
);
