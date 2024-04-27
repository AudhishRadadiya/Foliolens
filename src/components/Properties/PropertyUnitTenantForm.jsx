import React, { useState, useEffect } from "react";
import { Button, Card, Col, Form, ListGroup, Row, Table } from "react-bootstrap";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import FormInput from "../Form/FormInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { formatDate, formatNumber, getId } from "../../Utility";
import PaginationInput from "../PaginationInput";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { countAndAddUnit } from "./countAndAddUnit";

import { insertPropertyUnitsV2, updatePropertyUnitsV2 } from "../../graphql/mutations";
import { setLoading } from "../../store/reducer";
import { fetchAllProperties, updateRecordTB } from "../../Utility/ApiService";
import InlineEditView from "../InlineEditView";
import { useconfirmAlert } from "../../Utility/Confirmation";
import { toast } from "react-hot-toast";

const validationSchema = yup
  .object({
    unitTenant: yup.array().of(
      yup.object().shape({
        unitId: yup.string().nullable(),
        unit_name: yup
          .string()
          .required("Unit Name is a required field")
          // .matches(/^[a-zA-Z0-9 ]{1,50}$/, "Please enter the valid Unit Name")
          .test("unit_name", "Unit Name must be unique", (values, context) => {
            let filteredData = context?.from[1]?.value?.unitTenant.filter((i) => i.unit_name === values);
            return filteredData?.length <= 1;
          }),
        market_rent: yup.string().nullable(),
      })
    ),
  })
  .required();

