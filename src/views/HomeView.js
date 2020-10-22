import React from "react";
import { Typography, Row, Col, Card as C, List, Button } from "antd";
import { useFirebase, useTeams, useSessions, useUser } from "../firebase";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import styled from "styled-components";
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const Card = styled(C)`
  height: 100%;
`;

const { Title } = Typography;

const COVID_OFFICERS = [
  { sport: "Hockey (M)", name: "Henry Johnson", email: "ee18hj@leeds.ac.uk" },
];

export default function HomeView() {
  const user = useUser();
  const firebase = useFirebase();
  const { loading: loadingTeams, data: teams } = useTeams();
  const { loading: loadingSessions, data: sessions } = useSessions();
  return (
    <>
      <Title style={{ textAlign: "center" }}>
        Welcome back, {user.displayName}
      </Title>
      <Row gutter={[8, 8]}>
        <Col md={12} xs={24}>
          <Card title='Upcoming sessions' loading={loadingSessions}>
            <List
              dataSource={sessions
                .filter(
                  (e) =>
                    e.start.toDate() >
                    DateTime.local().startOf("day").toJSDate()
                )
                .sort((a, b) => a.start.toDate() - b.start.toDate())
                .slice(0, 5)}
              itemLayout='vertical'
              pagination={{ pageSize: 5 }}
              loading={loadingSessions}
              renderItem={(session) => (
                <List.Item
                  key={session.id}
                  extra={
                      <Button
                        type={!session.attending.some((e) => e === user.id) ? 'primary' : 'default'}
                        icon={!session.attending.some((e) => e === user.id) ? <CheckOutlined/> : <CloseOutlined />}
                        disabled={
                          DateTime.local().startOf("day").toJSDate() >
                            session.start.toDate() ||
                          !teams
                            .find((e) => e.id === session.team)
                            ?.members?.some((e) => e.id === user.id)
                        }
                        onClick={async () => {
                          await firebase.setAttending(session.id, !session.attending.some((e) => e === user.id));
                        }}
                      >
                        Attending
                      </Button>
                  }
                >
                  <List.Item.Meta
                    title={<Link to={`/teams/${session.team}`}>{session.name}</Link>}
                    description={
                      <span>
                        {DateTime.fromJSDate(session.start.toDate()).toFormat(
                          "ccc dd LLL T"
                        )}{" "}
                        -{" "}
                        {DateTime.fromJSDate(session.end.toDate()).toFormat(
                          DateTime.fromJSDate(session.start.toDate()).hasSame(
                            DateTime.fromJSDate(session.end.toDate()),
                            "day"
                          )
                            ? "T"
                            : "ccc dd LLL T"
                        )}{" "}
                        @ <strong>{session.location}</strong>
                      </span>
                    }
                  />
                  {session.description}
                </List.Item>
              )}
            />
          </Card>{" "}
        </Col>
        <Col md={12} xs={24}>
          <Card title='Your teams' loading={loadingTeams}>
            <List
              itemLayout='horizontal'
              dataSource={teams}
              loading={loadingTeams}
              pagination={{ pageSize: 3 }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Link to={`/teams/${item.id}`}>{item.name}</Link>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col md={12} xs={24}>
          <Card title='Contact Information'>
            <p>
              Phone Number:{" "}
              <a href={`tel:${user.phoneNumber}`}>{user.phoneNumber}</a>
            </p>
            <p>
              Email Address: <a href={`mailto:${user.email}`}>{user.email}</a>
            </p>
            <p>
              <i>
                If this information isn't correct, please update it in the{" "}
                <Link to='/account'>account</Link> page.
              </i>
            </p>
          </Card>
        </Col>
        <Col md={12} xs={24}>
          <Card title='Positive COVID-19 Test'>
            <p>
              If you have a positive test result returned from the NHS and you
              attended <b>any</b> hockey session (training or fixture), you{" "}
              <b>must</b> inform your COVID officer.
            </p>
            <List
              itemLayout='horizontal'
              dataSource={COVID_OFFICERS}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.sport}
                    description={
                      <p>
                        {item.name},{" "}
                        <a href={`mailto:${item.email}`}>{item.email}</a>
                      </p>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
