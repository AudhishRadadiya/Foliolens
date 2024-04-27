import moment from "moment";
import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
// import { PieChart } from 'react-minimal-pie-chart';
import { VictoryLegend, VictoryPie } from "victory";
// import { ReactComponent as IconHelp } from "../../Assets/images/icon-help.svg";
// import { ReactComponent as IconAlert } from "../../Assets/images/ReportAlert.svg";
// import { ReactComponent as IconSuccess } from "../../Assets/images/ReportSuccess.svg";
import { formatMoney } from "../../Utility/index";

const InsuranceInsightReport = ({ chartData }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [propertyNames, setPropertyNames] = useState([]);
  const [transactionData, setTransactionData] = useState();

  const [displayAlertData, setDisplayAlertData] = useState();
  // const [alertPercentage, setAlertPercentage] = useState(0);
  // const [total, setTotal] = useState(0);

  const data = Object.assign({}, chartData);
  const colorScale = ["#2445A4", "#4D75F0", "#8444EC", "#EC9F44", "#F0E01D", "#4FB980"];

  useEffect(() => {
    let filteredChartData = [];
    let transactions = [];
    let alertData = [];
    const propertyName = [];
    const totalGrowth = {};
    const includedProperties = {};

    if (Object.keys(data).length > 0) {
      Object.keys(data).map((key, index) => {
        data[key].map((propData, idx) => {
          const date = propData?.date?.split("T")[0];
          const year = new Date(date).getFullYear();
          const today = moment();
          const lastYear = moment(today);
          lastYear.subtract(1, "year");

          if (idx === 0) {
            let legendColorIndex = 0;
            if (propertyName.length) {
              if (propertyName.length >= colorScale.length) {
                legendColorIndex = propertyName.length % colorScale.length;
              } else {
                legendColorIndex = propertyName.length;
              }
            }

            propertyName.push({
              name:
                data[key][0].address1?.split(",")[0].length > 15
                  ? data[key][0].address1
                  : data[key][0].address1?.split(",")[0],
              symbol: { fill: colorScale[legendColorIndex] },
            });
          }

          if (new Date(date).getTime() >= new Date(lastYear).getTime()) {
            transactions.push({
              address: data[key][0].address1?.split(",")[0],
              date: propData?.date,
              amount: propData.amount,
            });
          }

          if (totalGrowth.hasOwnProperty(year)) {
            totalGrowth[year] = {
              ...totalGrowth[year],
              [propData.property_id]: {
                amount: parseFloat(propData.amount || 0),
                address: data[key][0].address1,
              },
            };
          } else {
            totalGrowth[year] = {
              [propData.property_id]: {
                amount: parseFloat(propData.amount || 0),
                address: data[key][0].address1,
              },
            };
          }

          if (propData.property_id) {
            if (includedProperties.hasOwnProperty(propData.property_id)) {
              filteredChartData[includedProperties[propData.property_id]] = {
                x: propData.property_id,
                y: Number(
                  Number(propData.amount) + Number(filteredChartData[includedProperties[propData.property_id]].y)
                ),
              };
            } else {
              includedProperties[propData.property_id] = idx;
              filteredChartData.push({
                x: propData.property_id,
                y: Number(propData.amount),
              });
            }
          }
        });
      });

      const yearsArray = Object.keys(totalGrowth);
      if (yearsArray.length >= 2) {
        const lastYear = totalGrowth[yearsArray[yearsArray.length - 1]];
        const secondLastYear = totalGrowth[yearsArray[yearsArray.length - 2]];

        const propertiesArray = Object.keys(lastYear);
        propertiesArray.map((pid) => {
          if (secondLastYear.hasOwnProperty(pid)) {
            const percentage =
              ((lastYear[pid].amount - secondLastYear[pid].amount) / secondLastYear[pid].amount) * 100 || 0;
            if (percentage > 20) {
              alertData.push({
                message: "Your insurance premium has increased by",
                propertyName: lastYear[pid].address,
                percentage,
              });
            }
          }
        });
      }

      transactions.sort((a, b) => new Date(b).getTime - new Date(a).getTime);

      setFilteredData(filteredChartData);
      setPropertyNames(propertyName);
      setTransactionData(transactions);
      setDisplayAlertData(alertData);
    }
  }, [chartData]);

  return (
    <div>
      {data?.constructor === Object && Object.keys(data).length > 0 ? (
        <div>
          {displayAlertData?.length > 0 && (
            <>
              <h3 className="my-3">Alerts</h3>
              <Row className="gap-3 px-3">
                <Col
                  lg="2"
                  md="4"
                  sm="12"
                  className="d-flex p-3 rounded"
                  style={{ background: "#FEF8F0", width: "270px" }}
                >
                  <div className="me-2" style={{ color: "#EC9F44" }}>
                    {/* <IconHelp /> */}
                  </div>
                  <span>
                    <div>
                      {"Your expenses have increased by"} <b>{""}%</b>
                    </div>
                    <div>
                      {/* <img src={require("../../Assets/images/Union1.svg").default} alt="" /> */}
                      <span className="ms-2" style={{ fontSize: "12px" }}>
                        219 Linda Ln
                      </span>
                    </div>
                  </span>
                </Col>
                <Col
                  lg="2"
                  md="4"
                  sm="12"
                  className="d-flex p-3 rounded"
                  style={{ background: "#EEF8F3", width: "270px" }}
                >
                  <div className="me-2" style={{ color: "#4fb980" }}>
                    {/* <IconSuccess /> */}
                  </div>
                  <span>
                    <div>
                      <div>All insurance renewals are current! Your next premium is due on</div>
                      <b>{moment().format("MM/DD/YY")}</b>
                    </div>
                    <div>
                      {/* <img src={require("../../Assets/images/Union1.svg").default} alt="" /> */}
                      <span className="ms-2" style={{ fontSize: "12px" }}>
                        800 First St
                      </span>
                    </div>
                  </span>
                </Col>
                <Col
                  lg="2"
                  md="4"
                  sm="12"
                  className="d-flex p-3 rounded"
                  style={{ background: "#FFEEEE", width: "270px" }}
                >
                  <div className="me-2" style={{ color: "#ff6464" }}>
                    {/* <IconAlert /> */}
                  </div>
                  <span>
                    <div>
                      <b>3 properties</b> are missing insurance documents
                    </div>
                    <a href="#">Add here</a>
                  </span>
                </Col>
                <Col
                  lg="2"
                  md="4"
                  sm="12"
                  className="d-flex p-3 rounded"
                  style={{ background: "#FFEEEE", width: "270px" }}
                >
                  <div className="me-2" style={{ color: "#ff6464" }}>
                    {/* <IconAlert /> */}
                  </div>
                  <span>
                    <div>
                      <div>Auto Bill Pay Info Missing.</div>
                      <a href="#">Setup</a>
                    </div>
                    <div>
                      {/* <img src={require("../../Assets/images/Union1.svg").default} alt="" /> */}
                      <span className="ms-2" style={{ fontSize: "12px" }}>
                        71 First Ave
                      </span>
                    </div>
                  </span>
                </Col>
              </Row>
            </>
          )}
          <h3 className="mt-4" style={{ lineHeight: "32px" }}>
            Cost Breakdown
          </h3>
          <Row className="mt-5">
            <Col lg="5">
              <div style={{ width: "400px" }}>
                {/* <PieChart
                                    className='Insurance-PieChart'
                                    data={filteredData}
                                    segmentsStyle={{ cursor: "pointer" }}
                                    lineWidth={18}
                                    paddingAngle={13}
                                    rounded
                                    radius={30}
                                    labelPosition={0}
                                    labelStyle={{
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        fill: "var(--Dark-01)",
                                        whiteSpace: "pre"
                                    }}
                                    label={(dataEntry) => {
                                        if (dataEntry.dataIndex === 0) {
                                            return (
                                                <>
                                                    <text
                                                        x={dataEntry.x}
                                                        y={dataEntry.y}
                                                        dx={dataEntry.dx}
                                                        dy={dataEntry.dy}
                                                        dominant-baseline="central"
                                                        text-anchor="middle"
                                                        style={{
                                                            fill: '', pointerEvents: 'none', fontSize: '6px'
                                                        }}
                                                    >
                                                        <tspan>{`$${total}`}</tspan>

                                                    </text>
                                                    <text
                                                        x={dataEntry.x}
                                                        y={dataEntry.y}
                                                        dx={dataEntry.dx}
                                                        dy={dataEntry.dy}
                                                        // dominant-baseline="center"
                                                        text-anchor="middle"
                                                        style={{
                                                            fill: 'gray', pointerEvents: 'none', fontSize: '5px'
                                                        }}
                                                    >
                                                        <tspan>{"Total coast"}</tspan>
                                                    </text>
                                                </>
                                            )
                                        }
                                    }}
                                /> */}

                <svg width={400} height={350}>
                  <text
                    x={200}
                    y={150}
                    fontSize="24.5"
                    style={{ lineHeight: "32px" }}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {formatMoney(filteredData?.reduce((total, { y }) => total + y, 0))}
                  </text>
                  <text x={200} y={175} style={{ lineHeight: "24px" }} fontSize="16" fill="gray" textAnchor="middle">
                    {"Total Cost"}
                  </text>
                  <VictoryPie
                    standalone={false}
                    width={400}
                    height={300}
                    innerRadius={130}
                    padAngle={1}
                    colorScale={colorScale}
                    padding={40}
                    cornerRadius={15}
                    data={filteredData}
                    style={{
                      labels: {
                        display: "none",
                      },
                      paddingLeft: "-70px",
                    }}
                  />
                </svg>

                {propertyNames?.length > 0 && (
                  <VictoryLegend
                    x={20}
                    orientation="horizontal"
                    itemsPerRow={1}
                    // gutter={20}
                    style={{
                      labels: {
                        fontFamily: "DMSans-Medium",
                        fontWeight: "600",
                      },
                    }}
                    data={propertyNames}
                  />
                )}
              </div>
            </Col>
            <Col lg="6">
              <div style={{ marginTop: "7px" }}>
                <Row>
                  <Col className="fw-bold my-2">
                    <div className="mb-2">Last Payment in the Past 12 Months</div>
                  </Col>
                  {transactionData?.map((item) => {
                    return (
                      <Col
                        className="d-flex justify-content-between my-2 border-bottom"
                        lg="12"
                        // style={{ borderBottom: "1px solid #E5E4E2" }}
                      >
                        <div className="fw-bold mb-2">{item?.address}</div>
                        <span className="mb-2">{formatMoney(item?.amount)}</span>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </Col>
          </Row>
        </div>
      ) : (
        <div className="empty text-center py-5">
          <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}
    </div>
  );
};

export default InsuranceInsightReport;
