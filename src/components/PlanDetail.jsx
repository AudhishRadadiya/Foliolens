import React from "react";

const FreePlans = [
  { id: 1, des: "Portfolio Dashboard" },
  { id: 2, des: "AI Powered Document Recognition" },
  { id: 3, des: "Automatic Document Linking to Property" },
  { id: 4, des: "Flexible Document Capture" },
  { id: 5, des: "Seamlessly Organize and Share Documents" },
  { id: 6, des: "Intelligent Notifications" },
  { id: 7, des: "Tax and Insurance Insights" },
  { id: 8, des: "Mobile App" },
];

const EssentialPlans = [
  { id: 1, des: "Portfolio Dashboard" },
  { id: 2, des: "AI Powered Document Recognition" },
  { id: 3, des: "Automatic Document Linking to Property" },
  { id: 4, des: "Flexible Document Capture" },
  { id: 5, des: "Seamlessly Organize and Share Documents" },
  { id: 6, des: "Intelligent Notifications" },
  { id: 7, des: "Tax and Insurance Insights" },
  { id: 8, des: "Mobile App" },
  { id: 9, des: "Maintenance Workflow Automation" },
  { id: 10, des: "Frictionless Rent Payments" },
  { id: 11, des: "Portfolio Performance Reporting" },
  { id: 12, des: "Tenant Portal" },
];

const GrowthPlans = [
  { id: 1, des: "Portfolio Dashboard" },
  { id: 2, des: "AI Powered Document Recognition" },
  { id: 3, des: "Automatic Document Linking to Property" },
  { id: 4, des: "Flexible Document Capture" },
  { id: 5, des: "Seamlessly Organize and Share Documents" },
  { id: 6, des: "Intelligent Notifications" },
  { id: 7, des: "Tax and Insurance Insights" },
  { id: 8, des: "Mobile App" },
  { id: 9, des: "Maintenance Workflow Automation" },
  { id: 10, des: "Frictionless Rent Payments" },
  { id: 11, des: "Portfolio Performance Reporting" },
  { id: 12, des: "Tenant Portal" },
  { id: 13, des: "Owner Portal" },
  { id: 14, des: "Owner Financial Statement" },
  { id: 15, des: "Customer Onboarding Specialist" },
];

export default function PlanDetail({ mainTxt, type }) {
  const planData =
    type === "free" ? FreePlans : type === "growth" ? GrowthPlans : type === "essential" ? EssentialPlans : [];
  return (
    <div>
      <div>
        <p className="p-0">{mainTxt}</p>

        <h2 className="mb-2 align-items-center" style={{ color: "#1646aa", textAlign: "center" }}>
          {type === "free" && "$0"}
          {type === "essential" && (
            <>
              $4/<span style={{ fontSize: 17 }}>unit</span>
            </>
          )}
          {type === "growth" && (
            <>
              $5/<span style={{ fontSize: 17 }}>unit</span>
            </>
          )}
        </h2>

        {type === "free" ? (
          <p className="align-items-center text-align-center" style={{ textAlign: "center" }}>
            Unlimited number of units
          </p>
        ) : (
          <p className="align-items-center text-align-center" style={{ textAlign: "center" }}>
            <b>per</b> month
          </p>
        )}

        {planData.map((item, i) => {
          return (
            <div key={i} className="d-flex flex-direction-row justify-content-start">
              <div className="msg-success mb-0">
                <img src={require("../Assets/images/successRound.png")} alt="" style={{ height: 22, width: 22 }} />
              </div>
              <div className="mb-0" style={{ marginTop: 2, marginLeft: 5, marginBottom: 0 }}>
                <p>{item.des}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
