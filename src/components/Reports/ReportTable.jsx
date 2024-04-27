import React, { useState, useMemo } from "react";
import { VictoryBar, VictoryChart, VictoryGroup, VictoryLegend } from "victory";
import { ReactComponent as IconHelp } from "../../Assets/images/icon-help.svg";
import BTable from "react-bootstrap/Table";
import { useTable } from "react-table";
import { useEffect } from "react";

const colorScale = ["#2445A4", "#4D75F0", "#8444EC", "#4FB980"];

export const ReportTable = React.forwardRef(({ columns, data, label = "" }, ref) => {
  const mappedCoulmns = useMemo(
    () =>
      columns?.map((item, i) =>
        i % 2 === 0
          ? item
          : {
              ...item,
              className: "bg-lightblue",
              ...(item.columns ? { columns: item.columns.map((dd) => ({ ...dd, className: "bg-lightblue" })) } : {}),
            }
      ),
    [columns]
  );

  const { getTableProps, headerGroups, rows, prepareRow } = useTable({
    columns: mappedCoulmns,
    data,
  });
  return (
    <div>
      {data.length > 0 ? (
        <>
          {label && (
            <div className="mt-3">
              <span className="fs-5 fw-bold">{label}</span>
            </div>
          )}

          <BTable responsive className="my-4" {...getTableProps()} id="ReportTable" ref={ref}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, i) => (
                    <th
                      {...column.getHeaderProps([
                        {
                          className: column.className,
                        },
                      ])}
                    >
                      {column.render("Header")}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row, i) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell) => {
                      return (
                        <td
                          {...cell.getCellProps([
                            {
                              className: cell.column.className,
                              style: {
                                width: cell.column.width,
                                padding: Array.isArray(cell?.value) && cell.column?.padding,
                                minWidth: cell.column?.minWidth,
                                whiteSpace: cell.column?.whiteSpace,
                              },
                            },
                          ])}
                        >
                          {Array.isArray(cell?.value)
                            ? cell?.value?.map((i) => {
                                return <div style={{ padding: "10px", borderBottom: "1px solid #dee2e6" }}>{i}</div>;
                              })
                            : cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </BTable>
        </>
      ) : (
        <div className="empty text-center py-5">
          {/* <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} /> */}
        </div>
      )}
    </div>
  );
});

export const BarChart = ({ data, reportType }) => {
  const [filteredData, setfilteredData] = useState([]);
  const [propertyNames, setpropertyNames] = useState([]);
  const [alertPercentage, setalertPercentage] = useState(0);
  const [displayAlert, setdisplayAlert] = useState(false);
  let totalGrowth = {};

  useEffect(() => {
    if (data?.constructor === Object && Object.keys(data).length > 0) {
      let tmpfilteredData = filteredData;
      Object.keys(data).map((key, index) => {
        propertyNames.push({
          name:
            data[key][0].address1?.split(",")[0].length > 39
              ? data[key][0].address1?.split(",")[0].substring(0, 39) + "..."
              : data[key][0].address1?.split(",")[0],
          symbol: { fill: colorScale[index] },
        });
        tmpfilteredData[index] = [];
        if (reportType === "Property Tax Insight") {
          data[key].map((propData) => {
            if (totalGrowth.hasOwnProperty(propData.year)) {
              totalGrowth[propData.year] += parseFloat(propData.tax_amount || 0);
            } else {
              totalGrowth[propData.year] = parseFloat(propData.tax_amount || 0);
            }
            if (propData?.year) {
              tmpfilteredData[index].push({
                x: propData?.year ? propData.year.toString() : "",
                y: parseFloat(propData.tax_amount || 0),
              });
            }
          });
        } else {
          data[key].map((propData) => {
            if (totalGrowth.hasOwnProperty(new Date(propData.renewal_date).getFullYear() - 1)) {
              totalGrowth[new Date(propData.renewal_date).getFullYear() - 1] += parseFloat(
                propData.annual_premium || 0
              );
            } else {
              totalGrowth[new Date(propData.renewal_date).getFullYear() - 1] = parseFloat(propData.annual_premium || 0);
            }
            if (propData.renewal_date) {
              tmpfilteredData[index].push({
                x: (new Date(propData.renewal_date).getFullYear() - 1).toString(),
                y: parseFloat(propData.annual_premium || 0),
              });
            }
          });
        }
      });

      let filteredRow = 0;
      let filteredChartData = [];
      for (let i = tmpfilteredData.length - 1; i >= 0; i--) {
        if (filteredRow > 4) {
          break;
        }
        if (tmpfilteredData[i].length) {
          filteredChartData.push(tmpfilteredData[i]);
          filteredRow++;
        }
      }
      tmpfilteredData = filteredChartData.reverse();

      const yearsArray = Object.keys(totalGrowth);
      if (totalGrowth[yearsArray[yearsArray.length - 1]] === 0) {
        setdisplayAlert(true);
        setalertPercentage(-100);
      } else if (totalGrowth[yearsArray[yearsArray.length - 2]] === 0) {
        setalertPercentage(100);
      } else {
        setdisplayAlert(true);
        setalertPercentage(
          parseFloat(
            ((totalGrowth[yearsArray[yearsArray.length - 1]] - totalGrowth[yearsArray[yearsArray.length - 2]]) /
              totalGrowth[yearsArray[yearsArray.length - 2]]) *
              100 || 0
          ).toFixed(2)
        );
      }

      setfilteredData([...tmpfilteredData]);
      setpropertyNames([...propertyNames]);
    }
  }, [data, reportType]);

  const chartOptions = {
    offset: 6.5,
    style: {
      data: { width: 4 },
      labels: { fontFamily: "DMSans-Medium" },
    },
    colorScale: colorScale,
    domain: filteredData.length === 1 ? { x: [0.9, 0.9 * filteredData.length] } : {},
  };

  return (
    <div>
      {data?.constructor === Object && Object.keys(data).length > 0 ? (
        <div>
          <h3 className="my-3">Alerts</h3>
          {alertPercentage !== 0 && displayAlert && (
            <div className="d-flex p-3" style={{ background: "#E9E9E9", width: "19%" }}>
              {/* <div className="me-2" style={{ color: "#EC9F44" }}>
                <IconHelp />
              </div> */}
              <span>
                {alertPercentage > 0 ? "Your expenses have increased by" : "Your expenses have decreased by"}{" "}
                <b>{Math.abs(alertPercentage)}%</b>
              </span>
            </div>
          )}
          <div style={{ width: "400px" }}>
            {/* <h3 className="mt-4">Cost Breakdown</h3> */}
            <h3 className="mt-4">Annual Trend</h3>
            <VictoryChart>
              <VictoryGroup {...chartOptions}>
                {filteredData.map((item, index) => (
                  <VictoryBar data={item} cornerRadius={3} key={`${index}-${Math.random()}`} />
                ))}
              </VictoryGroup>
            </VictoryChart>
            {propertyNames.length > 0 && (
              <VictoryLegend
                x={30}
                orientation="horizontal"
                itemsPerRow={2}
                gutter={20}
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
        </div>
      ) : (
        <div className="empty text-center py-5">
          <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}
    </div>
  );
};
