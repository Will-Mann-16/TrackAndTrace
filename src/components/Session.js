import React, { useMemo, useState, Fragment, memo } from "react";
import { useUser, useFirebase, useTeams } from "../firebase";
import {
  EditOutlined,
  UsergroupAddOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { List, Button, Popconfirm, notification, Tooltip } from "antd";
import { DateTime } from "luxon";
import { saveAs } from "file-saver";
import { Link } from "react-router-dom";
import EditSession from "../components/EditSession";
import AttendingMembers from "../components/AttendingMembers";
import PickTeam from "../components/PickTeam";

const IconText = ({ icon, text, tooltip, ...props }) => (
  <Tooltip title={tooltip}>
    <Button {...props}>
      {React.createElement(icon)}
      {text}
    </Button>
  </Tooltip>
);

function Session({
  session,
  showActions,
  linkToTeam
}) {
  const user = useUser();
  const firebase = useFirebase();
  const { data: teams } = useTeams();

  const team = useMemo(() => teams.find((e) => e.id === session.team) || {}, [
    teams,
    session,
  ]);

  const [edit, setEdit] = useState(false);
  const [attending, setAttending] = useState(false);
  const [available, setAvailable] = useState(false);

  return (
    <Fragment key={session.id}>
      <List.Item
        style={{
          opacity:
            DateTime.local().startOf("day").toJSDate() > session.start.toDate()
              ? 0.6
              : 1,
        }}
        key={session.id}
        actions={
          showActions &&
          (team.captains?.find((e) => e.id === user.id) || user.admin)
            ? [
                <IconText
                  text={session.type === "training" ? "Attending" : "Team"}
                  icon={TeamOutlined}
                  onClick={() => setAttending(true)}
                  type='text'
                  key='attending'
                  tooltip={
                    session.type === "training"
                      ? "See who's attending"
                      : "Choose who's playing"
                  }
                />,
                session.type === "fixture" && (
                  <IconText
                    text='Available'
                    icon={UsergroupAddOutlined}
                    onClick={() => setAvailable(true)}
                    type='text'
                    key='available'
                    tooltip="See who's available to play"
                  />
                ),
                <IconText
                  text='Edit'
                  icon={EditOutlined}
                  onClick={() => setEdit(true)}
                  type='text'
                  key='edit'
                  tooltip='Edit your session'
                />,
                <Popconfirm
                  title='Are you sure you want to delete this session?'
                  okText='Yes'
                  cancelText='No'
                  key='delete'
                  onConfirm={() => firebase.deleteSession(session)}
                >
                  <IconText
                    text='Delete'
                    type='text'
                    icon={DeleteOutlined}
                    tooltip='Delete your session'
                  />
                </Popconfirm>,
                <IconText
                  text='Download'
                  icon={DownloadOutlined}
                  type='text'
                  tooltip='Download attendance list (.xlsx)'
                  onClick={async () => {
                    try {
                      function s2ab(s) {
                        var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
                        var view = new Uint8Array(buf); //create uint8array as viewer
                        for (var i = 0; i < s.length; i++)
                          view[i] = s.charCodeAt(i) & 0xff; //convert to octet
                        return buf;
                      }
                      const wbout = await firebase.generateSpreadsheet(session);
                      saveAs(
                        new Blob([s2ab(wbout)], {
                          type: "application/octet-stream",
                        }),
                        `${session.name} - ${team.name} - ${DateTime.fromJSDate(
                          session.start.toDate()
                        ).toLocaleString(DateTime.DATE_SHORT)}.xlsx`
                      );
                    } catch (e) {
                      notification.error({
                        message: "Error",
                        description: e.message,
                      });
                    }
                  }}
                />,
              ].filter((e) => !!e)
            : session.type === "training"
            ? [
                <IconText
                  text={session.type === "training" ? "Attending" : "Team"}
                  icon={TeamOutlined}
                  onClick={() => setAttending(true)}
                  type='text'
                  key='attending'
                />,
              ]
            : []
        }
        extra={
          session.type === "training" ? (
            <Tooltip
              title={
                session.available?.some((e) => e === user.id)
                  ? "I'm going to attend"
                  : "I'm not going to attend"
              }
            >
              <Button
                type={
                  session.attending?.some((e) => e === user.id)
                    ? "primary"
                    : "default"
                }
                icon={
                  session.attending?.some((e) => e === user.id) ? (
                    <CheckOutlined />
                  ) : (
                    <CloseOutlined />
                  )
                }
                disabled={
                  DateTime.local().startOf("day").toJSDate() >
                    session.start?.toDate() ||
                  !team?.members?.some((e) => e.id === user.id)
                }
                onClick={async () => {
                  await firebase.setAttending(
                    session.id,
                    !session.attending?.some((e) => e === user.id)
                  );
                }}
              >
                Attending
              </Button>
            </Tooltip>
          ) : (
            <Tooltip
              title={
                session.attending?.some((e) => e === user.id)
                  ? "I'm playing"
                  : session.available?.some((e) => e === user.id)
                  ? "I'm available to play"
                  : "I'm not available to play"
              }
            >
              <Button
                type={
                  session.attending?.some((e) => e === user.id)
                    ? "link"
                    : session.available?.some((e) => e === user.id)
                    ? "primary"
                    : "default"
                }
                icon={
                  session.available?.some((e) => e === user.id) ? (
                    <CheckOutlined />
                  ) : (
                    <CloseOutlined />
                  )
                }
                disabled={
                  DateTime.local().startOf("day").toJSDate() >
                    session.start.toDate() ||
                  !team?.members?.some((e) => e.id === user.id)
                }
                onClick={async () => {
                  if (!session.attending?.some((e) => e === user.id)) {
                    await firebase.setAvailable(
                      session.id,
                      !session.available.some((e) => e === user.id)
                    );
                  }
                }}
              >
                {session.attending?.some((e) => e === user.id)
                  ? "Playing"
                  : "Available"}
              </Button>
            </Tooltip>
          )
        }
      >
        <List.Item.Meta
          title={
            linkToTeam ? (
              <Link to={`/teams/${session.team}`}>{session.name}</Link>
            ) : (
              session.name
            )
          }
          description={
            <span>
              {DateTime.fromJSDate(session.start?.toDate()).toFormat(
                "ccc dd LLL T"
              )}{" "}
              -{" "}
              {DateTime.fromJSDate(session.end?.toDate()).toFormat(
                DateTime.fromJSDate(session.start?.toDate()).hasSame(
                  DateTime.fromJSDate(session.end?.toDate()),
                  "day"
                )
                  ? "T"
                  : "ccc dd LLL T"
              )}{" "}
              @ <strong>{session.location}</strong>
            </span>
          }
        />
        <div dangerouslySetInnerHTML={{__html: session.description}} />
      </List.Item>
      {(team.captains?.find((e) => e.id === user.id) || user.admin) && (
        <>
          <EditSession
            visible={edit}
            team={team}
            session={session}
            toggle={() => setEdit(false)}
          />

          {session.type === "fixture" ? (
            <>
              <PickTeam
                visible={attending}
                toggle={() => setAttending(false)}
                session={session}
              />
              <AttendingMembers
                title="Available to play"
                session={session}
                visible={available}
                toggle={() => setAvailable(false)}
                override='available'
              />
            </>
          ) : (
            <AttendingMembers
              visible={attending}
              toggle={() => setAttending(false)}
              title='Attending'
              session={session}
            />
          )}
        </>
      )}
    </Fragment>
  );
}

export default memo(Session);

Session.whyDidYouRender = true;