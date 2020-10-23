import React, { useEffect } from "react";
import { useFirebase } from "../firebase";
import { Form, Input, Modal, DatePicker, Select } from "antd";
import moment from "moment";
import { DateTime } from "luxon";
import { useMembers } from "./AttendingMembers";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function EditSession({
  visible,
  toggle,
  team: { id, ...team },
  session,
}) {
  const [form] = Form.useForm();
  const firebase = useFirebase();

  useEffect(() => {
    if (!session?.id) {
      form.resetFields();
      form.setFieldsValue({
        type: "training",
        location: "Weetwood Sports Park",
      });
    } else {
      form.setFieldsValue(
        session.type === "training"
          ? {
              ...session,
              range: [
                moment(session.start.toDate()),
                moment(session.end.toDate()),
              ],
            }
          : {
              ...session,
              start: moment(session.start.toDate()),
            }
      );
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
          .then(({ type, ...values }) => {
            let newSession = {};
            if (type === "training") {
              const { range, ...rest } = values;
              newSession = {
                ...rest,
                team: id,
                start: range[0].toDate(),
                end: range[1].toDate(),
                type,
              };
            } else {
              const { start, opposition, description, location } = values;
              newSession = {
                description,
                location,
                opposition,
                name: `${team.name} vs ${opposition}`,
                team: id,
                start: start.toDate(),
                end: DateTime.fromJSDate(start.toDate())
                  .plus({ minutes: 90 })
                  .toJSDate(),
                type,
              };
            }
            return session?.id
              ? firebase.updateSession(session.id, newSession)
              : firebase.createSession(newSession);
          })
          .then((res) => {
            form.resetFields();
            toggle();
          });
      }}
    >
      <Form form={form} layout='vertical' name='edit-session'>
        <Form.Item
          name='type'
          label='Type'
          rules={[
            {
              required: true,
              message: "Please select type",
            },
          ]}
        >
          <Select placeholder='Please select type'>
            <Option value='training'>Training</Option>
            <Option value='fixture'>Fixture</Option>
          </Select>
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.type !== currentValues.type
          }
        >
          {({ getFieldValue }) =>
            getFieldValue("type") === "training" ? (
              <>
                <Form.Item name='range' label='Start Time / End Time'>
                  <RangePicker showTime format='YYYY-MM-DD HH:mm:ss' />
                </Form.Item>
                <Form.Item
                  name='name'
                  label='Session name'
                  rules={[
                    { required: true, message: "Session name is required" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name='location'
                  label='Session location'
                  rules={[
                    { required: true, message: "Session location is required" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name='description'
                  label='Session description'
                  rules={[
                    {
                      required: true,
                      message: "Session description is required",
                    },
                  ]}
                >
                  <Input.TextArea rows={4} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name='start' label='Start Time'>
                  <DatePicker showTime format='YYYY-MM-DD HH:mm:ss' />
                </Form.Item>
                <Form.Item
                  name='opposition'
                  label='Opposition'
                  rules={[
                    { required: true, message: "Opposition is required" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name='location'
                  label='Fixture location'
                  rules={[
                    {
                      required: true,
                      message: "Fixture location is required",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name='description'
                  label='Fixture details'
                  rules={[
                    {
                      required: true,
                      message: "Fixture details is required",
                    },
                  ]}
                >
                  <Input.TextArea rows={4} />
                </Form.Item>
              </>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  );
}
