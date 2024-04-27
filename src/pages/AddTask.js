import React, { useState, useEffect } from "react";
import { Col, Form, Row, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { useSelector, useDispatch } from "react-redux";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import moment from "moment";

import Container from "../components/Layout/Container";
import { setLoading } from "../store/reducer";
import { getId } from "../Utility";
import { createRecordTB, fetchAllTasksReminders, updateRecordTB } from "../Utility/ApiService";
import { useLocation, useNavigate } from "react-router-dom";
import FormInput from "../components/Form/FormInput";

const taskSchema = yup
  .object({
    type: yup.string().required("Select Task"),
    title: yup.string().when("type", {
      is: (value) => value === "Task",
      then: yup.string().required("Please enter Task Title"),
      otherwise: yup.string().required("Please enter Reminder Title"),
    }),
    property_id: yup.string().required("Please select Property"),
    date: yup.string().required("Please select Date").nullable(),
    description: yup.string().notRequired(),
    remainder_timeRange: yup.string().notRequired(),
    remainder_repeat: yup.string().notRequired(),
  })
  .required();

const AddTask = () => {
  const dispatch = useDispatch();
  const { state } = useLocation();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const navigate = useNavigate();

  const methods = useForm({
    resolver: yupResolver(taskSchema),
    defaultValues: {
      type: "Task",
    },
  });
  const {
    watch,
    register,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;
  const property_id = watch("property_id");
  const type = watch("type");

  const selectedProperty = allProperties.find((value) => value.id === Number(property_id));

  useEffect(() => {
    if (state) {
      Object.keys(state).forEach((key) => {
        let value = state[key];
        let keys = key;

        switch (key) {
          case "repeat_event":
            keys = "remainder_repeat";
            break;
          case "time_range":
            keys = "remainder_timeRange";
            break;
          case "created_at":
            keys = "date";
            value = new Date(value);
            break;
          default:
            break;
        }
        if (value === null) value = value || "";
        setValue(keys, value);
      });
      document.title = "Edit Task";
      return;
    }
    document.title = "Add Task";
  }, [state]);

  const createTaskOrReminder = async (formData) => {
    try {
      dispatch(setLoading(true));
      const isAddTaskActive = formData.type === "Task";
      const selectedDateAndTime = `${new Date(formData.date)?.toISOString()?.split("T")[0]} 
      ${isAddTaskActive ? "00:00" : "00:00"}:00`;
      const obj = {
        updated_by: loggedUserData.id,
        active: 1,
        created_at: moment(formData.date).format("YYYY-MM-DD HH:mm"),
        created_by: loggedUserData.id,
        id: state ? state.id : getId(),
        property_id: Number(formData.property_id),
        property_name: selectedProperty.text,
        type: formData.type,
        next_occurance: moment(selectedDateAndTime, "YYYY-MM-DD HH:mm:ss").utc().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        title: formData.title,
        ...(isAddTaskActive && { description: formData.description }),
        ...(!isAddTaskActive &&
          formData?.timeRange !== "Time Range" && {
            time_range: formData?.remainder_timeRange,
          }),
        ...(!isAddTaskActive &&
          formData?.remainder_repeat !== "" && {
            repeat_event: formData?.remainder_repeat,
          }),
      };
      if (state) {
        await updateRecordTB("Event", obj);
      } else {
        await createRecordTB("Event", obj);
      }
      dispatch(fetchAllTasksReminders());
      dispatch(setLoading(false));
      navigate("/Calender");
    } catch (error) {
      console.log("createTaskOrReminder error ", error);
      dispatch(setLoading(false));
    }
  };

  const resetData = () => {
    const fields = ["date", "title", "property_id", "description", "remainder_timeRange", "remainder_repeat"];
    fields.map((item) => {
      setValue(item, "");
    });
  };

  return (
    <Container title={state ? "Edit Task" : "Add Task"} isBack>
      <div className="add-task-page">
        <div>
          <div className="d-flex gap-5 mb-3">
            <Form.Check type="radio" value="Task" label="Task" {...register("type")} onClick={resetData} />
            <Form.Check type="radio" value="Reminder" label="Reminder" {...register("type")} onClick={resetData} />
          </div>
          <FormProvider {...methods}>
            <Form className="add_task" onSubmit={handleSubmit(createTaskOrReminder)}>
              <Row>
                <Col lg="6">
                  <Row>
                    <Col xs="12">
                      <FormInput type="text" name="title" label="Title*" placeholder={`Enter ${type} Title`} />
                    </Col>
                    <Col md="6">
                      <FormInput
                        type="select"
                        name="property_id"
                        placeholder="Select Property"
                        label="Property*"
                        options={allProperties.map((item) => ({ label: item.text, value: item.id }))}
                      />
                      <Form.Text style={{ color: "#DC3545" }}>
                        {(selectedProperty?.is_collaborator || selectedProperty?.is_property_owner) &&
                        selectedProperty?.permission?.toLowerCase() === "view only"
                          ? "You have been permitted to View Only for this Property"
                          : selectedProperty?.is_property_owner
                          ? "You have been permitted to View Only for this Property"
                          : ""}
                      </Form.Text>
                    </Col>

                    <Col md="6">
                      <Form.Group className="mb-3">
                        {/* <DatePicker
                          className="form-control"
                          onChange={(date) => setValue("date", date, { shouldValidate: true })}
                          selected={getValues("date")}
                          name="date"
                          placeholder="mm/dd/yyyy"
                          minDate={moment().toDate()}
                        /> */}
                        <FormInput type="datePicker" name="date" placeholder="mm/dd/yyyy" label="Date" astrict />
                        {/* <Form.Text style={{ color: "#DC3545" }}>{errors?.date && errors?.date?.message}</Form.Text> */}
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
                {type === "Task" ? (
                  <>
                    <Col lg="6"></Col>
                    <Col lg="6">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Description <span style={{ color: "gray" }}>(Optional)</span>
                        </Form.Label>
                        <Form.Control
                          name="description"
                          as="textarea"
                          placeholder="Enter Description"
                          style={{ height: "100px" }}
                          {...register("description")}
                        />
                        <Form.Text style={{ color: "#DC3545" }}>
                          {errors.description && errors?.description?.message}
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </>
                ) : (
                  <>
                    <Col md="6"></Col>
                    <Col md="6">
                      <Form.Group>
                        <div className="d-flex justify-content-between">
                          <Form.Label>
                            Repeat <span style={{ color: "gray" }}>(Optional)</span>
                          </Form.Label>
                        </div>
                        <Row className="mb-3">
                          <Col md="6">
                            <FormInput
                              type="select"
                              name="remainder_repeat"
                              placeholder="Select Repeat"
                              label=""
                              options={[
                                { label: "1", value: "1" },
                                { label: "2", value: "2" },
                                { label: "3", value: "3" },
                                { label: "4", value: "4" },
                                { label: "5", value: "5" },
                                { label: "6", value: "6" },
                                { label: "7", value: "7" },
                                // { label: "Every", value: "" },
                              ]}
                              defaultValue="Every"
                            />
                          </Col>
                          <Col md="6">
                            <FormInput
                              type="select"
                              name="remainder_timeRange"
                              placeholder="Select Time Range"
                              label=""
                              options={[
                                { label: "Days", value: "Days" },
                                { label: "Week", value: "Week" },
                                { label: "Month", value: "Month" },
                                { label: "Year", value: "Year" },
                              ]}
                            />
                          </Col>
                        </Row>
                      </Form.Group>
                    </Col>
                  </>
                )}
              </Row>
              <Row className="pt-5">
                <Col>
                  <Button onClick={() => reset()} className="btn-reset btn-md">
                    Reset
                  </Button>
                </Col>
                <Col className="text-end">
                  <Button
                    type="submit"
                    disabled={
                      (selectedProperty?.is_collaborator || selectedProperty?.is_property_owner) &&
                      selectedProperty?.permission?.toLowerCase() === "view only"
                        ? true
                        : selectedProperty?.is_property_owner
                        ? true
                        : false
                    }
                  >
                    Submit {type}
                  </Button>
                </Col>
              </Row>
            </Form>
          </FormProvider>
        </div>
      </div>
    </Container>
  );
};

export default AddTask;
