import React, {useEffect, useState} from 'react';
import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/firestore';

import './App.css';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC17JfGlIYgic4alZQwJQ3w0d0DWEYNscY",
  authDomain: "gaetalk-dc0e6.firebaseapp.com",
  projectId: "gaetalk-dc0e6",
  storageBucket: "gaetalk-dc0e6.appspot.com",
  messagingSenderId: "578915040528",
  appId: "1:578915040528:web:f918b42994b3d624a7f995",
  measurementId: "G-51M0NSBK9H"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const db = firebase.firestore();

const Rooms: React.FunctionComponent<any> = ({rooms, setRooms, selectedRoom, setSelectedRoom}) => {
  const renderedRooms = rooms.map((room: any) => {
    const handleRoomClick = () => {
      setSelectedRoom(room);
    };

    return (
        <button
            key={room.id}
            className={room === selectedRoom ? 'selected-room' : undefined}
            onClick={handleRoomClick}
        >
          {room.id}
        </button>
    );
  });

  return (
    <div id="rooms">
      <h2>Rooms</h2>
      <div>
        {renderedRooms}
      </div>
    </div>
  );
};

const Messages: React.FunctionComponent<any> = ({selectedRoom}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');

  const eventsPath = selectedRoom ? `rooms/${selectedRoom.id}/events` : '';

  useEffect(() => {
    if (!selectedRoom) {
      return;
    }

    db.collection(eventsPath).orderBy('createdAt').get().then(querySnapshot => {
      const events: any[] = [];
      querySnapshot.forEach(doc => {
        // XXX
        const event = {...doc.data()};
        events.push(event);
      });
      setEvents(events);
    });
  }, [selectedRoom]);

  const renderedEvents = events.map(event => {
    let rendered;
    switch (event.type) {
      case 'userEnter':
        rendered = <p key={event.id}><strong>{event.userId}</strong> has entered the room.</p>;
        break;
      case 'message':
        rendered = <p key={event.id}><strong>{event.userId}</strong>: {event.messageText}</p>;
        break;
      default:
        break;
    }
    return rendered;
  });

  const sendMessage = () => {
    if (!userId) {
      window.alert('No userId.');
      return;
    }

    if (!messageText) {
      window.alert('No messageText.');
      return;
    }

    const event = {
      userId: userId,
      type: 'message',
      messageType: 'text',
      messageText: messageText,
      createdAt: new Date(),
    };
    db.collection(eventsPath).doc().set(event);
  };

  return (
      <div id="messages">
        {selectedRoom ? <h2>Messages ({selectedRoom.id})</h2> : <h2>Messages</h2>}
        <div id="events">
          {renderedEvents}
        </div>
        <div className="send-window">
          <input
              className="user-id"
              type="text"
              name="userId"
              value={userId}
              onChange={event => {setUserId(event.target.value)}}
          />
          <input
              className="message-text"
              type="text"
              name="messageText"
              value={messageText}
              onChange={event => {setMessageText(event.target.value)}}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
  );
};

function App() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  useEffect(() => {
    db.collection('rooms').get().then(querySnapshot => {
      const rooms: any[] = [];
      querySnapshot.forEach(doc => {
        const room = {
          id: doc.id,
        };
        rooms.push(room);
      });
      setRooms(rooms);
    });
  }, []);

  return (
    <div id="app">
      <div id="header">
        <h1>Gaetalk!</h1>
      </div>
      <Rooms
          rooms={rooms}
          setRooms={setRooms}
          selectedRoom={selectedRoom}
          setSelectedRoom={setSelectedRoom}
      />
      <Messages
          selectedRoom={selectedRoom}
      />
    </div>
  );
}

export default App;
