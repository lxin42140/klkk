import React, { Component } from "react";
import { CSVLink } from "react-csv";
import moment from "moment";

import header from "../datamallHeader";
import datamallAxios from "../datamallAxios";
import Spinner from "../component/Spinner/Spinner";
import * as classes from "./BusArrivalTime.css";
import Input from "../component/Input/Input";
import Button from "../component/Button/Button";

//1. track arrival time all buses of a particular bus service at various bus stops along its route

/**
 * Query target: BusArrivalv2
 * Params: BusStopCode, ServiceNo
 */

var fetchDataInterval;
var scheduleInterval;

class BusArrivalTime extends Component {
  state = {
    inputBusStopCode: "",
    busStopCodes: [],
    inputBusServiceNumber: "",
    trackAllBuses: false,
    serviceNumber: "",
    inputStartDate: "",
    startDate: "",
    inputTimeStart: "",
    timeStart: "",
    inputTimeEnd: "",
    timeEnd: "",
    data: [["Arrival time", "Bus stop code", "Service Number"]],
    loading: false,
    scheduled: false,
    startedTracking: false,
  };

  componentDidUpdate(prevProps, prevState) {
    if (!this.state.startedTracking && this.state.scheduled) {
      scheduleInterval = setInterval(() => {
        if (
          Number(moment().format("HHmm")) >= this.state.timeStart &&
          Number(moment().format("DD")) === Number(this.state.startDate)
        ) {
          this.setState({
            startedTracking: true,
            loading: true,
          });
        }
      }, 10000);
    } else {
      clearInterval(scheduleInterval);
      if (this.state.startedTracking) {
        const busStopCodes = this.state.busStopCodes;
        if (this.state.trackAllBuses) {
          let finalData = Object.assign([], this.state.data);
          fetchDataInterval = setInterval(() => {
            this.fetchAllBusArrivalData(busStopCodes, 0, finalData).then(
              (res) => {
                finalData = res;
                if (Number(moment().format("HHmm")) >= this.state.timeEnd) {
                  console.log(finalData);
                  this.setState({
                    loading: false,
                    scheduled: false,
                    startedTracking: false,
                    data: finalData,
                  });
                }
              }
            );
          }, 60000);
        } else {
          const serviceNumber = this.state.serviceNumber;
          let finalData = Object.assign([], this.state.data);
          fetchDataInterval = setInterval(() => {
            this.fetchSpecificArrivalData(
              busStopCodes,
              serviceNumber,
              0,
              finalData
            ).then((res) => {
              finalData = res;
              if (Number(moment().format("HHmm")) >= this.state.timeEnd) {
                this.setState({
                  loading: false,
                  scheduled: false,
                  startedTracking: false,
                  data: finalData,
                });
              }
            });
          }, 60000);
        }
      } else {
        clearInterval(fetchDataInterval);
      }
    }
  }

  async fetchAllBusArrivalData(busStopCodes, index, updatedData) {
    while (index < busStopCodes.length) {
      await datamallAxios
        .get("BusArrivalv2?BusStopCode=" + busStopCodes[index], {
          headers: header,
        })
        // eslint-disable-next-line no-loop-func
        .then((response) => {
          for (let index in response.data["Services"]) {
            let data = [];
            const BusData = response.data["Services"][index];
            const serviceNumber = BusData.ServiceNo;
            const arrivalTime = BusData.NextBus.EstimatedArrival.split(
              "T"
            )[1].split("+")[0];
            let minutes = Number(arrivalTime.split(":")[1]);
            const oldData = updatedData.filter(
              (data) => data[1] === busStopCodes[index]
            );
            if (oldData.length > 0) {
              if (Math.abs(minutes - Number(oldData[0][0].split(":")[1])) > 2) {
                data.push(arrivalTime, busStopCodes[index], serviceNumber);
                updatedData.push(data);
              }
            } else {
              data.push(arrivalTime, busStopCodes[index], serviceNumber);
              updatedData.push(data);
            }
          }
        })
        .catch((error) => {
          alert("Error occurred: " + error);
          this.setState({
            loading: false,
            scheduled: false,
            startedTracking: false,
          });
        });
      index += 1;
    }
    return updatedData;
  }

  async fetchSpecificArrivalData(
    busStopCodes,
    serviceNumber,
    index,
    updatedData
  ) {
    while (index < busStopCodes.length) {
      let data = [];
      await datamallAxios
        .get(
          "BusArrivalv2?BusStopCode=" +
            busStopCodes[index] +
            "&ServiceNo=" +
            serviceNumber,
          { headers: header }
        )
        // eslint-disable-next-line no-loop-func
        .then((response) => {
          // getting latest arrival time
          const arrivalTime = response.data[
            "Services"
          ][0].NextBus.EstimatedArrival.split("T")[1].split("+")[0];
          // getting minutes
          let minutes = Number(arrivalTime.split(":")[1]);
          // get old data
          const oldData = updatedData.filter(
            (data) => data[1] === busStopCodes[index]
          );
          // if old data exists
          if (oldData.length > 0) {
            if (Math.abs(minutes - Number(oldData[0][0].split(":")[1])) > 2) {
              // if difference in minutes is more than 2, enter as new arrival time
              data.push(arrivalTime, busStopCodes[index], serviceNumber);
              updatedData.push(data);
            }
          } else {
            data.push(arrivalTime, busStopCodes[index], serviceNumber);
            updatedData.push(data);
          }
        })
        .catch((error) => {
          alert("Error occurred: " + error);
          this.setState({
            loading: false,
            scheduled: false,
            startedTracking: false,
          });
        });
      index += 1;
    }
    return updatedData;
  }

