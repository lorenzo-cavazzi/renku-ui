import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { BrowserRouter as Router, Route } from "react-router-dom";
import * as Sentry from "@sentry/browser";
import "bootstrap";
import "jquery";
// Use our version of bootstrap, not the one in import 'bootstrap/dist/css/bootstrap.css';
import "./styles/index.css";
import "./index.css";
import App from "./App";
import { Maintenance } from "./Maintenance";
// Disable service workers for the moment -- see below where registerServiceWorker is called
// import registerServiceWorker from './utils/ServiceWorker';
import APIClient from "./api-client";
import { UserCoordinator } from "./user";
import { LoginHelper } from "./authentication";
import { StateModel, globalSchema } from "./model";
import { Url } from "./utils/url";

const configFetch = fetch("/config.json");
const privacyFetch = fetch("/privacy-statement.md");

Promise.all([configFetch, privacyFetch]).then(valuesRead => {
  const [configResp, privacyResp] = valuesRead;
  const configRead = configResp.json();
  const privacyRead = privacyResp.text();

  Promise.all([configRead, privacyRead]).then(values => {
    const [params, privacy] = values;

    // adjust boolean param values
    for (const val of Object.keys(params)) {
      if (params[val] === "false")
        params[val] = false;
      else if (params[val] === "true")
        params[val] = true;
    }

    // map privacy statement to parameters
    // ? checking DOCTYPE prevents setting content from bad answers on valid 2xx responses
    if (!privacy || !privacy.length || privacy.startsWith("<!DOCTYPE html>"))
      params["PRIVACY_STATEMENT"] = null;
    else
      params["PRIVACY_STATEMENT"] = privacy;

    // show maintenance page when necessary
    const maintenance = params["MAINTENANCE"];
    if (maintenance) {
      ReactDOM.render(<Maintenance info={maintenance} />, document.getElementById("root"));
      return;
    }

    // configure base url
    Url.setBaseUrl(params["BASE_URL"]);

    // create client to be passed to coordinators
    const client = new APIClient(params.GATEWAY_URL);

    // Create the global model containing the formal schema definition and the redux store
    const model = new StateModel(globalSchema);

    // Query user data
    const userCoordinator = new UserCoordinator(client, model.subModel("user"));
    let userPromise = userCoordinator.fetchUser();

    // configure Sentry
    if (params.SENTRY_URL) {
      Sentry.init({
        dsn: params.SENTRY_URL,
        environment: params.SENTRY_NAMESPACE ? params.SENTRY_NAMESPACE : "unknown",
        // tracesSampler(samplingContext) {
        //   console.log("here")
        //   console.log(samplingContext)
        // },
        beforeSend(event, hint) {
          // ? return null to prevent sending the exception to sentry
          console.log(event, hint)

          // filter errors while previewing the notebooks
          if (event.request.url.includes("/files/blob/") && event.request.url.includes(".ipynb"))
            return null;
          
          // prevent 

          return event;
        },
        denyUrls: [
          /extensions\//i, // Chrome extensions 1
          /^chrome:\/\//i, // Chrome extensions 2
        ],
      });
      Sentry.setTags({
        component: "renku-ui",
        version: params.UI_VERSION
      });
      //Sentry.setTag("component", "renku-ui");
      //Sentry.setTag("environment", params.SENTRY_NAMESPACE);
      //Sentry.setTag("version", params.UI_VERSION);
      // Sentry.configureScope(scope => {
      //   scope.setTag("component", "renku-ui");
      //   scope.setTag("environment", params.SENTRY_NAMESPACE);
      //   scope.setTag("version", params.UI_VERSION);
      // });
      //Sentry.configureScope(scope => { scope.setTag("version", params.UI_VERSION); });
      userPromise.then(data => {
        let user = { logged: false, id: 0, username: null, email: null, signIn: null };
        if (data && data.id) {
          user.logged = true;
          user.id = data.id;
          user.username = data.username;
          user.email = data.email;
          user.signIn = data.current_sign_in_at;
        }
        //console.log(data, user);
        // eslint-disable-next-line
        //Sentry.configureScope(scope => { scope.setUser(user); });
        Sentry.setUser(user);
        if (user.username)
          Sentry.setTag("user.username", user.username);
        console.testForSentry3()
      });
    }

    // Map redux data to react - note we are mapping the model, not its whole content (only user)
    // Use model.get("something") and map it wherever needed
    function mapStateToProps(state, ownProps) {
      return { user: state.user, ...ownProps };
    }

    const statuspageId = params["STATUSPAGE_ID"];

    const VisibleApp = connect(mapStateToProps)(App);
    ReactDOM.render(
      <Router>
        <Route render={props => {
          LoginHelper.handleLoginParams(props.history);
          return (
            <VisibleApp client={client} params={params} store={model.reduxStore} model={model}
              statuspageId={statuspageId} location={props.location}
            />
          );
        }} />
      </Router>,
      document.getElementById("root")
    );
  });
});
