import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useUser, useFirebase, useTeams, useSessions } from "../firebase";
import {
  EditOutlined,
  PlusOutlined,
  UsergroupAddOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined
} from "@ant-design/icons";
import {
  Card as C,
  Typography,
  Row,
  Col,
  List,
  Form,
  Input,
  Modal,
  Button,
  Select,
  DatePicker,
  Popconfirm,
  notification,
} from "antd";
import { DateTime } from "luxon";
import moment from "moment";
import styled from "styled-components";
import { sortBy } from "lodash";
import { saveAs } from 'file-saver';

const Card = styled(C)`
  height: 100%;
`;

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const IconText = ({ icon, text, ...props }) => (
  <Button {...props}>
    {React.createElement(icon)}
    {text}
  </Button>
);
export default function TeamView() {
  const firebase = useFirebase();
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
  const [attendingMembers, setAttendingMembers] = useState(undefined);

  if (!!error)
    return (
      <>
        <Title type='danger'>Oops! An error has occured</Title>
        <Text type='danger'>{error.message}</Text>
      </>
    );

  return (
    <>
      <Card
        title={team.name}
        loading={loadingTeams}
        extra={
          (team.captains?.find((e) => e.id === user.id) || user.admin) && (
            <IconText
              text='Edit'
              icon={EditOutlined}
              onClick={() => setEdit(true)}
            />
          )
        }
      >
        {team.bio}
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
                  icon={UsergroupAddOutlined}
                  onClick={() => setMembers(true)}
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
        loading={loadingSessions}
        extra={
          (team.captains?.find((e) => e.id === user.id) || user.admin) && (
            <IconText
              text='Add'
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
          loading={loadingSessions}
          pagination={{ pageSize: 5 }}
          itemLayout='vertical'
          renderItem={(session) => (
            <List.Item
              style={{
                opacity:
                  DateTime.local().startOf("day").toJSDate() >
                  session.start.toDate()
                    ? 0.6
                    : 1,
              }}
              key={session.id}
              actions={
                (team.captains?.find((e) => e.id === user.id) ||
                  user.admin) && [
                  <IconText
                    text='Edit'
                    icon={EditOutlined}
                    onClick={() => setAddSession(session)}
                    type='text'
                    key='edit'
                  />,
                  <IconText
                    text='Attending'
                    icon={UsergroupAddOutlined}
                    onClick={() => setAttendingMembers(session.id)}
                    type='text'
                    key='attending'
                  />,
                  <Popconfirm
                    title='Are you sure you want to delete this session?'
                    okText='Yes'
                    cancelText='No'
                    key='delete'
                    onConfirm={() => firebase.deleteSession(session)}
                  >
                    <IconText text='Delete' type='text' icon={DeleteOutlined} />
                  </Popconfirm>,
                  <IconText
                    text='Download'
                    icon={DownloadOutlined}
                    type='text'
                    onClick={async () => {
                      try {
                        function s2ab(s) {
                          var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
                          var view = new Uint8Array(buf); //create uint8array as viewer
                          for (var i = 0; i < s.length; i++)
                            view[i] = s.charCodeAt(i) & 0xff; //convert to octet
                          return buf;
                        }
                        const wbout = await firebase.generateSpreadsheet(
                          session
                        );
                        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), `${session.name} - ${
                            team.name
                          } - ${DateTime.fromJSDate(
                            session.start.toDate()
                          ).toLocaleString(DateTime.DATE_SHORT)}.xlsx`);
                      } catch (e) {
                        notification.error({
                          message: "Error",
                          description: e.message,
                        });
                      }
                    }}
                  />,
                ]
              }
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
                title={session.name}
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
            visible={!!addSession}
            team={team}
            session={addSession}
            toggle={() => setAddSession(undefined)}
          />
          <Modal
            title='Attending Members'
            visible={!!attendingMembers}
            cancelText='Close'
            footer={[
              <Button
                key='close'
                onClick={() => setAttendingMembers(undefined)}
              >
                Close
              </Button>,
            ]}
            onCancel={() => setAttendingMembers(undefined)}
          >
            <AttendingMembers session={attendingMembers} />
          </Modal>
        </>
      )}
    </>
  );
}

