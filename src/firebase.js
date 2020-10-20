import React, { createContext, useContext, useState, useEffect } from "react";
import app from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/analytics";
import * as firebaseUI from "firebaseui";
import { DateTime } from "luxon";
import LogRocket from "logrocket";
import * as Sentry from "@sentry/react";

export const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

class Firebase {
  constructor() {
    app.initializeApp(config);

    this.app = app;
    this.auth = app.auth();
    this.firestore = app.firestore();
    this.ui = new firebaseUI.auth.AuthUI(this.auth);
    this.analytics = app.analytics();
  }

  onAuthStateChanged = (callback) => {
    this.auth.onAuthStateChanged(async (result) => {
      if (result) {
        const ref = await this.firestore
          .collection("users")
          .doc(result.uid)
          .get();
        if (ref.exists) {
          const data = ref.data();
          if (!data.displayName || (!!result.displayName && data.displayName !== result.displayName)) {
            await this.firestore.collection("users").doc(result.uid).update({
              displayName: result.displayName,
              email: result.email,
              emailVerified: result.emailVerified,
              photoURL: result.photoURL,
              phoneNumber: result.phoneNumber,
            });
          } else if (!result.displayName) {
            await this.auth.currentUser.updateEmail(data.email);
            await this.auth.currentUser.updateProfile({
              displayName: data.displayName,
            });
          }
        } else {
          await this.firestore.collection("users").doc(result.uid).set({
            displayName: result.displayName,
            email: result.email,
            emailVerified: result.emailVerified,
            photoURL: result.photoURL,
            phoneNumber: result.phoneNumber,
            admin: false,
          });
        }

        Sentry.configureScope((scope) => {
          scope.setUser({
            id: result.uid,
            username: result.displayName,
            email: result.email,
          });
        });

        LogRocket.identify(result.uid, {
          name: result.displayName,
          email: result.email,
          phoneNumber: result.phoneNumber,
        });

        this.analytics.setUserId(result.uid);
        this.analytics.setUserProperties({
          displayName: result.displayName,
          email: result.email,
          phoneNumber: result.phoneNumber,
        });

        const send = this.analytics.logEvent;

        LogRocket.getSessionURL(function (sessionURL) {
          send("send", {
            hitType: "event",
            eventCategory: "LogRocket",
            eventAction: sessionURL,
          });
        });

        return callback({
          ...result,
          id: result.uid,
          ...ref.data(),
        });
      } else {
        LogRocket.identify(null);
        Sentry.configureScope((scope) => scope.setUser(null));
        callback(result);
      }
    });
  };

  updateUser = async ({ email, phoneNumber, displayName }) => {
    const current = this.auth.currentUser;

    await current.updateEmail(email.replace(/^\s+|\s+$/gm, "").toLowerCase());
    // await current.updatePhoneNumber(phoneNumber);
    await current.updateProfile({ displayName });

    await this.firestore
      .collection("users")
      .doc(current.uid)
      .update({
        email: email.replace(/^\s+|\s+$/gm, "").toLowerCase(),
        phoneNumber,
        displayName,
      });

    return current;
  };

  signOut = async () => await this.auth.signOut();

  sortText = (field, desc = false) => (a, b) => {
    if (a[field] < b[field]) return desc ? 1 : -1;
    if (a[field] > b[field]) return desc ? -1 : 1;
    return 0;
  };
  sortNumbers = (field, desc = false) => (a, b) =>
    !desc ? a[field] - b[field] : b[field] - a[field];

  getData = (data) => ({ id: data.id, ...data.data() });

  teamsListener = async (callback) => {
    if (!this.auth.currentUser?.uid) return () => {};
    if (
      (
        await this.firestore
          .collection("users")
          .doc(this.auth.currentUser.uid)
          .get()
      ).data().admin
    ) {
      const data = this.firestore.collection("teams");
      return data.onSnapshot(callback);
    } else {
      const data = this.firestore
        .collection("teams")
        .where("members", "array-contains", this.auth.currentUser.uid);
      return data.onSnapshot(callback);
    }
  };

  populateTeam = async (team) => {
    const captains = !!team.captains
      ? (
          await this.firestore
            .collection("users")
            .where(app.firestore.FieldPath.documentId(), "in", team.captains)
            .get()
        ).docs
          .map(this.getData)
          .sort(this.sortText("name"))
      : [];
    const members = !!team.members
      ? (
          await this.firestore
            .collection("users")
            .where(app.firestore.FieldPath.documentId(), "in", team.members)
            .get()
        ).docs
          .map(this.getData)
          .sort(this.sortText("name"))
      : [];

    return { ...team, captains, members };
  };

  sessionsListener = async (callback) => {
    if (!this.auth.currentUser?.uid) return () => {};
    let teams = [];
    if (
      (
        await this.firestore
          .collection("users")
          .doc(this.auth.currentUser.uid)
          .get()
      ).data().admin
    ) {
      teams = (await this.firestore.collection("teams").get()).docs.map(
        (e) => e.id
      );
    } else {
      teams = (
        await this.firestore
          .collection("teams")
          .where("members", "array-contains", this.auth.currentUser.uid)
          .get()
      ).docs.map((e) => e.id);
    }
    if (teams.length === 0) return () => {};
    return this.firestore
      .collection("sessions")
      .where("team", "in", teams)
      .onSnapshot(callback);
  };

  updateTeam = async (teamID, team) => {
    if (
      (await this.firestore.collection("teams").doc(teamID).get())
        .data()
        .captains.includes(this.auth.currentUser.uid) ||
      (
        await this.firestore
          .collection("users")
          .doc(this.auth.currentUser.uid)
          .get()
      ).data().admin
    ) {
      await this.firestore.collection("teams").doc(teamID).update(team);
    } else {
      throw new Error("Not authorized");
    }
  };

