import React, { useState, useEffect } from "react";
import {
  Card as C,
  Row,
  Col,
  Typography,
  notification,
  Button,
  List,
} from "antd";
import { CheckOutlined, UserAddOutlined } from "@ant-design/icons";
import { useFirebase, useUser } from "../firebase";
import { useHistory } from "react-router-dom";
import styled from "styled-components";

const { Title } = Typography;

const Card = styled(C)`
  height: 100%;
`;

Card.Body = styled.div`
  height: 100%;
`;

export default function TeamsView() {
  const history = useHistory();
  const [teams, setTeams] = useState([]);
  const firebase = useFirebase();
  const user = useUser();

  useEffect(() => {
    firebase.allTeamsListener(async value => {
      try {
        setTeams(await value);
      } catch (e) {
        notification.error({
          message: e.message,
        });
      }
    });
  }, []);

  return (
    <>
      <Title>All teams</Title>
      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 2,
          md: 4,
          lg: 4,
          xl: 6,
          xxl: 3,
        }}
        dataSource={teams}
        renderItem={(team) => (
          <List.Item key={team.id}>
            <Card
              title={team.name}
              extra={
                <>
                  <Typography.Paragraph strong style={{ textAlign: "right", margin: 0 }}>
                    {team.captains.length > 0 &&
                      `${team.captains
                        .map((e) => e.displayName)
                        .join(", ")} (c)`}
                  </Typography.Paragraph>
                  <Typography.Paragraph style={{ textAlign: "right", margin: 0 }}>
                    {team.members?.length ?? 0} member
                    {team.members?.length === 1 ? "" : "s"}
                  </Typography.Paragraph>
                </>
              }
              hoverable
              actions={[
                team.members?.find((e) => e === user.id) ? (
                  <Button type='link'>
                    <CheckOutlined />
                    Member
                  </Button>
                ) : user.admin ? (
                  <Button type='link' danger>
                    <CheckOutlined />
                    Admin
                  </Button>
                ) : team.applied?.find((e) => e === user.id) ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      firebase.setApplied(team.id, false);
                    }}
                  >
                    <UserAddOutlined />
                    Applied
                  </Button>
                ) : (
                  <Button
                    type='primary'
                    onClick={(e) => {
                      e.stopPropagation();
                      firebase.setApplied(team.id, true);
                    }}
                  >
                    <UserAddOutlined />
                    Join
                  </Button>
                ),
              ]}
              onClick={() => history.push(`/teams/${team.id}`)}
            >
              <div dangerouslySetInnerHTML={{__html: team.bio}} />
            </Card>
          </List.Item>
        )}
      />
    </>
  );
}
