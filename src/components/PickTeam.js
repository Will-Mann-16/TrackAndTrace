import React, { useState, useEffect, useMemo } from "react";
import { useUser, useTeams, useFirebase } from "../firebase";
import { List, notification, Form, Select, Button, Modal, Divider } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { sortBy } from "lodash";
import { useMembers } from "./AttendingMembers";

const { Option } = Select;
export default function PickTeam({ visible, toggle, session }) {
  const attending = useMembers(session, "attending");
  const available = useMembers(session, "available");

  const [form] = Form.useForm();
  const firebase = useFirebase();
  const user = useUser();
  const { data: teams } = useTeams();
  const team = useMemo(() => teams.find((e) => e.id === session?.team) || {}, [
    teams,
    session,
  ]);

  return (
    <Modal
      visible={visible}
      title='Team'
      cancelText='Close'
      onCancel={toggle}
      key='team'
      footer={[
        <Button key='close' onClick={toggle}>
          Close
        </Button>,
      ]}
    >
      {(team.captains?.find((e) => e.id === user.id) || user.admin) && (
        <>
          <Form
            form={form}
            layout='inline'
            name='pick-team'
            onFinish={(values) =>
              firebase.updateSession(session.id, {
                attending: [...session.attending, values.attending],
                team: session.team,
              })
            }
            onFinishFailed={(err) => notification.error({
              message: err.message
            })}
          >
            <Form.Item
              name='attending'
              label='Playing'
              rules={[
                {
                  required: true,
                  message: "Please select team members",
                },
              ]}
            >
              <Select placeholder='Please select team member to add'>
                {available
                  .filter((e) => !attending.some((f) => e.id === f.id))
                  .map(({ id, displayName }) => (
                    <Option key={id} value={id}>
                      {displayName}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type='primary' htmlType='submit'>Add</Button>
            </Form.Item>
          </Form>
          <Divider />
        </>
      )}
      <List
        dataSource={sortBy(attending, "displayName")}
        renderItem={(member) => (
          <List.Item
            key={member.id}
            actions={
              (team.captains?.find((e) => e.id === user.id) || user.admin) && [
                <Button
                  danger
                  onClick={() => {
                    const attending = [...session.attending];
                    attending.splice(
                      attending.findIndex((e) => e === member.id),
                      1
                    );
                    firebase.updateSession(session.id, {
                      attending,
                      team: session.team,
                    });
                  }}
                >
                  <CloseOutlined />
                  Remove
                </Button>,
              ]
            }
          >
            <List.Item.Meta title={member.displayName} />
          </List.Item>
        )}
      />
    </Modal>
  );
}