  getUserList = async () => {
    return (await this.firestore.collection("users").get()).docs
      .map(this.getData)
      .map((e) => ({ displayName: e.displayName, id: e.id }));
  };

  createSession = async (session) => {
    if (
      (await this.firestore.collection("teams").doc(session.team).get())
        .data()
        .captains.includes(this.auth.currentUser.uid) ||
      (
        await this.firestore
          .collection("users")
          .doc(this.auth.currentUser.uid)
          .get()
      ).data().admin
    ) {
      await this.firestore
        .collection("sessions")
        .add({ ...session, attending: [] });
    } else {
      throw new Error("Not authorized");
    }
  };

  updateSession = async (sessionID, session) => {
    if (
      (await this.firestore.collection("teams").doc(session.team).get())
        .data()
        .captains.includes(this.auth.currentUser.uid) ||
      (
        await this.firestore
          .collection("users")
          .doc(this.auth.currentUser.uid)
          .get()
      ).data().admin
    ) {
      await this.firestore
        .collection("sessions")
        .doc(sessionID)
        .update(session);
    } else {
      throw new Error("Not authorized");
    }
  };
  deleteSession = async (session) => {
    if (
      (await this.firestore.collection("teams").doc(session.team).get())
        .data()
        .captains.includes(this.auth.currentUser.uid) ||
      (
        await this.firestore
          .collection("users")
          .doc(this.auth.currentUser.uid)
          .get()
      ).data().admin
    ) {
      await this.firestore.collection("sessions").doc(session.id).delete();
    } else {
      throw new Error("Not authorized");
    }
  };

  setAttending = async (sessionID, status) => {
    if (
      (
        await this.firestore
          .collection("teams")
          .doc(
            (
              await this.firestore.collection("sessions").doc(sessionID).get()
            ).data().team
          )
          .get()
      )
        .data()
        .members.includes(this.auth.currentUser.uid)
    ) {
      await this.firestore
        .collection("sessions")
        .doc(sessionID)
        .update({
          attending: status
            ? app.firestore.FieldValue.arrayUnion(this.auth.currentUser.uid)
            : app.firestore.FieldValue.arrayRemove(this.auth.currentUser.uid),
        });
    } else {
      throw new Error("Not a member of this team");
    }
  };

  getMembersAttending = async (sessionID) => {
    const session = (
      await this.firestore.collection("sessions").doc(sessionID).get()
    ).data();
    if (
      (await this.firestore.collection("teams").doc(session.team).get())
        .data()
        .captains.includes(this.auth.currentUser.uid) ||
      (
        await this.firestore
          .collection("users")
          .doc(this.auth.currentUser.uid)
          .get()
      ).data().admin
    ) {
      const members = await this.firestore
        .collection("users")
        .where(app.firestore.FieldPath.documentId(), "in", session.attending)
        .get();
      return members.docs.map(this.getData);
    } else {
      throw new Error("Not a captain of this team / admin");
    }
  };
}

export const FirebaseContext = createContext();
export const UserContext = createContext();
export const TeamContext = createContext();
export const SessionContext = createContext();

function FirebaseProvider({ children }) {
  return (
    <FirebaseContext.Provider value={new Firebase()}>
      {children}
    </FirebaseContext.Provider>
  );
}

function UserProvider({ children }) {
  const [user, setUser] = useState();
  const firebase = useContext(FirebaseContext);

  useEffect(() => {
    firebase.onAuthStateChanged(setUser);
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

function TeamProvider({ children }) {
  const [{ loading, error, data }, setVariables] = useState({
    loading: false,
    error: null,
    data: [],
  });
  const firebase = useContext(FirebaseContext);
  const user = useContext(UserContext);

  useEffect(() => {
    const unsub = firebase.teamsListener(
      async (snapshot) => {
        try {
          setVariables((e) => ({ ...e, loading: true }));
          const data = await Promise.all(
            snapshot.docs
              .map(firebase.getData)
              .sort(firebase.sortText("name"))
              .map(async (team) => await firebase.populateTeam(team))
          );
          setVariables({ loading: false, error: null, data });
        } catch (e) {
          setVariables({ loading: false, error: e, data: [] });
        }
      },
      (e) => setVariables({ loading: false, error: e, data: [] })
    );

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [user]);

  return (
    <TeamContext.Provider value={{ loading, error, data }}>
      {children}
    </TeamContext.Provider>
  );
}

function SessionProvider({ children }) {
  const [{ loading, error, data }, setVariables] = useState({
    loading: false,
    error: null,
    data: [],
  });
  const firebase = useContext(FirebaseContext);
  const user = useContext(UserContext);

  useEffect(() => {
    const unsub = firebase.sessionsListener(
      async (snapshot) => {
        try {
          setVariables((e) => ({ ...e, loading: true }));
          const data = await Promise.all(snapshot.docs.map(firebase.getData));
          setVariables({ loading: false, error: null, data });
        } catch (e) {
          setVariables({ loading: false, error: e, data: [] });
        }
      },
      (e) => setVariables({ loading: false, error: e, data: [] })
    );

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [user]);

  return (
    <SessionContext.Provider
      value={{
        loading,
        error,
        data,
        setData: (e) => setVariables((f) => ({ ...f, data: e })),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function Providers({ children }) {
  return (
    <FirebaseProvider>
      <UserProvider>
        <TeamProvider>
          <SessionProvider>{children}</SessionProvider>
        </TeamProvider>
      </UserProvider>
    </FirebaseProvider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useUser() {
  return useContext(UserContext);
}

export function useTeams() {
  return useContext(TeamContext);
}

export function useSessions() {
  return useContext(SessionContext);
}
