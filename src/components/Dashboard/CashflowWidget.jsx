import { ComposedChart, Line, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency, abbrNumber } from "../../Utility";

function CashflowWidget({ cashflowData, layout }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card" style={{ border: "2px solid #1646AA" }}>
          <span style={{ fontWeight: "bold", marginBottom: "10px" }}>{`${label}`}</span>
          <div className="row" style={{ width: "450px" }}>
            {payload?.map(({ name, value, color }) => (
              <div className="col-6" style={{ fontSize: "12px", fontWeight: "500" }}>
                <div className="row">
                  <div className="col-8" style={{ color: "#1646AA", paddingRight: 0, marginRight: 0 }}>
                    {name}:
                  </div>
                  <div className="col-4" style={{ paddingLeft: 0, marginLeft: 0, textAlign: "right" }}>
                    {formatCurrency(value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
      <ResponsiveContainer width={layout?.width > 1100 ? 1100 : layout?.width - 40} height="100%">
        <ComposedChart
          width={layout?.width > 1100 ? 1100 : layout?.width - 40}
          height="100%"
          data={cashflowData}
          stackOffset="sign"
        >
          <Tooltip content={<CustomTooltip />} />
          <Legend iconSize={10} verticalAlign="top" wrapperStyle={{ color: "#1646AA" }} />
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={abbrNumber} />
          <Bar name="Income" dataKey="income" fill="#97DEBD" stackId="stack" />
          <Bar name="Maintenance & Repairs" dataKey="maintenance" fill="#FF656B" stackId="stack" />
          <Bar name="Insurance" dataKey="insurance" fill="#C79FFB" stackId="stack" />
          <Bar name="Tax" dataKey="tax" fill="#FFDE8A" stackId="stack" />
          <Bar name="Mortgage" dataKey="mortgage" fill="#A1BBFC" stackId="stack" />
          <Bar name="Administration & Misc" dataKey="admin_misc" fill="#BCAAA4" stackId="stack" />
          <Bar name="Capital Expenses" dataKey="capital_expenses" fill="#FF8F00" stackId="stack" />
          <Bar name="Management Fees" dataKey="management_fee" fill="#9E9E9E" stackId="stack" />
          <Bar name="Utility" dataKey="utility" fill="#F8BBD0" stackId="stack" />
          <Bar name="Uncategorized" dataKey="uncategorized" fill="#708090" stackId="stack" />
          <Line name="Cashflow" type="monotone" dataKey="cashflow" stroke="#1646AA" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CashflowWidget;
