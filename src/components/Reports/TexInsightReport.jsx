import moment from "moment";
import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLegend } from "victory";
import { formatNumber } from "../../Utility";
import InsightAlert from "./InsightAlert";

const TexInsightReport = ({ data }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [propertyNames, setPropertyNames] = useState([]);
  const [displayAlertData, setDisplayAlertData] = useState();
  const [transactionData, setTransactionData] = useState();
  const [display, setDisplay] = useState(false);
  //   const [alertPercentage, setalertPercentage] = useState(0);
  const colorScale = ["#2445A4", "#4D75F0", "#8444EC", "#4FB980", "#EC9F44", "#F0E01D", "#FF5050", "#21C3EE"];
  const propData = {};

  data.map((prop) => {
    const porpId = `p-${prop.property_id}`;
    if (propData.hasOwnProperty(porpId)) {
      propData[porpId].push(prop);
    } else {
      propData[porpId] = [prop];
    }
  });

  data = propData;

  useEffect(() => {
    let filteredChartData = [];
    const propertyName = [];
    let transactions = [];
    let alertData = [];
    const totalGrowth = {};
    let alertMessage;
    let alertPercentage = 0;
    let displayAlert = false;

    if (Object.keys(data)?.length) {
      Object.keys(data).map((key, index) => {
        filteredChartData[index] = [];

        data[key].map((propData, idx) => {
          if (propData.amount > 0) {
            const date = propData?.date?.split("T")[0];
            const today = moment();
            const lastYear = moment(today);
            lastYear.subtract(1, "year");
            const propYear = new Date(date).getFullYear();

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
                    ? data[key][0].address1?.split(",")[0].substring(0, 15) + "..."
                    : data[key][0].address1?.split(",")[0],
                symbol: { fill: colorScale[legendColorIndex] },
              });
            }

            if (new Date(date).getTime() >= new Date(lastYear).getTime()) {
              transactions.push({
                address:
                  data[key][0].address1?.split(",")[0].length > 20
                    ? data[key][0].address1?.split(",")[0].substring(0, 20) + "..."
                    : data[key][0].address1?.split(",")[0],
                amount: propData.amount,
                date: propYear,
              });
            }

            if (totalGrowth.hasOwnProperty(propYear)) {
              totalGrowth[propYear] = {
                ...totalGrowth[propYear],
                [propData.property_id]: {
                  amount: parseFloat(propData.amount || 0),
                  address: data[key][0].address1,
                },
              };
            } else {
              totalGrowth[propYear] = {
                [propData.property_id]: {
                  amount: parseFloat(propData.amount || 0),
                  address: data[key][0].address1,
                },
              };
            }
            if (propYear) {
              const foundIndex = filteredChartData[index].findIndex(
                (chartData) => chartData?.x?.toString() === propData?.date?.toString()
              );
              if (foundIndex === -1) {
                filteredChartData[index].push({
                  x: propYear.toString(),
                  y: parseFloat(propData.amount || 0),
                });
              } else {
                filteredChartData[index][foundIndex] = {
                  x: propYear.toString(),
                  y: parseFloat(propData.amount) + filteredChartData[index][foundIndex].y,
                };
              }
            }
          }
        });
      });

      transactions.sort((a, b) => parseInt(b.date) - parseInt(a.date));

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
                message: `Your annual property tax has increased by`,
                propertyName: lastYear[pid].address,
                percentage,
              });
            }
          }
        });
      }

      setFilteredData(filteredChartData);
      setPropertyNames(propertyName);
      setTransactionData(transactions);
      setDisplayAlertData(alertData);

      setTimeout(() => {
        setDisplay(true);
      }, [2000]);
    }
  }, [data]);

  let chartOptions = {
    offset: 3,
    style: {
      data: { width: 2 },
      labels: { fontFamily: "DMSans-Medium" },
    },
    colorScale: colorScale,
    // domain: { x: [0.9, 0.9] },
    domainPadding: { x: 2 * propertyNames.length },
    // maxDomain: 4
  };

  if (filteredData.length === 1) {
    chartOptions = {
      offset: 1,
      style: {
        data: { width: 4 },
        labels: { fontFamily: "DMSans-Medium" },
      },
      colorScale: colorScale,
      maxDomain: 4,
    };
  }

  //   useEffect(() => {
  //     if (data?.constructor === Object && Object.keys(data).length > 0) {
  //       let tmpfilteredData = filteredData;
  //       Object.keys(data).map((key, index) => {
  //         propertyNames.push({
  //           name:
  //             data[key][0].address1?.split(",")[0].length > 39
  //               ? data[key][0].address1?.split(",")[0].substring(0, 39) + "..."
  //               : data[key][0].address1?.split(",")[0],
  //           symbol: { fill: colorScale[index] },
  //           amount: `$${data[key][0].id}`,
  //         });
  //         tmpfilteredData[index] = [];
  //         if (reportType === "Property Tax Insight") {
  //           data[key].map((propData) => {
  //             if (totalGrowth.hasOwnProperty(propData.year)) {
  //               totalGrowth[propData.year] += parseFloat(propData.tax_amount || 0);
  //             } else {
  //               totalGrowth[propData.year] = parseFloat(propData.tax_amount || 0);
  //             }
  //             if (propData?.year) {
  //               tmpfilteredData[index].push({
  //                 x: propData?.year ? propData.year.toString() : "",
  //                 y: parseFloat(propData.tax_amount || 0),
  //               });
  //             }
  //           });
  //         } else {
  //           data[key].map((propData) => {
  //             if (totalGrowth.hasOwnProperty(new Date(propData.renewal_date).getFullYear() - 1)) {
  //               totalGrowth[new Date(propData.renewal_date).getFullYear() - 1] += parseFloat(
  //                 propData.annual_premium || 0
  //               );
  //             } else {
  //               totalGrowth[new Date(propData.renewal_date).getFullYear() - 1] = parseFloat(propData.annual_premium || 0);
  //             }
  //             if (propData.renewal_date) {
  //               tmpfilteredData[index].push({
  //                 x: (new Date(propData.renewal_date).getFullYear() - 1).toString(),
  //                 y: parseFloat(propData.annual_premium || 0),
  //               });
  //             }
  //           });
  //         }
  //       });

  //       let filteredRow = 0;
  //       let filteredChartData = [];
  //       for (let i = tmpfilteredData.length - 1; i >= 0; i--) {
  //         if (filteredRow > 4) {
  //           break;
  //         }
  //         if (tmpfilteredData[i].length) {
  //           filteredChartData.push(tmpfilteredData[i]);
  //           filteredRow++;
  //         }
  //       }
  //       tmpfilteredData = filteredChartData.reverse();

  //       const yearsArray = Object.keys(totalGrowth);
  //       if (totalGrowth[yearsArray[yearsArray.length - 1]] === 0) {
  //         setdisplayAlert(true);
  //         setalertPercentage(-100);
  //       } else if (totalGrowth[yearsArray[yearsArray.length - 2]] === 0) {
  //         setalertPercentage(100);
  //       } else {
  //         setdisplayAlert(true);
  //         setalertPercentage(
  //           parseFloat(
  //             ((totalGrowth[yearsArray[yearsArray.length - 1]] - totalGrowth[yearsArray[yearsArray.length - 2]]) /
  //               totalGrowth[yearsArray[yearsArray.length - 2]]) *
  //               100 || 0
  //           ).toFixed(2)
  //         );
  //       }

  //       setfilteredData([...tmpfilteredData]);
  //       setpropertyNames([...propertyNames]);
  //     }
  //   }, [chartData, reportType]);

  //   const chartOptions = {
  //     offset: 6.5,
  //     style: {
  //       data: { width: 4 },
  //       labels: { fontFamily: "DMSans-Medium" },
  //     },
  //     colorScale: colorScale,
  //     domain: filteredData.length === 1 ? { x: [0.9, 0.9 * filteredData.length] } : {},
  //   };

  return (
    <div>
      {displayAlertData?.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-4">Alerts</h3>
          {displayAlertData.map(({ message, percentage, propertyName }) => (
            <InsightAlert type={"error"} message={message} percentage={percentage} propertyName={propertyName} />
          ))}
        </div>
      )}
      {display || Object.keys(data).length > 0 ? (
        <div>
          <h3 className="mt-5" style={{ lineHeight: "32px" }}>
            Cost Breakdown
          </h3>
          <Row>
            <Col lg="5">
              <div style={{ width: "500px" }}>
                <VictoryChart
                  animate={{
                    easing: "quadInOut",
                    onEnd: () => {
                      // setAnimationDone(true);
                    },
                  }}
                >
                  <VictoryAxis />
                  <VictoryAxis dependentAxis tickFormat={(y) => formatNumber(y)} />
                  <VictoryGroup {...chartOptions}>
                    {filteredData.map((data) => (
                      <VictoryBar data={data} cornerRadius={3} key={Math.random()} />
                    ))}
                  </VictoryGroup>
                </VictoryChart>
                <div>
                  <VictoryLegend
                    x={20}
                    orientation="horizontal"
                    itemsPerRow={1}
                    gutter={20}
                    style={{
                      labels: {
                        fontFamily: "DMSans-Medium",
                        fontWeight: "600",
                        fontSize: "12",
                      },
                    }}
                    data={propertyNames}
                  />
                </div>
              </div>
            </Col>

            <Col lg="6">
              <div style={{ marginTop: "7px" }}>
                <Row>
                  <Col className="fw-bold my-2">
                    <div className="mb-2">Last Payment in the Past 12 Months</div>
                  </Col>
                  {transactionData?.length === 0 ? (
                    <div style={{ padding: 15, borderTopColor: "#ededed" }}>
                      <span>No Transactions </span>
                    </div>
                  ) : (
                    <>
                      {transactionData?.map((item) => {
                        return (
                          <Col
                            className="d-flex justify-content-between my-2 border-bottom"
                            lg="12"
                            // style={{ borderBottom: "1px solid #E5E4E2" }}
                          >
                            <div className="fw-bold mb-2">{item?.address}</div>
                            <span className="mb-2">{formatNumber(item?.amount)}</span>
                          </Col>
                        );
                      })}
                    </>
                  )}
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

    // <div>
    //   {data?.constructor === Object && Object.keys(data).length > 0 ? (
    //     <div>
    //       <h3 className="my-3">Alerts</h3>
    //       {alertPercentage !== 0 && displayAlert && (
    //         <Row className="gap-3 px-3">
    //           <Col
    //             lg="3"
    //             md="4"
    //             sm="12"
    //             className="d-flex p-3 rounded"
    //             style={{ background: "#FFEEEE", width: "270px" }}
    //           >
    //             <div className="me-2" style={{ color: "#ff6464" }}>
    //               <IconAlert />
    //             </div>
    //             <span>
    //               <div>
    //                 Your annual property tax has increased by <b>{Math.abs(alertPercentage)}%</b>
    //               </div>
    //               <div>
    //                 {/* <img src={require("../../Assets/images/Union1.svg").default} alt="" /> */}
    //                 <span className="ms-2" style={{ fontSize: "12px" }}>
    //                   219 Linda Ln
    //                 </span>
    //               </div>
    //             </span>
    //           </Col>
    //           <Col
    //             lg="3"
    //             md="4"
    //             sm="12"
    //             className="d-flex p-3 rounded"
    //             style={{ background: "#EEF8F3", width: "270px" }}
    //           >
    //             <div className="me-2" style={{ color: "#4fb980" }}>
    //               {/* <IconSuccess /> */}
    //             </div>
    //             <span>
    //               <div>
    //                 <b>64 properties</b> tax events automatically created
    //               </div>
    //               <div>
    //                 {/* <img src={require("../../Assets/images/Union1.svg").default} alt="" /> */}
    //                 <span className="ms-2" style={{ fontSize: "12px" }}>
    //                   800 First St
    //                 </span>
    //               </div>
    //             </span>
    //           </Col>
    //           <Col
    //             lg="3"
    //             md="4"
    //             sm="12"
    //             className="d-flex p-3 rounded"
    //             style={{ background: "#FEF8F0", width: "270px" }}
    //           >
    //             <div className="me-2" style={{ color: "#EC9F44" }}>
    //               <IconHelp />
    //             </div>
    //             <span>
    //               <div>Upcoming tax Payment</div>
    //               <b>{moment().format("MMMM do")}</b>
    //               <div>
    //                 {/* <img src={require("../../Assets/images/Union1.svg").default} alt="" /> */}
    //                 <span className="ms-2" style={{ fontSize: "12px" }}>
    //                   71 Friar Ave
    //                 </span>
    //               </div>
    //             </span>
    //           </Col>
    //           <Col
    //             lg="3"
    //             md="4"
    //             sm="12"
    //             className="d-flex p-3 rounded"
    //             style={{ background: "#FFEEEE", width: "270px" }}
    //           >
    //             <div className="me-2" style={{ color: "#ff6464" }}>
    //               <IconAlert />
    //             </div>
    //             <span>
    //               <div>
    //                 <div>Auto Bill Pay Info Missing.</div>
    //                 <a href="#">Setup</a>
    //               </div>
    //               <div>
    //                 {/* <img src={require("../../Assets/images/Union1.svg").default} alt="" /> */}
    //                 <span className="ms-2" style={{ fontSize: "12px" }}>
    //                   71 Friar Ave
    //                 </span>
    //               </div>
    //             </span>
    //           </Col>
    //         </Row>
    //       )}
    //       <Row className="mt-5">
    //         <Col lg="6">
    //           <div style={{ width: "400px" }}>
    //             <h3 className="mt-4">Annual Trend</h3>
    //             <VictoryChart>
    //               <VictoryGroup {...chartOptions}>
    //                 {filteredData.map((item, index) => (
    //                   <VictoryBar data={item} cornerRadius={3} key={`${index}-${Math.random()}`} />
    //                 ))}
    //               </VictoryGroup>
    //             </VictoryChart>
    //             {propertyNames.length > 0 && (
    //               <VictoryLegend
    //                 x={30}
    //                 orientation="horizontal"
    //                 itemsPerRow={2}
    //                 gutter={20}
    //                 style={{
    //                   labels: {
    //                     fontFamily: "DMSans-Medium",
    //                     fontWeight: "600",
    //                   },
    //                 }}
    //                 data={propertyNames}
    //               />
    //             )}
    //           </div>
    //         </Col>
    //         <Col lg="6">
    //           <div className="mt-5">
    //             <div className="fw-bold h6 mb-3">Last Payment in the Past 12 Months</div>
    //             <Row>
    //               {propertyNames.map((item) => {
    //                 return (
    //                   <Col
    //                     className="d-flex justify-content-between my-2"
    //                     lg="12"
    //                     style={{ borderBottom: "1px solid #E5E4E2" }}
    //                   >
    //                     <div className="fw-bold mb-2">{item?.name}</div>
    //                     {/* <span className="mb-2">{commaSeparator(item?.amount)}</span> */}
    //                     <span className="mb-2">{item?.amount}</span>
    //                   </Col>
    //                 );
    //               })}
    //             </Row>
    //           </div>
    //         </Col>
    //       </Row>
    //     </div>
    //   ) : (
    //     <div className="empty text-center py-5">
    //       <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
    //     </div>
    //   )}
    // </div>
  );
};

export default TexInsightReport;
