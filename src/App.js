import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Switch,
  Route,
  Redirect,
  useHistory,
  useLocation,
} from "react-router-dom";
import { useUser, useFirebase } from "./firebase";
import { Layout, Menu, Typography, Button, Drawer } from "antd";
import { MenuOutlined } from '@ant-design/icons'
import styled, { css } from "styled-components";
import useMediaQuery from '@material-ui/core/useMediaQuery';
import * as Sentry from '@sentry/react'

import HomeView from "./views/HomeView";
import AccountView from "./views/AccountView";
import AdminView from "./views/AdminView";
import TeamsView from "./views/TeamsView";
import TeamView from "./views/TeamView";

const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;
const { Title, Paragraph } = Typography;

const Main = styled(Content)`
  ${({ center }) =>
    center &&
    css`
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    `}

  ${({ fullWidth }) =>
    !fullWidth &&
    css`
      max-width: 960px;
    `}
    margin: auto;
  width: 100%;
  padding: 2em;
`;

const Topbar = styled(Header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #144733;
`;

function App() {
  const [visible, setVisible] = useState(false);
  const matched = useMediaQuery('(min-width: 992px)')
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: "100vh" }}>
      {!matched && <Drawer
        title="Menu"
        placement="left"
        onClick={() => setVisible(false)}
        onClose={() => setVisible(false)}
        visible={visible}
      > 
        <Nav/>
     </Drawer>}
        <Topbar>
        {!matched && <Button
        type="link"
        icon={<MenuOutlined />}
        onClick={() => setVisible(true)}
        style={{flex: 1}}
      />}
          <Title
            level={3}
            style={{ flex: 10, textAlign: "center", color: "white", marginBottom: 0 }}
          >
            Track & Trace
          </Title>
          <div style={{flex: 1}} />
        </Topbar>
        <Layout>
          <Sider
            breakpoint={"lg"}
            theme='light'
            collapsedWidth={0}
            trigger={null}
          >
            <Nav />
          </Sider>
          <Container />
        </Layout>
      </Layout>
    </BrowserRouter>
  );
}

function NotFoundView(){
  return (
    <>
    <Title type='danger'>404 - Page not found</Title>
        <Title type='danger' level={3}>404 - Page not found</Title>
        </>
  )
}

function Container() {
  const user = useUser();
  const location = useLocation();

  return (
    <Sentry.ErrorBoundary fallback="An error has occursed">
    <Main center={!user} fullWidth={location.pathname === "/admin" || location.pathname === "/teams"}>
      {!!user ? (
        <>
        <Switch>
          <Route path='/' exact component={HomeView} />
          <Route path='/teams' exact component={TeamsView} />
          <Route path='/teams/:teamId' component={TeamView} />
          <Route path='/account' component={AccountView} />
          {user.admin && <Route path='/admin' component={AdminView} />}
          <Route component={NotFoundView} />
        </Switch>
        {!user.displayName && <Redirect to='/account' />}
        </>
      ) : (
        <PhoneAuth />
      )}
    </Main>
    </Sentry.ErrorBoundary>
  );
}

function Nav() {
  const user = useUser();
  const history = useHistory();
  const location = useLocation();
  return (
    <Menu
      mode='inline'
      selectedKeys={["/" + location.pathname.split("/")[1]]}
      onClick={({ key }) => history.push(key)}
      style={{ height: "100%", borderRightWidth: 0 }}
    >
      {!!user && (
        <>
          <Menu.Item key='/'>Home</Menu.Item>
          <Menu.Item key='/teams'>Teams</Menu.Item>
          <Menu.Item key='/account'>Account</Menu.Item>
          {user?.admin && <Menu.Item key='/admin'>Admin</Menu.Item>}
        </>
      )}
    </Menu>
  );
}

export function PhoneAuth() {
  const firebase = useFirebase();

  useEffect(() => {
    firebase.ui.start("#firebaseui-auth-container", {
      signInSuccessUrl:
        window.location.href,
      signInOptions: [
        {
          provider: firebase.app.auth.PhoneAuthProvider.PROVIDER_ID,
          defaultCountry: "GB",
        },
      ],
      callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
          return false;
        },
      },
    });
  }, []);
  return <div id='firebaseui-auth-container' />;
}

export default App;
