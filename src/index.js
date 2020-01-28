import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux'
import { createStore } from './utils/EnhancedState';
// Use our version of bootstrap, not the one in import 'bootstrap/dist/css/bootstrap.css';
import './styles/index.css';
import './index.css';
import App from './App';
// Disable service workers for the moment -- see below where registerServiceWorker is called
// import registerServiceWorker from './utils/ServiceWorker';
import APIClient from './api-client'
import { UserState, reducer} from './app-state'; // TODO TEMOVE ME, leave the line below instead
import { UserCoordinator } from './user'
import { StateModel, globalSchema } from './model'

const configPromise = fetch('/config.json');

configPromise.then((res) => {
  res.json().then((params) => {
    // create client to be passed to coordinators
    const client = new APIClient(params.GATEWAY_URL);

    // Create the global model containing the formal schema definition and the redux store
    const model = new StateModel(globalSchema);
    // ! TEMP TODO REMOVE ME
    console.log("model: ", model)

    // Query user data
    const userCoordinator = new UserCoordinator(client, model.subModel("user"));
    userCoordinator.fetchUser();
    //  OLD USER DATA
    const store = createStore(reducer); // TODO: Remove
    UserState.fetchAppUser(client, store.dispatch);  // TODO: Remove

    // Map app
    // TODO: I guess I will still need this but I am not sure...
    function mapStateToProps(state, ownProps){
      return {...state, ...ownProps}
    }
    const VisibleApp = connect(mapStateToProps, null, null, { storeKey: 'userState' })(App);
    // const VisibleApp = connect(mapStateToProps)(App); // TODO: this should be enought
    // TODO: Remove below `userState={store}`
    ReactDOM.render(
      <VisibleApp client={client} params={params} store={model.reduxStore} userState={store} model={model} />,
      document.getElementById('root')
    );

    // The service worker is used for caching content offline, but it causes problems for URL routing.
    // registerServiceWorker()
  });
});
