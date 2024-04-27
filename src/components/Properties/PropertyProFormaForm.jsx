import React, { useEffect } from "react";
import { Button, Col, Form, Row, Table } from "react-bootstrap";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { setLoading } from "../../store/reducer";
import { fetchAllProperties } from "../../Utility/ApiService";
import { useNavigate } from "react-router-dom";
import { API, graphqlOperation } from "aws-amplify";
import { mutatePropertyProforma } from "../../graphql/mutations";
import InlineEditView from "../InlineEditView";
import FormInput from "../Form/FormInput";
import { formatNumber, getId, nonDecimalFormat } from "../../Utility";

const validationSchema = yup
  .object({
    proForma: yup.array().of(
      yup.object().shape({
        estimate: yup.string(),
      })
    ),
  })
  .required();

const PropertyProFormaForm = ({ setActiveTab, ViewMode, propData, docData }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categoryPropertyParent = useSelector(({ categoryPropertyParent }) => categoryPropertyParent);
  const inviteCollabPermission = propData?.is_collaborator === 1 && propData?.permission === "View Only";

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {},
  });
  const { control, watch } = methods;
  const { fields } = useFieldArray({
    control,
    name: "proForma",
  });

  const proForma = watch("proForma");

  const estimateTotal = proForma?.reduce((previousValue, currentValue) => {
    return currentValue?.is_income === 1
      ? Number(previousValue) + Number(currentValue?.estimates)
      : Number(previousValue) - Number(currentValue?.estimates);
  }, 0);
  const actualTotal = proForma?.reduce((previousValue, currentValue) => {
    return currentValue?.is_income === 1
      ? Number(previousValue) + Math.abs(currentValue?.total)
      : Number(previousValue) - Math.abs(currentValue?.total);
  }, 0);

  const proFormaData = propData?.proForma;
  const propertyId = propData?.id;
  const streetAddress = propData?.streetAddress;

  useEffect(() => {
    if (proFormaData?.length) {
      const value = proFormaData.map((item) => ({
        parent_proforma_category_id: item?.parent_proforma_category_id,
        estimates: item?.estimates === 0 ? "" : item?.estimates,
        total: item?.total,
        is_income: item.is_income,
      }));
      methods.setValue("proForma", value);
    } else {
      const value = categoryPropertyParent.map((m) => ({
        parent_proforma_category_id: m.id,
        estimates: "",
        total: 0,
      }));
      methods.setValue("proForma", value);
    }
  }, [proFormaData]);

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));
      const mortgageObj = formData.proForma.map((m, i) => ({
        id: proFormaData[i]?.id ? proFormaData[i].id : getId(),
        property_id: propertyId,
        active: 1,
        parent_proforma_category_id: m.parent_proforma_category_id,
        estimates: m.estimates === "" ? 0 : parseInt(m.estimates),
      }));

      await API.graphql(graphqlOperation(mutatePropertyProforma, { data: JSON.stringify(mortgageObj) }));

      dispatch(fetchAllProperties());
      if (!docData) {
        navigate("/PropertyDetails", { state: { propertyId } });
      } else {
        navigate("/DocumentReview", {
          state: { data: docData, onBoardPropData: { id: propertyId, text: streetAddress } },
        });
      }
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const updateProForma = async (value, item) => {
    try {
      const filterProForma = proFormaData.find(
        (i) => i.parent_proforma_category_id === item.parent_proforma_category_id
      );
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(mutatePropertyProforma, {
          data: JSON.stringify([
            {
              id: filterProForma?.id,
              property_id: propertyId,
              active: 1,
              parent_proforma_category_id: item.parent_proforma_category_id,
              estimates: value === "" ? 0 : parseInt(value),
            },
          ]),
        })
      );
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
          <Table responsive="md" borderless={true}>
            <thead>
              <tr className="text-muted ">
                <td style={{ width: "18%" }}>Category</td>
                <td style={{ width: "18%" }}>Estimates (monthly)</td>
                <td style={{ width: "18%" }}>Actuals (monthly)</td>
              </tr>
            </thead>
            <tbody className="table-body">
              {fields.map((field, index) => (
                <tr style={{ borderBottom: "1px solid #EDEDED" }}>
                  <th className="align-middle">
                    {categoryPropertyParent.find((item) => item.id === field?.parent_proforma_category_id)?.category}
                  </th>
                  <td>
                    {!ViewMode ? (
                      <Col>
                        <FormInput
                          name={`proForma.${index}.estimates`}
                          type="maskInput"
                          placeholder="$"
                          prefix="$"
                          thousandsSeparator
                        />
                      </Col>
                    ) : (
                      <Col lg="11" key={index}>
                        <InlineEditView
                          name={`proForma.${index}.estimates`}
                          indexValue={index}
                          type="maskInput"
                          prefix="$"
                          placeholder="$"
                          onHandleUpdate={() => {
                            updateProForma(methods.getValues(`proForma.${index}.estimates`), field);
                          }}
                          thousandsSeparator
                          disabled={inviteCollabPermission}
                        />
                      </Col>
                    )}
                  </td>
                  <td className="align-middle">{formatNumber(field?.total) || "$"}</td>
                </tr>
              ))}
              <tr>
                <th className="align-middle">Net Cash Flow</th>
                <th>
                  <div style={{ marginLeft: "14px" }}>{estimateTotal ? nonDecimalFormat(estimateTotal) : "-"}</div>
                </th>
                <th className="align-middle">
                  <div>{actualTotal ? nonDecimalFormat(actualTotal) : "-"}</div>
                </th>
              </tr>
            </tbody>
          </Table>
          {!ViewMode && (
            <div>
              <Row className="pt-5">
                <Col>
                  <Button onClick={() => setActiveTab("finance")} className="btn-md btn-delete">
                    Cancel
                  </Button>
                </Col>
                <Col className="text-end">
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

export default PropertyProFormaForm;
