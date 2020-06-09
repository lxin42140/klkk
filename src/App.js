import React, { Component } from "react";
import { Route, withRouter, Switch, Redirect } from "react-router-dom";
import BusArrivalTime from "./containers/BusArrivalTime";

/*
1. track arrival time all buses of a particular bus service at various bus stops along its route
2. track the capacity for all buses of a particular bus service
3. track all bus service arrival times for all required bus stops
*/

class App extends Component {
  render() {
    let routes = (
      <Switch>
        <Route path="/" exact component={BusArrivalTime} />
        <Redirect to="/" />
      </Switch>
    );
    return (
      <div>
        <h1 style={{ textAlign: "center" }}>Bus arrival time tracker</h1>
        {routes}
      </div>
    );
  }
}

export default withRouter(App);
