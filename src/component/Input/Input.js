import React from "react";
import * as classes from "./Input.css";
import Button from "../Button/Button";

const input = (props) => {
  return (
    <div className={classes.UserInput}>
      <input
        className={classes.input}
        type={props.type}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
      />
      <span style={{ paddingLeft: "10px" }}>
        <Button onClick={props.onClick}>{props.buttonText}</Button>
      </span>
    </div>
  );
};

export default input;
