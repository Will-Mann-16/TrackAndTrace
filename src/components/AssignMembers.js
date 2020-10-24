import React, { useState, useEffect } from "react";
import { useFirebase } from "../firebase";
import {
  Button,
  List,
  Modal,
  Select,
  notification,
  Space,
  Divider,
  Dropdown,
  Menu
} from "antd";
import { sortBy } from "lodash";
import { CheckOutlined, CloseOutlined, PlusOutlined, DownOutlined } from "@ant-design/icons";

const { Option } = Select;
export default function AssignMembers({
  visible,
  toggle,
  team: { id, members, applied, captains, ...rest },
}) {
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
      title='Members'
      cancelText='Cancel'
      onCancel={toggle}
      footer={[
        <Button key='close' onClick={toggle}>
          Close
        </Button>,
      ]}
    >
      <List
        dataSource={[
          ...sortBy(applied, "displayName"),
          ...sortBy(members, "displayName"),
        ]}
        pagination={{ pageSize: 10 }}
        itemLayout='horizontal'
        renderItem={(member) => (
          <List.Item
            key={member.id}
            actions={
              !!members.find((e) => e.id === member.id)
                ? [
                    <Button
                      type='danger'
                      disabled={!!captains.find((e) => e.id === member.id)}
                      onClick={() => firebase.removeMember(id, member.id)}
                    >
                      <CloseOutlined />
                      Remove
                    </Button>,
                  ]
                : [
                    <Button
                      type='primary'
                      onClick={() => firebase.approveMember(id, member.id)}
                    >
                      <CheckOutlined />
                      Approve
                    </Button>,
                    <Button
                      type='danger'
                      onClick={() => firebase.denyMember(id, member.id)}
                    >
                      <CloseOutlined />
                      Deny
                    </Button>,
                  ]
            }
          >
            <List.Item.Meta title={member.displayName} />
          </List.Item>
        )}

      />
      <br/>
        <Dropdown overlay={<Menu>
          {userList.map(({ id: uid, displayName }) => (
            <Menu.Item key={uid} onClick={() => firebase.addMember(id, uid)}>
              {displayName}
            </Menu.Item>
          ))}
        </Menu>}>
          <Button block type='primary'>
            <PlusOutlined /> Add Member <DownOutlined/>
          </Button>
        </Dropdown>
    </Modal>
  );
}
