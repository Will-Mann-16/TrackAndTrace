import React, { useState, useEffect } from "react";
import { Card, List, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useTeams } from "../firebase";
import { useHistory } from "react-router-dom";

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
      <List
        dataSource={teams}
        grid={{ gutter: 16, xs: 1, md: 3 }}
        renderItem={(team) => (
          <List.Item key={team.id}>
            <Card
              title={team.name}
              hoverable
              actions={[
                <IconText
                  icon={UserOutlined}
                  text={team.members.length}
                  key='members'
                />,
              ]}
              onClick={() => history.push(`/teams/${team.id}`)}
            >
              {team.bio}
            </Card>
          </List.Item>
        )}
      />
    </>
  );
}
