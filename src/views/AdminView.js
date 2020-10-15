import React from "react";
import {
  Admin,
  Resource,
  Layout,
  List,
  Datagrid,
  TextField,
  EmailField,
  ImageField,
  BooleanField,
  ReferenceArrayField,
  ChipField,
  SingleFieldList,
  FunctionField,
  DateField,
  ReferenceField,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  BooleanInput,
  ReferenceArrayInput,
  SelectArrayInput,
  DateTimeInput,
  ReferenceInput,
  SelectInput,
  SimpleList,
} from "react-admin";
import { FirebaseDataProvider } from "react-admin-firebase";
import { config, useFirebase } from "../firebase";
import { useMediaQuery } from "@material-ui/core";
import { DateTime } from "luxon";
export default function AdminView() {
    const firebase = useFirebase();
  return (
    <Admin
      layout={(props) => <Layout {...props} appBar={() => null} />}
      dataProvider={FirebaseDataProvider(config, {app: firebase.app, associateUsersById: true, metaFieldCasing: 'camel'})}
    >
      <Resource name='users' list={UserList} edit={EditUser} />
      <Resource
        name='teams'
        list={TeamList}
        edit={EditTeam}
        create={CreateTeam}
      />
      <Resource
        name='sessions'
        list={SessionList}
        edit={EditSession}
        create={CreateSession}
      />
    </Admin>
  );
}

function UserList(props) {
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down("md"));
  return (
    <List {...props}>
      {isSmall ? (
        <SimpleList
          primaryText={(record) => record.displayName}
          secondaryText={(record) => record.email}
          tertiary={(record) => record.phoneNumber}
        />
      ) : (
        <Datagrid rowClick='edit'>
          {/* <ImageField source="photoURL" /> */}
          <TextField source='displayName' />
          <EmailField source='email' />
          <TextField source='phoneNumber' />
          <BooleanField source='admin' />
        </Datagrid>
      )}
    </List>
  );
}

function EditUser(props) {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source='id' disabled />
        <TextInput source='displayName' disabled />
        <TextInput source='email' type='email' disabled  />
        <TextInput source='phoneNumber' type='tel' disabled />
        <BooleanInput source='admin' />
      </SimpleForm>
    </Edit>
  );
}

function TeamList(props) {
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down("md"));
  return (
    <List {...props}>
      {isSmall ? (
        <SimpleList
          primaryText={(record) => record.name}
          secondaryText={(record) => record.bio}
          tertiary={(record) => `${record?.members?.length ?? 0} members`}
        />
      ) : (
        <Datagrid rowClick='edit'>
          <TextField source='name' />
          <TextField source='bio' />
          <FunctionField
            label='Members'
            render={(record) => `${record?.members?.length ?? 0} members`}
          />
          <ReferenceArrayField source='captains' reference='users'>
            <SingleFieldList>
              <ChipField source='displayName' />
            </SingleFieldList>
          </ReferenceArrayField>
        </Datagrid>
      )}
    </List>
  );
}

function EditTeam(props) {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source='id' disabled />
        <TextInput source='name' />
        <TextInput source='bio' multiline />
        <ReferenceArrayInput
          label='Captains'
          source='captains'
          reference='users'
        >
          <SelectArrayInput optionText='displayName' />
        </ReferenceArrayInput>
        <p>
          <strong>Note: all captains must also be members.</strong>
        </p>
        <ReferenceArrayInput label='Members' source='members' reference='users'>
          <SelectArrayInput optionText='displayName' />
        </ReferenceArrayInput>
      </SimpleForm>
    </Edit>
  );
}

function CreateTeam(props) {
  return (
    <Create {...props}>
      <SimpleForm>
        <TextInput source='name' />
        <TextInput source='bio' multiline />
        <ReferenceArrayInput
          label='Captains'
          source='captains'
          reference='users'
        >
          <SelectArrayInput optionText='displayName' />
        </ReferenceArrayInput>
        <p>
          <strong>Note: all captains must also be members.</strong>
        </p>
        <ReferenceArrayInput label='Members' source='members' reference='users'>
          <SelectArrayInput optionText='displayName' />
        </ReferenceArrayInput>
      </SimpleForm>
    </Create>
  );
}

function SessionList(props) {
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down("md"));
  return (
    <List {...props}>
      {isSmall ? (
        <SimpleList
          primaryText={(record) => record.name}
          secondaryText={(record) => record.description}
          tertiary={(session) =>
            `${DateTime.fromJSDate(session.start.toDate()).toFormat(
              "ccc dd LLL T"
            )} - ${DateTime.fromJSDate(session.end.toDate()).toFormat(
              DateTime.fromJSDate(session.start.toDate()).hasSame(
                DateTime.fromJSDate(session.end.toDate()),
                "day"
              )
                ? "T"
                : "ccc dd LLL T"
            )}`
          }
        />
      ) : (
        <Datagrid rowClick='edit'>
          <DateField showTime source='start' />
          <DateField showTime source='end' />
          <ReferenceField source='team' reference='teams'>
            <TextField source='name' />
          </ReferenceField>
          <TextField source='name' />
          <TextField source='description' />
          <FunctionField
            label='Attending'
            render={(record) => `${record?.attending?.length ?? 0} attending`}
          />
        </Datagrid>
      )}
    </List>
  );
}

function EditSession(props) {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source='id' disabled />
        <DateTimeInput source='start' />
        <DateTimeInput source='end' />
        <TextInput source='name' />
        <TextInput source='description' multiline />
        <ReferenceInput label='Team' source='team' reference='teams'>
          <SelectInput optionText='name' />
        </ReferenceInput>
        <ReferenceArrayInput
          label='Attending'
          source='attending'
          reference='users'
        >
          <SelectArrayInput disabled optionText='displayName' />
        </ReferenceArrayInput>
      </SimpleForm>
    </Edit>
  );
}

function CreateSession(props) {
  return (
    <Create {...props}>
      <SimpleForm>
        <DateTimeInput source='start' />
        <DateTimeInput source='end' />
        <TextInput source='name' />
        <TextInput source='description' multiline />
        <ReferenceInput label='Team' source='team' reference='teams'>
          <SelectInput optionText='name' />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
}
