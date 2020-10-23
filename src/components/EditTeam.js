import React from "react";
import { useFirebase } from "../firebase";
import { Form, Input, Modal } from "antd";

export default function EditTeam({ visible, toggle, team: { id, ...values } }) {
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
