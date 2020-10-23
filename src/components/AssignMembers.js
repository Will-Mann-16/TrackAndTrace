import React, { useState, useEffect } from "react";
import { useFirebase } from "../firebase";
import { Form, Modal, Select, notification } from "antd";
import { sortBy } from "lodash";

const { Option } = Select;
export default function AssignMembers({
  visible,
  toggle,
  team: { id, ...values },
}) {
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
