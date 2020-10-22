import React, { useState, useEffect } from "react";
import { Card as C, Row, Col, Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useTeams } from "../firebase";
import { useHistory } from "react-router-dom";
import styled from "styled-components";

const { Title } = Typography;

const Card = styled(C)`
  height: 100%;
`;

Card.Body = styled.div`
  height: 100%;
`;

const IconText = ({ icon, text }) => (
  <Space>
    {React.createElement(icon)}
    {text}
  </Space>
);
export default function TeamsView() {
  const { loading, error, data: teams } = useTeams();
  const history = useHistory();

  return (
    <>
      <Title>Your teams</Title>
      <Row gutter={[16, 16]}>
        {teams.map((team) => (
          <Col key={team.id} md={12} xs={24}>
            <Card
              title={team.name}
              hoverable
              actions={[
                <IconText
                  icon={UserOutlined}
                  text={team.members?.length}
                  key='members'
                />,
              ]}
              onClick={() => history.push(`/teams/${team.id}`)}
            >
              {team.bio}
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
