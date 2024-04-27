import React from "react";
import { Button } from "react-bootstrap";

export default function AppButton(props) {
  return (
    <Button type={props.type} className={props.classes} onClick={props.onClick} disabled={props.disabled}>
      {props.image && <img src={props.image} alt=""></img>}
      {props.title}
    </Button>
  );
}
