import React, { useEffect } from "react";
import { BrowserRouter, Switch, Route, Redirect, useHistory, useLocation } from "react-router-dom";
import { useUser, useFirebase } from "./firebase";
import { Layout, Menu, Text } from "antd";
import styled, { css } from "styled-components";

import HomeView from './views/HomeView';
import AccountView from './views/AccountView';
import AdminView from './views/AdminView';
import TeamsView from './views/TeamsView';
import TeamView from './views/TeamView';

const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;

const Main = styled(Content)`
  ${({ center }) =>
    center &&
    css`
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    `}

    ${({fullWidth}) => !fullWidth && css`max-width: 960px;`}
    margin: auto;
    width: 100%;
    padding: 48px;
`;

const Topbar = styled(Header)`
  display: flex;
  justify-content: space-between;
`;

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: "100vh" }}>
        <Topbar className='header'>
          <Nav/>
        </Topbar>
        <Container/>
        <Footer style={{ textAlign: "center" }}>Developed by Will Mann</Footer>
      </Layout>
    </BrowserRouter>
  );
}

function Container(){
  const user = useUser();
  const location = useLocation();

return (
  <Main center={!user} fullWidth={location.pathname === '/admin'}>
          {!!user ? (
            <Switch>
            <Route path='/' exact component={HomeView}/>
            <Route path='/teams' exact component={TeamsView}/>
            <Route path='/teams/:teamId' component={TeamView}/> 
            <Route path='/account' component={AccountView} />
            {user.admin && <Route path='/admin' component={AdminView}/>}
              <Route />
              {!user.displayName && <Redirect to='/accounts'/>}
            </Switch>
          ) : (
            <PhoneAuth />
          )}
        </Main>
)
}

function Nav(){
  const user = useUser();
  const history = useHistory();
  const location = useLocation();
  return !!user && (
    <Menu theme='dark' mode='horizontal' selectedKeys={['/' + location.pathname.split('/')[1]]} onClick={({key}) => history.push(key)}>
      <Menu.Item key='/'>Home</Menu.Item>
      <Menu.Item key='/teams'>Teams</Menu.Item>
      <Menu.Item key='/account'>Account</Menu.Item>
      {user?.admin && <Menu.Item key='/admin'>Admin</Menu.Item>}
    </Menu>
  );
}

export function PhoneAuth() {
  const firebase = useFirebase();

  useEffect(() => {
    firebase.ui.start("#firebaseui-auth-container", {
      signInSuccessUrl: "http://localhost:3000/",
      signInOptions: [        {
        provider: firebase.app.auth.PhoneAuthProvider.PROVIDER_ID,
        defaultCountry: "GB"
      },],
      tosUrl: "https://localhost:3000",
      callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            return false;
          },
      }
    });
  }, []);
  return <div id='firebaseui-auth-container' />;
}

export default App;