const PropertyUnitTenantForm = ({ setActiveTab, propData, ViewMode = false, fetchPropDetails }) => {
  const dispatch = useDispatch();
  const [itemOffset, setItemOffset] = useState(0);
  const [pageNumber, setPageNumber] = useState(0);

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const inviteCollabPermission = propData?.is_collaborator === 1 && propData?.permission === "View Only";

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });
  const {
    formState: { errors },
    watch,
    setValue,
    control,
  } = methods;
  const { append } = useFieldArray({
    control,
    name: "unitTenant",
  });

  const unitTenant = watch("unitTenant");

  const endOffset = itemOffset ? itemOffset + 10 : 10;
  const currentItem = unitTenant?.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(unitTenant?.length / 10);

  const noOfUnits = propData?.units;
  const oldEditData = propData?.propUnits
    ?.sort((a, b) => a.unit_name.localeCompare(b.unit_name, "en", { numeric: true }))
    .map((item) => ({
      unit_name: item?.unit_name,
      market_rent: item?.market_rent,
      unitId: item?.property_unit_id,
    }));

  useEffect(() => {
    if (noOfUnits > 0) {
      setValue("unitTenant", oldEditData);
    } else {
      setValue("unitTenant", [
        {
          unit_name: "1",
          market_rent: "",
          unitId: getId(),
        },
      ]);
    }
  }, [propData, noOfUnits]);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * 10) % unitTenant?.length;
    setItemOffset(newOffset);
    setPageNumber(event.selected);
  };

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));

      const newUnits = formData.unitTenant.map((item) => ({
        id: Number(item.unitId),
        active: 1,
        ...item,
      }));
      const deletedUnits = propData?.propUnits
        .map((item) => {
          if (!formData.unitTenant.find((it) => Number(it.unitId) === item.property_unit_id)) {
            return {
              id: item.property_unit_id,
              active: 0,
              ...item,
            };
          }
        })
        .filter((item) => item);
      await API.graphql(
        graphqlOperation(updatePropertyUnitsV2, {
          propertyId: parseInt(propData.id),
          time: moment().format("YYYY-MM-DD HH:mm:ss"),
          userId: loggedUserData.id,
          unitData: JSON.stringify([...newUnits, ...deletedUnits]),
        })
      );
      fetchPropDetails();
      dispatch(fetchAllProperties());
      setActiveTab("property-management");
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const updateUnitTenant = async (item) => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(updatePropertyUnitsV2, {
          propertyId: parseInt(propData.id),
          time: moment().format("YYYY-MM-DD HH:mm:ss"),
          userId: loggedUserData.id,
          unitData: JSON.stringify([
            {
              unit_name: item.unit_name,
              market_rent: item.market_rent,
              id: item.unitId,
              active: 1, // delete 0
            },
          ]),
        })
      );
      fetchPropDetails();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const deleteUnitTenant = async (item) => {
    try {
      dispatch(setLoading(true));
      const record = propData?.propUnits.find((item1) => item1?.property_unit_id === item?.unitId);
      await updateRecordTB("PropertyUnit", {
        id: record.property_unit_id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      });

      await updateRecordTB("Property", {
        id: propData.id,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
        units: propData.units - 1,
      });

      if (record.tenant_id) {
        await updateRecordTB("Tenant", {
          id: record.tenant_id,
          active: 0,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      }
      if (record.lease_id) {
        await updateRecordTB("PropertyLease", {
          id: record.lease_id,
          active: 0,
          last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      }

      dispatch(setLoading(false));
      dispatch(fetchAllProperties());
      fetchPropDetails();
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const unitTenantIncrease = async () => {
    try {
      dispatch(setLoading(true));
      const isPropertyUnitValid = await countAndAddUnit(noOfUnits + 1, oldEditData.length, propData?.portfolio_id);
      if (!isPropertyUnitValid) {
        dispatch(setLoading(false));
        return;
      }
      append({ unit_name: "", market_rent: "", unitId: getId() });

      let updateObj = {
        id: propData?.id,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
        units: parseInt(propData?.units + 1),
      };

      await API.graphql(
        graphqlOperation(insertPropertyUnitsV2, {
          propertyId: parseInt(propData.id),
          time: moment().format("YYYY-MM-DD HH:mm:ss"),
          userId: loggedUserData.id,
          unitData: JSON.stringify([
            {
              id: getId(),
              unit_name: propData?.units + 1,
              market_rent: 0,
            },
          ]),
        })
      );

      await updateRecordTB("Property", updateObj);
      fetchPropDetails();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  return (
    <div>
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          {window.innerWidth > 1302 ? (
            <Table responsive="lg" borderless={true} className="transaction-table">
              <thead>
                <tr className="text-muted">
                  <td>Unit#</td>
                  <td>Tenant Name</td>
                  <td>Lease Start Date</td>
                  <td>Lease End Date</td>
                  <td>Rent</td>
                  <td>Market Rent</td>
                  <td>Status</td>
                </tr>
              </thead>
              <tbody className="table-body">
                {currentItem?.length > 0 &&
                  currentItem.map((item, index) => {
                    const { tp_status, tp_rent, tp_lease_start, tp_lease_end, first_name, last_name, tenant_id } =
                      propData?.propUnits?.find((item2) => item2?.unit_name === item?.unit_name) || {};
                    return (
                      <tr style={{ borderBottom: "1px solid #EDEDED" }} key={index}>
                        <th>
                          {!ViewMode ? (
                            <Col>
                              <FormInput
                                name={`unitTenant.${index + pageNumber * 10}.unit_name`}
                                className="unit-inputGroup"
                                placeholder="Enter Unit name"
                                value={item?.unit_name}
                              />
                            </Col>
                          ) : (
                            <InlineEditView
                              name={`unitTenant.${index + pageNumber * 10}.unit_name`}
                              indexValue={index + pageNumber * 10}
                              placeholder="Enter Unit name"
                              className="unit-inputGroup"
                              onHandleUpdate={() => updateUnitTenant(item)}
                              disabled={inviteCollabPermission}
                            />
                          )}
                        </th>
                        <td className="align-middle">
                          <Col style={{ width: "150px" }}>
                            {first_name + last_name ? (
                              `${first_name} ${last_name}`
                            ) : (
                              <img src={require("../../Assets/images/inputs-blank.svg").default} alt="" />
                            )}
                          </Col>
                        </td>
                        <td className="align-middle">
                          <Col style={{ width: "150px" }}>
                            {tp_lease_start ? (
                              formatDate(tp_lease_start)
                            ) : (
                              <img src={require("../../Assets/images/inputs-blank.svg").default} alt="" />
                            )}
                          </Col>
                        </td>
                        <td className="align-middle">
                          <Col style={{ width: "150px" }}>
                            {tp_lease_end ? (
                              formatDate(tp_lease_end)
                            ) : (
                              <img src={require("../../Assets/images/inputs-blank.svg").default} alt="" />
                            )}
                          </Col>
                        </td>
                        <td className="align-middle">
                          <Col style={{ width: "150px" }}>
                            {tp_rent ? (
                              formatNumber(tp_rent)
                            ) : (
                              <img src={require("../../Assets/images/inputs-blank.svg").default} alt="" />
                            )}
                          </Col>
                        </td>
                        <td className="align-middle">
                          {!ViewMode ? (
                            <Col>
                              <FormInput
                                name={`unitTenant.${index + pageNumber * 10}.market_rent`}
                                type="maskInput"
                                placeholder="Enter Market Rent"
                                value={item?.market_rent}
                                prefix="$"
                                thousandsSeparator
                              />
                            </Col>
                          ) : (
                            <Col>
                              <InlineEditView
                                name={`unitTenant.${index + pageNumber * 10}.market_rent`}
                                indexValue={index + pageNumber * 10}
                                type="maskInput"
                                prefix="$"
                                placeholder="Enter Market Rent"
                                className="unit-inputGroup"
                                value={item?.market_rent}
                                onHandleUpdate={() => updateUnitTenant(item)}
                                thousandsSeparator
                                disabled={inviteCollabPermission}
                              />
                            </Col>
                          )}
                        </td>
                        <td className="align-middle">
                          <Col className="text-capitalize text-center unit-status">
                            <div
                              style={{
                                fontSize: "13px",
                                color: tp_status
                                  ? tp_status.toLowerCase() === "paid"
                                    ? "#81B095"
                                    : "#ED5328"
                                  : tenant_id
                                  ? "#ffffff"
                                  : "#8C8C8C",
                                backgroundColor: tp_status
                                  ? tp_status?.toLowerCase() === "paid"
                                    ? "#EEF8F3"
                                    : "#FFEEEE"
                                  : tenant_id
                                  ? "#f2a851"
                                  : "#EDEDED",
                              }}
                            >
                              {tp_status ? tp_status.toLowerCase() : tenant_id ? "pending" : "Vacant"}
                            </div>
                          </Col>
                        </td>
                        <td className="align-middle">
                          <Col style={{ width: "50px" }}>
                            {(propData?.property_type === "Multifamily"
                              ? propData?.propUnits?.length > 2
                              : unitTenant?.length !== 1) && (
                              <div className="pointer">
                                <img
                                  src={require("../../Assets/images/icon-delete.svg").default}
                                  onClick={() => {
                                    useconfirmAlert({
                                      onConfirm: () =>
                                        inviteCollabPermission
                                          ? toast.error("You have been permitted to View Only \nfor this unit")
                                          : deleteUnitTenant(item, index),
                                      dec: `Are you sure you want to proceed, this action will delete \n unit and tenant data permanently ?`,
                                      isDelete: true,
                                      title: "Delete Unit & Tenant?",
                                    });
                                  }}
                                  alt=""
                                />
                              </div>
                            )}
                          </Col>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          ) : (
            <>
              <div className="">
                {currentItem?.map((item, index) => {
                  const { tp_status, tp_rent, tp_lease_start, tp_lease_end, first_name, last_name, tenant_id } =
                    propData?.propUnits?.find((item2) => item2?.unit_name === item?.unit_name) || {};
                  return (
                    <Card className="owner-card border-0">
                      <Card.Body className="p-0">
                        <ListGroup variant="flush">
                          <ListGroup.Item>
                            <div className="title text-secondary d-flex justify-content-between">Unit#</div>
                            <div>
                              {!ViewMode ? (
                                <FormInput
                                  name={`unitTenant.${index + pageNumber * 10}.unit_name`}
                                  className="unit-inputGroup"
                                  placeholder="Enter Unit name"
                                  value={item?.unit_name}
                                />
                              ) : (
                                <InlineEditView
                                  name={`unitTenant.${index + pageNumber * 10}.unit_name`}
                                  indexValue={index + pageNumber * 10}
                                  placeholder="Enter Unit name"
                                  className="unit-inputGroup"
                                  onHandleUpdate={() => updateUnitTenant(item)}
                                  disabled={inviteCollabPermission}
                                />
                              )}{" "}
                            </div>
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <div className="title text-secondary">Tenant Name</div>
                            {first_name + last_name ? (
                              `${first_name} ${last_name}`
                            ) : (
                              <img src={require("../../Assets/images/inputs-blank.svg").default} alt="" />
                            )}
                          </ListGroup.Item>
                          <div className="d-flex w-100">
                            <ListGroup.Item>
                              <div className="title text-secondary">Lease Start Date</div>
                              {tp_lease_start ? (
                                formatDate(tp_lease_start)
                              ) : (
                                <img src={require("../../Assets/images/inputs-blank.svg").default} alt="" />
                              )}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <div className="title text-secondary">Lease End Date</div>
                              {tp_lease_end ? (
                                formatDate(tp_lease_end)
                              ) : (
                                <img src={require("../../Assets/images/inputs-blank.svg").default} alt="" />
                              )}
                            </ListGroup.Item>
                          </div>
                          <ListGroup.Item>
                            <div className="title text-secondary">Rent</div>
                            {tp_rent ? (
                              formatNumber(tp_rent)
                            ) : (
                              <img src={require("../../Assets/images/inputs-blank.svg").default} alt="" />
                            )}
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <div className="title text-secondary">Market Rent</div>
                            <FormInput
                              name={`unitTenant.${index + pageNumber * 10}.market_rent`}
                              type="maskInput"
                              placeholder="Enter Market Rent"
                              value={item?.market_rent}
                              prefix="$"
                              thousandsSeparator
                            />
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <div className="">
                              <div className="title text-secondary">Status</div>
                              <div className="unit-status">
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: tp_status
                                      ? tp_status.toLowerCase() === "paid"
                                        ? "#81B095"
                                        : "#ED5328"
                                      : tenant_id
                                      ? "#ffffff"
                                      : "#8C8C8C",
                                    backgroundColor: tp_status
                                      ? tp_status?.toLowerCase() === "paid"
                                        ? "#EEF8F3"
                                        : "#FFEEEE"
                                      : tenant_id
                                      ? "#f2a851"
                                      : "#EDEDED",
                                  }}
                                >
                                  {tp_status ? tp_status.toLowerCase() : tenant_id ? "pending" : "Vacant"}
                                </div>
                              </div>
                            </div>
                          </ListGroup.Item>
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          <div className="w-100 text-center">
            <div
              className={`add-btn d-inline-flex justify-content-center align-items-center mb-2  pointer`}
              onClick={() =>
                inviteCollabPermission
                  ? toast.error("You have been permitted to View Only \nfor this unit")
                  : unitTenantIncrease()
              }
            >
              <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
              <strong>Add New Unit</strong>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <div>
              <PaginationInput pageCount={pageCount} handleClick={handlePageClick} />
            </div>
            <div>
              {unitTenant?.length > 0 && (
                <div className="text-secondary">{`${currentItem?.length} of ${unitTenant?.length} rows`}</div>
              )}
            </div>
          </div>

          {!ViewMode && (
            <div>
              <Row className="pt-5">
                <Col>
                  <Button onClick={() => setActiveTab("details")} className="btn-md btn-delete">
                    Cancel
                  </Button>
                </Col>
                <Col className="text-end">
                  {/* <Button type={noOfUnits === unitTenant?.length ? "submit" : "button"} className="btn-md"> */}
                  <Button type="submit" className="btn-md">
                    Save
                  </Button>
                </Col>
              </Row>
            </div>
          )}
        </Form>
      </FormProvider>
    </div>
  );
};

export default PropertyUnitTenantForm;
