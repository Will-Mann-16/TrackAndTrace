import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useUser, useFirebase, useTeams, useSessions } from "../firebase";
import {
  EditOutlined,
  PlusOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import {
  Card as C,
  Typography,
  Row,
  Col,
  List,
  Modal,
  Button,
  Tooltip,
  Badge,
} from "antd";
import { DateTime } from "luxon";
import styled from "styled-components";
import { sortBy } from "lodash";
import Session from "../components/Session";
import EditSession from "../components/EditSession";
import EditTeam from "../components/EditTeam";
import AssignMembers from "../components/AssignMembers";

const Card = styled(C)`
  height: 100%;
`;

const { Title, Text } = Typography;

const IconText = ({ icon, text, tooltip, badge, ...props }) => (
  <Tooltip title={tooltip}>
    {badge ? (
      <Badge count={badge}>
        <Button {...props}>
          {React.createElement(icon)}
          {text}
        </Button>
      </Badge>
    ) : (
      <Button {...props}>
        {React.createElement(icon)}
        {text}
      </Button>
    )}
  </Tooltip>
);
export default function TeamView() {
  const user = useUser();
  const { teamId } = useParams();
  const { data: teams, loading: loadingTeams } = useTeams();
  const { data: sessions, loading: loadingSessions } = useSessions();

  const team = useMemo(() => {
    return teams.find((e) => e.id === teamId) ?? {};
  }, [teams, teamId]);
  const [error, setError] = useState();
  const [edit, setEdit] = useState(false);
  const [members, setMembers] = useState(false);
  const [addSession, setAddSession] = useState(false);

  if (!!error)
    return (
      <>
        <Title type='danger'>Oops! An error has occured</Title>
        <Text type='danger'>{error.message}</Text>
      </>
    );

  if (Object.keys(team).length === 0 && teams.length > 0) {
    return (
      <>
        <Title type='danger'>Oops! Team not found</Title>
        <Text type='danger'>
          If this is unexpected, please contact an admin
        </Text>
      </>
    );
  }

  return (
    <>
      <Card
        title={team.name}
        loading={loadingTeams}
        extra={
          (team.captains?.find((e) => e.id === user.id) || user.admin) && (
            <IconText
              text='Edit'
              tooltip='Edit your team info'
              icon={EditOutlined}
              onClick={() => setEdit(true)}
            />
          )
        }
      >
        <div dangerouslySetInnerHTML={{__html: team.bio}} />
      </Card>
      <Row style={{ paddingTop: 16 }} gutter={[16, 16]}>
        <Col md={12} xs={24}>
          <Card title='Captains' loading={loadingTeams}>
            <List
              loading={loadingTeams}
              itemLayout='horizontal'
              renderItem={(captain) => (
                <List.Item key={captain.id}>
                  <List.Item.Meta
                    title={captain.displayName}
                    description={
                      <>
                        <a href={`tel:${captain.phoneNumber}`}>
                          {captain.phoneNumber}
                        </a>
                        <br />
                        <a href={`mailto:${captain.email}`}>{captain.email}</a>
                      </>
                    }
                  />
                </List.Item>
              )}
              dataSource={sortBy(team.captains, ["displayName"])}
            />
          </Card>
        </Col>
        <Col md={12} xs={24}>
          <Card
            loading={loadingTeams}
            title='Members'
            extra={
              (team.captains?.find((e) => e.id === user.id) || user.admin) && (
                <IconText
                  text='Members'
                  tooltip='Add/Remove members from your team'
                  icon={UsergroupAddOutlined}
                  onClick={() => setMembers(true)}
                  badge={team.applied?.length > 0 && team.applied.length}
                />
              )
            }
          >
            <List
              loading={loadingTeams}
              itemLayout='horizontal'
              pagination={{ pageSize: 5 }}
              renderItem={(member) => (
                <List.Item key={member.id}>
                  <List.Item.Meta title={member.displayName} />
                </List.Item>
              )}
              dataSource={sortBy(team.members, ["displayName"])}
            />
          </Card>
        </Col>
      </Row>
      <Card
        title='Sessions'
        loading={loadingSessions && sessions.length === 0}
        extra={
          (team.captains?.find((e) => e.id === user.id) || user.admin) && (
            <IconText
              text='Add'
              tooltip='Add a new fixture/training session'
              icon={PlusOutlined}
              onClick={() => setAddSession(true)}
            />
          )
        }
      >
        <List
          dataSource={sessions
            .filter((e) => e.team === teamId)
            .sort((a, b) => {
              if (
                DateTime.local().startOf("day").toJSDate() > a.start.toDate() &&
                DateTime.local().startOf("day").toJSDate() <= b.start.toDate()
              )
                return 1;
              else if (
                DateTime.local().startOf("day").toJSDate() > a.start.toDate() &&
                DateTime.local().startOf("day").toJSDate() > b.start.toDate()
              )
                return b.start.toDate() - a.start.toDate();
              return a.start.toDate() - b.start.toDate();
            })}
          pagination={{ pageSize: 5 }}
          itemLayout='vertical'
          renderItem={(session) => (
            <Session key={session.id} session={session} showActions />
          )}
        />
      </Card>
      {(team.captains?.find((e) => e.id === user.id) || user.admin) && (
        <>
          <EditTeam
            visible={edit}
            team={team}
            toggle={() => setEdit((e) => !e)}
          />
          <AssignMembers
            visible={members}
            team={team}
            toggle={() => setMembers((e) => !e)}
          />
          <EditSession
            visible={addSession}
            team={team}
            session={addSession}
            toggle={() => setAddSession(false)}
          />
        </>
      )}
    </>
  );
}