function EditSession({ visible, toggle, team: { id, ...team }, session }) {
  const [form] = Form.useForm();
  const firebase = useFirebase();

  useEffect(() => {
    if (!session?.id) {
      form.resetFields();
      form.setFieldsValue({
        location: "Weetwood Sports Park",
      });
    } else {
      form.setFieldsValue({
        ...session,
        range: [moment(session.start.toDate()), moment(session.end.toDate())],
      });
    }
  }, [session]);

  return (
    <Modal
      visible={visible}
      okText='Submit'
      cancelText='Cancel'
      onCancel={() => {
        form.resetFields();
        toggle();
      }}
      onOk={() => {
        form
          .validateFields()
          .then(({ range, ...values }) =>
            session?.id
              ? firebase.updateSession(session.id, {
                  ...values,
                  team: id,
                  start: range[0].toDate(),
                  end: range[1].toDate(),
                })
              : firebase.createSession({
                  ...values,
                  team: id,
                  start: range[0].toDate(),
                  end: range[1].toDate(),
                })
          )
          .then((res) => {
            form.resetFields();
            toggle();
          });
      }}
    >
      <Form form={form} layout='vertical' name='edit-session'>
        <Form.Item
          name='range'
          label='Start Time / End Time'
          //   rules={[
          //     {
          //       required: true,
          //       array: true,
          //       message: "Start / End time required",
          //     },
          //   ]}
        >
          <RangePicker showTime format='YYYY-MM-DD HH:mm:ss' />
        </Form.Item>
        <Form.Item
          name='name'
          label='Session name'
          rules={[{ required: true, message: "Session name is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='location'
          label='Session location'
          rules={[{ required: true, message: "Session location is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='description'
          label='Session description'
          rules={[
            { required: true, message: "Session description is required" },
          ]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function EditTeam({ visible, toggle, team: { id, ...values } }) {
  const [form] = Form.useForm();
  const firebase = useFirebase();
  return (
    <Modal
      visible={visible}
      okText='Submit'
      cancelText='Cancel'
      onCancel={toggle}
      title='Edit Team'
      onOk={() => {
        form
          .validateFields()
          .then((values) => firebase.updateTeam(id, values))
          .then((res) => {
            form.resetFields();
            toggle();
          });
      }}
    >
      <Form
        form={form}
        layout='vertical'
        name='edit-team'
        initialValues={{ ...values }}
      >
        <Form.Item
          name='name'
          label='Team name'
          rules={[{ required: true, message: "Team name is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='bio'
          label='Team bio'
          rules={[{ required: true, message: "Team bio is required" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

const { Option } = Select;

function AssignMembers({ visible, toggle, team: { id, ...values } }) {
  const [form] = Form.useForm();
  const firebase = useFirebase();
  const [userList, setUsers] = useState([]);

  useEffect(() => {
    const getData = async () => {
      try {
        setUsers(sortBy(await firebase.getUserList(), ["displayName"]));
      } catch (e) {
        notification.error({
          message: "Error",
          description: e.message,
        });
      }
    };
    getData();
  }, []);

  return (
    <Modal
      visible={visible}
      okText='Submit'
      title='Assign Members'
      cancelText='Cancel'
      onCancel={toggle}
      onOk={() => {
        form
          .validateFields()
          .then((values) => firebase.updateTeam(id, values))
          .then((res) => {
            form.resetFields();
            toggle();
          });
      }}
    >
      <Form
        form={form}
        layout='vertical'
        name='assign-members'
        initialValues={{
          members: sortBy(values.members?.map((e) => e.id) ?? [], [
            "displayName",
          ]),
        }}
      >
        <Form.Item
          name='members'
          label='Members'
          rules={[
            {
              required: true,
              message: "Please select team members",
              type: "array",
            },
          ]}
        >
          <Select mode='multiple' placeholder='Please select team members'>
            {userList.map(({ id, displayName }) => (
              <Option key={id} value={id}>
                {displayName}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

function AttendingMembers({ session }) {
  const firebase = useFirebase();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const getData = async () => {
      try {
        setMembers(await firebase.getMembersAttending(session));
      } catch (e) {
        notification.error({
          message: "Error",
          description: e.message,
        });
      }
    };
    getData();
  }, []);

  return (
    <List
      dataSource={sortBy(members, "displayName")}
      renderItem={(member) => (
        <List.Item key={member.id}>
          <List.Item.Meta
            title={member.displayName}
            // description={member.phoneNumber}
          />
        </List.Item>
      )}
    />
  );
}
