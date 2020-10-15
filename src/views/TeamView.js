import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useUser, useFirebase } from "../firebase";
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
  Form,
  Input,
  Modal,
  Button,
  Select,
  DatePicker,
  Space
} from "antd";
import { DateTime } from "luxon";
import moment from 'moment';
import styled from 'styled-components'

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

  const [team, setData] = useState({});
  const [error, setError] = useState();
  const [edit, setEdit] = useState(false);
  const [members, setMembers] = useState(false);
  const [addSession, setAddSession] = useState(false);
  const [attendingMembers, setAttendingMembers] = useState(undefined);

  useEffect(() => {
    const getData = async () => {
      try {
        if (!!teamId) setData(await firebase.getTeam(teamId));
      } catch (e) {
        setError(e);
      }
    };

    getData();
  }, []);

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
        <Col span={12}>
          <Card title='Captains'>
            <List
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
              dataSource={team.captains}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
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
              itemLayout='horizontal'
              renderItem={(member) => (
                <List.Item key={member.id}>
                  <List.Item.Meta title={member.displayName} />
                </List.Item>
              )}
              dataSource={team.members}
            />
          </Card>
        </Col>
      </Row>
      <Card
        title='Sessions'
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
          dataSource={team.sessions}
          itemLayout='vertical'
          renderItem={(session) => (
            <List.Item
              key={session.id}
              actions={
                (team.captains?.find((e) => e.id === user.id) ||
                  user.admin) && [
                  <IconText text='Edit' icon={EditOutlined} onClick={() => setAddSession(session)} type='text' key='edit' />,
                  <IconText text="Attending" icon={UsergroupAddOutlined} onClick={() => setAttendingMembers(session.id)} type='text' key='attending'/>
                ]
              }
              extra={
                session.attending.find(e=> e === user.id) ? (
                  <Button
                    type='primary'
                    onClick={async () => {
                      await firebase.setAttending(session.id, false);
                      setData((team) => {
                        team = { ...team };
                        let index = team.sessions.findIndex(
                          (e) => e.id === session.id
                        );
                        team.sessions[index].attending.splice(
                          team.sessions[index].attending.indexOf(user.id),
                          1
                        );
                        return team;
                      });
                    }}
                  >
                    Attending
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      await firebase.setAttending(session.id, true);
                      setData((team) => {
                        team = { ...team };
                        let index = team.sessions.findIndex(
                          (e) => e.id === session.id
                        );
                        team.sessions[index].attending.push(user.id);
                        return team;
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
      </Card>
      {(team.captains?.find((e) => e.id === user.id) || user.admin) && (
        <>
          <EditTeam
            visible={edit}
            team={team}
            toggle={() => setEdit((e) => !e)}
            setTeam={setData}
          />
          <AssignMembers
            visible={members}
            team={team}
            toggle={() => setMembers((e) => !e)}
            setTeam={setData}
          />
          <EditSession
            visible={!!addSession}
            team={team}
            session={addSession}
            toggle={() => setAddSession(undefined)}
            setTeam={setData}
          />
          <Modal title="Attending Members" visible={!!attendingMembers} cancelText="Close" footer={[
              <Button key='close' onClick={() => setAttendingMembers(undefined)}>Close</Button>
          ]} onCancel={() => setAttendingMembers(undefined)}>
            <AttendingMembers session={attendingMembers}/>
          </Modal>
        </>
      )}
    </>
  );
}

function EditSession({
  visible,
  toggle,
  team: { id, ...team },
  session,
  setTeam,
}) {
  const [form] = Form.useForm();
  const firebase = useFirebase();
  return (
    <Modal
      visible={visible}
      okText='Submit'
      cancelText='Cancel'
      onCancel={toggle}
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
            setTeam(res);
            form.resetFields();
            toggle();
          });
      }}
    >
      <Form
        form={form}
        layout='vertical'
        name='edit-session'
        initialValues={
          session?.id && { ...session, range: [moment(session.start.toDate()), moment(session.end.toDate())] }
        }
      >
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

function EditTeam({ visible, toggle, team: { id, ...values }, setTeam }) {
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
            setTeam(res);
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

function AssignMembers({ visible, toggle, team: { id, ...values }, setTeam }) {
  const [form] = Form.useForm();
  const firebase = useFirebase();
  const [userList, setUsers] = useState([]);

  useEffect(() => {
    const getData = async () => {
      try {
        setUsers(await firebase.getUserList());
      } catch (e) {
        console.error(e);
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
            setTeam(res);
            form.resetFields();
            toggle();
          });
      }}
    >
      <Form
        form={form}
        layout='vertical'
        name='assign-members'
        initialValues={{ members: values.members?.map((e) => e.id) ?? [] }}
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


function AttendingMembers({ session }){
    const firebase = useFirebase();
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const getData = async () => {
            try{
                setMembers(await firebase.getMembersAttending(session));
            }catch(e){
                console.error(e);
            }
        }
        getData();
    }, []);

    return (
        <List dataSource={members} renderItem={member => <List.Item key={member.id}>
            <List.Item.Meta title={member.displayName} description={member.phoneNumber} />
        </List.Item>} />
    )

}