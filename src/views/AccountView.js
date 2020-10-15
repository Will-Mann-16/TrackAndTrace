import React, { useEffect, useState } from "react";
import { Form, Input, Button, Typography, Result } from "antd";
import { useUser, useFirebase } from "../firebase";
import { PhoneNumberUtil } from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();
export default function AccountView() {
  const user = useUser();
  const firebase = useFirebase();
  const [reauth, setReauth] = useState(false);
  const [finished, setFinished] = useState(true);

  useEffect(() => {
    const testAuth = async () => {
      try {
        await firebase.auth.currentUser.updateProfile({ displayName: user.displayName });
        setReauth(false);
      } catch (e) {
        console.error(e);
        setReauth(true);
        firebase.ui.start("#firebaseui-reauth-container", {
            signInSuccessUrl: process.env.NODE_ENV === 'production' ? process.env.REACT_APP_PROD_URL : process.env.REACT_APP_DEV_URL,
            signInOptions: [
            {
              provider: firebase.app.auth.PhoneAuthProvider.PROVIDER_ID,
              defaultCountry: "GB",
              defaultNationalNumber: phoneUtil
                .parse(user.phoneNumber)
                .getNationalNumber(),
            },
          ],
          callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
              setReauth(false);
              return false;
            },
          },
        });
      }
    };

    testAuth();
  }, []);

  return (
    <>
      <Typography.Title>Account</Typography.Title>
      {!reauth &&
        <Form
          layout='vertical'
          name='account'
          onFinish={async values => {
              await firebase.updateUser(values);
              setFinished(true);
              }}
          initialValues={{
            displayName: user.displayName,
            email: user.email,
            phoneNumber: user.phoneNumber,
          }}
        >
          <Form.Item
            label='Name'
            name='displayName'
            hasFeedback={finished}
            validateStatus={finished && 'success'}
            rules={[
              {
                required: true,
                message: "Please input your name",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='Email address'
            name='email'
            hasFeedback={finished}
            validateStatus={finished && 'success'}
            rules={[
              {
                required: true,
                message: "Please input your email",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='Phone number'
            name='phoneNumber'
            hasFeedback={finished}
            validateStatus={finished && 'success'}
            rules={[
              {
                required: true,
                message: "Please input your phone number",
              },
            ]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit'>
              Submit
            </Button>
            <Button style={{marginLeft: 8}} type='danger' onClick={firebase.signOut}>
              Logout
            </Button>
          </Form.Item>
        </Form>}
        <div id='firebaseui-reauth-container' />
        {reauth && <Button style={{width: '100%'}} type='danger' onClick={firebase.signOut}>
              Logout
            </Button>}
    </>
  );
}
