import React, { useState, useEffect, useMemo } from "react";
import { useUser, useTeams } from "../firebase";
import { List, Modal, Button } from "antd";
import { sortBy } from "lodash";

export function useMembers(session, key) {
  const { data: teams } = useTeams();
  return useMemo(() => {
    const team = teams.find((e) => e.id === session?.team);
    return (
      team?.members.filter(
        (e) =>
          Array.isArray(session[key]) && session[key].some((f) => e.id === f)
      ) ?? []
    );
  }, [session, teams, key]);
}

export default function AttendingMembers({
  visible,
  toggle,
  session,
  override = "attending",
  ...props
}) {
  const members = useMembers(session, override);

  return (
    <Modal
      visible={visible}
      cancelText='Close'
      footer={[
        <Button key='close' onClick={toggle}>
          Close
        </Button>,
      ]}
      onCancel={toggle}
      {...props}
    >
      <List
        dataSource={sortBy(members, "displayName")}
        renderItem={(member) => (
          <List.Item key={member.id}>
            <List.Item.Meta title={member.displayName} />
          </List.Item>
        )}
      />
    </Modal>
  );
}
