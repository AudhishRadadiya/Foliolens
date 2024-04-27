import React from "react";
import { Button, Card, Col, Row, ListGroup } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";

import Container from "../../components/Layout/Container";
import PorfolioPieCard from "../../components/Portfolios/PorfolioPieCard";
import PropertyList from "../../components/Properties/PropertyList";
import { fetchAllPortfolios, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import { RenderPortfolioStatus } from "../../components/Portfolios/PortfolioCard";
import toast from "react-hot-toast";
import { useconfirmAlert } from "../../Utility/Confirmation";

const PortfolioProperties = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];

  const { portfolio } = state || {};
  const allPortfolioProperties = allProperties.filter((item) => item.portfolio_id === portfolio?.portfolio_id);
  const portfolioData = allPortfolios?.find((i) => i.id === portfolio?.portfolio_id);

  const filterPropertyOwnerByPortId = async (portfolioId) => {
    try {
      const dataRes = await getRdsFN("tbSelect", {
        source: "pOwn",
        pfolioId: portfolioId,
      });
      const propertyIds = dataRes.map((p) => p.id);
      return propertyIds;
    } catch (err) {
      return [];
    }
  };

  const onDeletePortfolio = async (portfolio_id) => {
    try {
      dispatch(setLoading(true));

      const collaboratorPortfolio = await getRdsFN("tbSelect", {
        source: "pCollaborator",
        pfolioId: portfolio_id,
      });

      if (collaboratorPortfolio?.length > 0) {
        await Promise.all(
          collaboratorPortfolio?.map((p) => {
            return updateRecordTB("PortfolioCollaborator", p);
          })
        );
      }

      const deleteObj = {
        id: portfolio_id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await updateRecordTB("Portfolio", deleteObj);

      const propertyIds = allPortfolioProperties.map((item) => item.id);
      const propertyOwnerIds = await filterPropertyOwnerByPortId(portfolio_id);

      await Promise.all(
        propertyIds.map((propertyId) =>
          updateRecordTB("Property", {
            id: propertyId,
            active: 0,
            last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          })
        )
      );
      await Promise.all(
        propertyOwnerIds.map((propertyOwnerId) =>
          updateRecordTB("PropertyOwner", {
            id: propertyOwnerId,
            active: 0,
            last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
          })
        )
      );

      await Promise.all(
        propertyIds.map(async (pId) => {
          const dataRes = await getRdsFN("tbSelect", {
            source: "propUnit",
            propId: pId,
          });
          const res2 = await Promise.all(
            dataRes.map((p) =>
              getRdsFN("tbSelect", {
                source: "propLease",
                propUnitId: p.id,
              })
            )
          );
          if (!res2.length) return;

          const allPropertyLeases = [];
          res2.forEach((ps) => {
            if (ps?.length) {
              allPropertyLeases.push(...ps);
            }
          });
          const allTenantIds = allPropertyLeases.map((pl) => pl.tenant_id);
          const leaseIds = allPropertyLeases.map((pl) => pl.id);

          const ps2 = [];
          dataRes.forEach((uid) => {
            ps2.push(
              updateRecordTB("PropertyUnit", {
                id: uid.id,
                active: 0,
                last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
                updated_by: loggedUserData.id,
              })
            );
          });

          allTenantIds.forEach((tid) => {
            ps2.push(
              updateRecordTB("Tenant", {
                id: tid,
                active: 0,
                last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
              })
            );
          });

          leaseIds.forEach((lid) => {
            ps2.push(
              updateRecordTB("PropertyLease", {
                id: lid,
                active: 0,
                last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
              })
            );
          });
          return Promise.all(ps2);
        })
      );

      dispatch(fetchAllPortfolios());
      navigate("/portfolios");
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Delete Portfolio Error", error);
      dispatch(setLoading(false));
    }
  };
  const onDelete = (portfolio) => {
    useconfirmAlert({
      onConfirm: () => onDeletePortfolio(portfolio),
      isDelete: true,
      title: "Delete Portfolio?",
      dec: "Are you sure you want to delete this portfolio? This action cannot be undone.",
    });
  };
  return (
    <Container title="Portfolio" isBack>
      <div className="properties-info">
        <Row>
          <div className="d-flex justify-content-between mb-1">
            <div className="d-flex justify-content-between">
              <Card.Title as="h1" className="mb-0">
                {portfolioData?.portfolio_name}
              </Card.Title>
              <div className="ms-3">
                <RenderPortfolioStatus status={portfolioData?.status} />
              </div>
            </div>
            <div>
              <img
                src={require("../../Assets/images/icon-edit.svg").default}
                className="pointer"
                onClick={() =>
                  portfolioData?.is_collaborator === 1 && portfolioData?.permission === "View Only"
                    ? toast.error("You have been permitted to View Only \nfor this portfolio")
                    : navigate("/PortfolioAdd", { state: { portfolioData } })
                }
              />
              <img
                src={require("../../Assets/images/icon-delete.svg").default}
                className="pointer ms-4"
                onClick={() =>
                  portfolioData?.is_collaborator === 1 && portfolioData?.permission === "View Only"
                    ? toast.error("You have been permitted to View Only \nfor this portfolio")
                    : onDelete(portfolioData?.portfolio_id)
                }
              />
            </div>
          </div>
          <div className="d-flex">
            <div className="w-100">
              <Card.Subtitle as="h6" className="mb-3">
                {portfolioData?.business_type ? portfolioData?.business_type : "Ownership"}
              </Card.Subtitle>
              <div className="d-flex">
                <PorfolioPieCard
                  owners={portfolioData?.owners?.map((item) => `${item.first_name}${item.last_name}:${item.ownership}`)}
                />
                <div className="d-flex align-items-center justify-content-between">
                  <ListGroup variant="flush" className="ms-4" style={{ width: "180px" }}>
                    {portfolioData?.owners?.map((item, i) => (
                      <ListGroup.Item key={i} className="list-owner">
                        <sapn className="me-auto" style={{ paddingRight: "25px" }}>
                          {item.first_name}
                          {item.last_name}
                        </sapn>
                        <b>{item.ownership}%</b>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              </div>
            </div>
          </div>
        </Row>
      </div>
      <Row className="mt-5">
        <Col sm="6">
          <Card.Title as="h3" className="mb-3">
            Properties
          </Card.Title>
        </Col>
        <Col sm="6" className="text-end">
          <Button className="mb-3" onClick={() => navigate("/PropertyAdd")}>
            Add property
          </Button>
        </Col>
      </Row>
      <PropertyList Properties={allPortfolioProperties} />
    </Container>
  );
};

export default PortfolioProperties;
