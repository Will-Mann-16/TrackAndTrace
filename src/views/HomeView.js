import React from "react";
import { Typography, Row, Col, Card, List, Button } from "antd";
import { useFirebase, useTeams, useSessions, useUser } from "../firebase";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";

const { Title } = Typography;

const COVID_OFFICERS = [
  { sport: "Hockey (M)", name: "Henry Johnson", email: "ee18hj@leeds.ac.uk" },
];

export default function HomeView() {
  const user = useUser();
  const firebase = useFirebase();
  const { data: teams } = useTeams();
  const { data: sessions, setData } = useSessions();
  return (
    <>
      <Title style={{ textAlign: "center" }}>
        Welcome back, {user.displayName}
      </Title>
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <Card title='Upcoming sessions'>
            <List
              dataSource={sessions}
              itemLayout='vertical'
              renderItem={(session) => (
                <List.Item
                  key={session.id}
                  extra={
                    session.attending.find((e) => e === user.id) ? (
                      <Button
                        type='primary'
                        onClick={async () => {
                          await firebase.setAttending(session.id, false);
                          setData((sessions) => {
                            sessions = { ...sessions };
                            let index = sessions.findIndex(
                              (e) => e.id === session.id
                            );
                            sessions[index].attending.splice(
                              sessions[index].attending.indexOf(user.id),
                              1
                            );
                            return sessions;
                          });
                        }}
                      >
                        Attending
                      </Button>
                    ) : (
                      <Button
                        onClick={async () => {
                          await firebase.setAttending(session.id, true);
                          setData((sessions) => {
                            sessions = { ...sessions };
                            let index = sessions.findIndex(
                              (e) => e.id === session.id
                            );
                            sessions[index].attending.push(user.id);
                            return sessions;
                          });
                        }}
                      >
                        Not attending
                      </Button>
                    )
                  }
                >
                  <List.Item.Meta
                    title={session.name}
                    description={`${DateTime.fromJSDate(
                      session.start.toDate()
                    ).toFormat("ccc dd LLL T")} - ${DateTime.fromJSDate(
                      session.end.toDate()
                    ).toFormat(
                      DateTime.fromJSDate(session.start.toDate()).hasSame(
                        DateTime.fromJSDate(session.end.toDate()),
                        "day"
                      )
                        ? "T"
                        : "ccc dd LLL T"
                    )}`}
                  />
                  {session.description}
                </List.Item>
              )}
            />
          </Card>{" "}
        </Col>
        <Col span={12}>
          <Card title='Your teams'>
            <List
              itemLayout='horizontal'
              dataSource={teams}
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
        <Col span={12}>
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
        <Col span={12}>
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
