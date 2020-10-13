import React, { createContext, useContext, useState, useEffect } from "react";
import app from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import * as firebaseUI from 'firebaseui';
import { DateTime } from 'luxon';

export const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
};

class Firebase {
  constructor() {
    app.initializeApp(config);

    this.app = app;
    this.auth = app.auth();
    this.firestore = app.firestore();
    this.ui = new firebaseUI.auth.AuthUI(this.auth);
  }

  onAuthStateChanged = (callback) => {
    this.auth.onAuthStateChanged(async result => {
        if(result){
            const ref = this.firestore.collection('users').doc(result.uid);
            await ref.update({
                displayName: result.displayName,
                email: result.email,
                emailVerified: result.emailVerified,
                photoURL: result.photoURL,
                phoneNumber: result.phoneNumber
            });
            return callback({...result, id: result.uid, ...(await ref.get()).data()});
        }
        callback(result);
    });
  };

  updateUser = async ({email, phoneNumber, displayName}) => {
    const current = this.auth.currentUser;

    await current.updateEmail(email);
    // await current.updatePhoneNumber(phoneNumber);
    await current.updateProfile({displayName});

    await this.firestore.collection('users').doc(current.uid).update({
        email,
        phoneNumber,
        displayName
    });

    return current;
  };

  signOut = async () => await this.auth.signOut();

  sortText = (field, desc = false) => (a,b) => {
      if(a[field] < b[field]) return desc ? 1 : -1;
      if(a[field] > b[field]) return desc ? -1 : 1;
      return 0;
  };
  sortNumbers = (field, desc = false) => (a,b) => !desc ? a[field] - b[field] : b[field] - a[field];

  getData = (data) => ({id: data.id, ...data.data()})

  getTeams = async () => {
      const data = await this.firestore.collection('teams').where('members', 'array-contains', this.auth.currentUser.uid).get();
      return data.docs.map(this.getData).sort(this.sortText('name'));
  }

  getTeam = async (teamID) => {

      const data = await this.firestore.collection('teams').doc(teamID).get();
      const team = this.getData(data);
      team.captains = (await this.firestore.collection('users').where(app.firestore.FieldPath.documentId(), 'in', team.captains).get()).docs.map(this.getData).sort(this.sortText('name'));
      team.members = (await this.firestore.collection('users').where(app.firestore.FieldPath.documentId(), 'in', team.members).get()).docs.map(this.getData).sort(this.sortText('name'));
      team.sessions = (await this.firestore.collection('sessions').where('team', '==', teamID).get()).docs.map(this.getData).sort(this.sortNumbers('start'));

      return team;
  }

  getFutureSessions = async () => {
      const teams = (await this.firestore.collection('teams').where('members', 'array-contains', this.auth.currentUser.uid).get()).docs.map(e => e.id);
      const data = await this.firestore.collection('sessions').where('team', 'in', teams).get();
      return data.docs.map(this.getData).filter(e => e.start.toDate() > DateTime.local().startOf('day').toJSDate()).slice(0,5);
  }

  updateTeam = async (teamID, team) => {
      if((await this.firestore.collection('teams').doc(teamID).get()).data().captains.includes(this.auth.currentUser.uid) || (await this.firestore.collection('users').doc(this.auth.currentUser.uid).get()).data().admin){
        await this.firestore.collection('teams').doc(teamID).update(team);
        return await this.getTeam(teamID);
      } else{
          throw new Error("Not authorized");
      }
  }

  getUserList = async () => {
      return (await this.firestore.collection('users').get()).docs.map(this.getData).map(e => ({displayName: e.displayName, id: e.id}));
  }

  createSession = async (session) => {
    if((await this.firestore.collection('teams').doc(session.team).get()).data().captains.includes(this.auth.currentUser.uid) || (await this.firestore.collection('users').doc(this.auth.currentUser.uid).get()).data().admin){
        await this.firestore.collection('sessions').add({...session, attending: []});
        return await this.getTeam(session.team);
    } else {
        throw new Error('Not authorized');
    }
  }

  updateSession = async (sessionID, session) => {
    if((await this.firestore.collection('teams').doc(session.team).get()).data().captains.includes(this.auth.currentUser.uid) || (await this.firestore.collection('users').doc(this.auth.currentUser.uid).get()).data().admin){
        await this.firestore.collection('sessions').doc(sessionID).update(session);
        return await this.getTeam(session.team);
    } else {
        throw new Error('Not authorized');
    }
  }

  setAttending = async (sessionID, status) => {
      if((await this.firestore.collection('teams').doc((await this.firestore.collection('sessions').doc(sessionID).get()).data().team).get()).data().members.includes(this.auth.currentUser.uid)){
        await this.firestore.collection('sessions').doc(sessionID).update({
            attending: status ? app.firestore.FieldValue.arrayUnion(this.auth.currentUser.uid) : app.firestore.FieldValue.arrayRemove(this.auth.currentUser.uid)
        })
      } else{
          throw new Error('Not a member of this team');
      }
  }

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

function UserProvider({ children }){
    const [user, setUser] = useState();
    const firebase = useContext(FirebaseContext);

    useEffect(() => {
        firebase.onAuthStateChanged(setUser);
    }, []);
    
    return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

function TeamProvider({ children }){
    const [{loading, error, data}, setVariables] = useState({ loading: false, error: null, data: [] });
    const firebase = useContext(FirebaseContext);
    const user = useContext(UserContext);
    
    useEffect(() => {
        const getData = async () => {
            try{
                setVariables(e => ({...e, loading: true }));
                const data = await firebase.getTeams();
                setVariables(({loading: false, error: null, data}));
            } catch(e){
                setVariables({loading: false, error: e, data: []});
            }
        }
        getData();
    }, [user]);

    return <TeamContext.Provider value={{loading, error, data}}>{children}</TeamContext.Provider>
}


function SessionProvider({ children }){
    const [{loading, error, data}, setVariables] = useState({ loading: false, error: null, data: [] });
    const firebase = useContext(FirebaseContext);
    const user = useContext(UserContext);
    
    useEffect(() => {
        const getData = async () => {
            try{
                setVariables(e => ({...e, loading: true }));
                const data = await firebase.getFutureSessions();
                setVariables(({loading: false, error: null, data}));
            } catch(e){
                setVariables({loading: false, error: e, data: []});
            }
        }
        getData();
    }, [user]);

    return <SessionContext.Provider value={{loading, error, data, setData: e => setVariables(f => ({...f, data: e}))}}>{children}</SessionContext.Provider>
}

export function Providers({children}){
    return <FirebaseProvider>
        <UserProvider>
        <TeamProvider>
        <SessionProvider>
            {children}
        </SessionProvider>
        </TeamProvider>
        </UserProvider>
    </FirebaseProvider>
}

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useUser() {
  return useContext(UserContext);
}

export function useTeams(){
    return useContext(TeamContext);
}

export function useSessions(){
    return useContext(SessionContext);
}
