import DashboardLayout from "../components/Dashboard/DashboardLayout";
import Container from "../components/Layout/Container";

export default function Dashboard() {
  const onSaveDashboardLayout = () => {};

  return (
    <Container title="Dashboard">
      <DashboardLayout />
    </Container>
  );
}