  BusServiceChangeHandler = (event) => {
    this.setState({
      inputBusServiceNumber: event.target.value,
    });
  };

  onConfirmServiceNumberHandler = (event) => {
    if (this.state.inputBusServiceNumber === "") {
      return;
    }
    this.setState({
      serviceNumber: this.state.inputBusServiceNumber,
      inputBusServiceNumber: "",
    });
  };

  BusCodeChangeHandler = (event) => {
    this.setState({
      inputBusStopCode: event.target.value,
    });
  };

  onConfirmBusStopCode = (event) => {
    if (this.state.inputBusStopCode.length !== 5) {
      alert("Please enter a valid bus stop code of 5 digits");
      return;
    }
    const updateBusStopCodes = Object.assign([], this.state.busStopCodes);
    updateBusStopCodes.push(this.state.inputBusStopCode);
    this.setState({
      busStopCodes: updateBusStopCodes,
      inputBusStopCode: "",
    });
  };

  onDeleteBusStopCode = (code) => {
    const updatedBusStopCodes = this.state.busStopCodes.filter(
      (value) => value !== code
    );
    this.setState({ busStopCodes: updatedBusStopCodes });
  };

  startTimeChangeHandler = (event) => {
    this.setState({ inputTimeStart: event.target.value });
  };

  onConfirmStartTime = (event) => {
    this.setState({ timeStart: this.state.inputTimeStart, inputTimeStart: "" });
  };

  endTimeChangeHandler = (event) => {
    this.setState({ inputTimeEnd: event.target.value });
  };

  onConfirmEndTime = (event) => {
    this.setState({ timeEnd: this.state.inputTimeEnd, inputTimeEnd: "" });
  };

  startDateChangeHandler = (event) => {
    this.setState({ inputStartDate: event.target.value });
  };

  onConfirmStartDate = (event) => {
    this.setState({ startDate: this.state.inputStartDate, inputStartDate: "" });
  };

  toggleTrackAllBus = (event) => {
    this.setState((prevState) => ({ trackAllBuses: !prevState.trackAllBuses }));
  };

  startTrackingHandler = () => {
    this.setState({
      scheduled: true,
    });
  };

  render() {
    return (
      <div>
        <div style={{ textAlign: "center" }}></div>
        <div className={classes.inputs}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {this.state.trackAllBuses ? (
              <p style={{ paddingLeft: "10px" }}>Tracking all buses</p>
            ) : (
              <Input
                type="number"
                value={this.state.inputBusServiceNumber}
                onChange={this.BusServiceChangeHandler}
                placeholder="Enter service number here"
                onClick={this.onConfirmServiceNumberHandler}
                buttonText="confirm bus service number"
              />
            )}
            <span style={{ paddingLeft: "10px" }}>
              <Button onClick={this.toggleTrackAllBus}>
                {this.state.trackAllBuses
                  ? "Off track all buses"
                  : "Track all buses"}
              </Button>
            </span>
          </div>
          <Input
            type="number"
            value={this.state.inputBusStopCode}
            onChange={this.BusCodeChangeHandler}
            placeholder="Enter bus stop code here"
            onClick={this.onConfirmBusStopCode}
            buttonText="confirm bus stop code"
          />
          <Input
            type="number"
            value={this.state.inputStartDate}
            onChange={this.startDateChangeHandler}
            placeholder="Enter start date in DD"
            onClick={this.onConfirmStartDate}
            buttonText="confirm start date"
          />
          <Input
            type="number"
            value={this.state.inputTimeStart}
            onChange={this.startTimeChangeHandler}
            placeholder="Enter start time in HHMM"
            onClick={this.onConfirmStartTime}
            buttonText="confirm start time"
          />
          <Input
            type="number"
            value={this.state.inputTimeEnd}
            onChange={this.endTimeChangeHandler}
            placeholder="Enter end time HHMM"
            onClick={this.onConfirmEndTime}
            buttonText="confirm end time"
          />
        </div>
        <div className={classes.details}>
          <br />
          <Button onClick={this.startTrackingHandler}>START TRACKING</Button>
          <div>
            {this.state.scheduled ? (
              <p style={{ textAlign: "center" }}>
                <b>All set!</b>
              </p>
            ) : null}
            {this.state.startDate !== "" ? (
              <p>Scheduled to track on {" " + this.state.startDate + "th"}</p>
            ) : null}
            {this.state.startedTracking ? (
              <React.Fragment>
                <p style={{ textAlign: "center" }}>
                  <b>Tracking...Do Not Close Window</b>
                </p>
                <Spinner />
              </React.Fragment>
            ) : this.state.data.length < 2 ? null : (
              <CSVLink data={this.state.data} filename={"Bus arrival time.csv"}>
                Export
              </CSVLink>
            )}
          </div>
          <p>
            <span>
              Time start:
              {" " +
                (this.state.timeStart - (this.state.timeStart % 100)) / 100 +
                " hrs " +
                (this.state.timeStart % 100) +
                " mins"}
            </span>
            <span> || </span>
            <span>
              Time end:
              {" " +
                (this.state.timeEnd - (this.state.timeEnd % 100)) / 100 +
                " hrs " +
                (this.state.timeEnd % 100) +
                " mins"}
            </span>
          </p>
          {this.state.serviceNumber !== "" ? (
            <p>
              Tracking arrival time for bus
              <span>
                <b> {this.state.serviceNumber}</b>
              </span>
            </p>
          ) : null}
          <ul style={{ listStyle: "none", cursor: "pointer" }}>
            {this.state.busStopCodes.map((code, index) => (
              <li key={code} onClick={() => this.onDeleteBusStopCode(code)}>
                #{(index += 1)} Bus Stop Code : <b>{code}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

export default BusArrivalTime;
