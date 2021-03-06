import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import moment from 'moment';

import firebase from './firebase';

import './App.css';

const db = firebase.firestore();

const Rooms: React.FunctionComponent<any> = ({rooms, setRooms, selectedRoom, setSelectedRoom}) => {
  const renderedRooms = rooms.map((room: any) => {
    const handleRoomClick = () => {
      setSelectedRoom(room);
    };

    return (
        <div key={room.id}>
          <button
              className={room === selectedRoom ? 'selected-room' : undefined}
              onClick={handleRoomClick}
          >
            {room.id}
          </button>
        </div>
    );
  });

  return (
    <div id="rooms">
      <h3>대화방</h3>
      <div>
        {renderedRooms}
      </div>
    </div>
  );
};

const codeOf = (char: string) => {
  return char.charCodeAt(0);
};

const isCharInRange = (char: string, rangeStart: string, rangeEnd: string) => {
  const code = codeOf(char);
  return codeOf(rangeStart) <= code && code <= codeOf(rangeEnd);
};

const validateUserId = (userId: string) => {
  if (!userId) {
    throw '유저 Id가 없습니다.';
  }

  if (userId.length > 16) {
    throw '유저 Id가 너무 깁니다. 16자 이하로 해주세요.';
  }

  const validateChar = (char: string) => {
    return isCharInRange(char, '0', '9')
        || isCharInRange(char, 'A', 'Z')
        || isCharInRange(char, 'a', 'z')
        || isCharInRange(char, '\uAC00', '\uD7AF')
        || isCharInRange(char, '\u1100', '\u11FF')
        || isCharInRange(char, '\uA960', '\uA97C')
        || isCharInRange(char, '\uD7B0', '\uD7C6')
        || isCharInRange(char, '\uD7CB', '\uD7FB')
        || isCharInRange(char, '\u3131', '\u3163')
        || isCharInRange(char, '\u3165', '\u318E')
        || isCharInRange(char, '\u3041', '\u309f') // Hiragana
        || isCharInRange(char, '\u30a0', '\u30ff') // Katakana
        || isCharInRange(char, '\u4e00', '\u9fff') // CJK Unified Ideographs
        || isCharInRange(char, '\u3400', '\u4dbf') // CJK Unified Ideographs Extension A
        || char === '.' || char === '-' || char === '_';
  }

  const validateContent = (userId: string) => {
    for (const char of userId) {
      if (!validateChar(char)) {
        return false;
      }
    }
    return true;
  };

  if (!validateContent(userId)) {
    throw '유저 Id에 허용되지 않는 문자가 포함되어 있습니다.';
  }

  if (userId.toLowerCase().includes('gaejotbab') || userId.includes('개좆밥')) {
    throw '사용이 불가능한 유저 Id입니다.';
  }
};

const Messages: React.FunctionComponent<any> = ({selectedRoom}) => {
  const [events, setEvents] = useState<any[]>([]);

  const [userId, setUserId] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');

  const newEventsRef = useRef<any[]>([]);
  const counterRef = useRef(0);
  const [counter, setCounter] = useState(0);

  const eventsElementRef = useRef<HTMLDivElement>(null);
  const messageTextInputElementRef = useRef<HTMLInputElement>(null);
  const sendMessageButtonElementRef = useRef<HTMLButtonElement>(null);

  const eventsPath = `rooms/${selectedRoom.id}/events`;

  const [showCreatedAt, setShowCreatedAt] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId === null) {
        return;
      }
      setUserId(storedUserId);
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const unsubscribe = db.collection(eventsPath)
        .orderBy('createdAt')
        .limitToLast(50)
        .onSnapshot(querySnapshot => {
      querySnapshot.docChanges().forEach((change) => {
        if ((change.type === 'added' && change.doc.data().createdAt) || change.type === 'modified') {
          // XXX
          const event = {...change.doc.data(), id: change.doc.id};
          newEventsRef.current.push(event);
          ++counterRef.current;
          setCounter(counterRef.current);
        }
      });
    });

    const unsubscribeAndClearEvents = () => {
      unsubscribe();
      setEvents([]);
    };

    return unsubscribeAndClearEvents;
  }, [selectedRoom, eventsPath]);

  useEffect(() => {
    if (newEventsRef.current.length === 0) {
      return;
    }
    setEvents([...events, ...newEventsRef.current]);
    newEventsRef.current = [];
  }, [counter, events]);

  const renderedEvents = events.map(event => {
    let renderedCreatedAt = null;

    if (showCreatedAt) {
      const createdAt = moment(event.createdAt.toDate())
          .format('YYYY-MM-DD HH:mm:ss');
      renderedCreatedAt = <span>[{createdAt}]</span>;
    }

    let rendered;
    switch (event.type) {
      case 'userEntered':
        rendered = <p key={event.id}>{renderedCreatedAt} <strong>{event.userId}</strong> 님이 입장하셨습니다.</p>;
        break;
      case 'message':
        rendered = <p key={event.id}>{renderedCreatedAt} <strong>{event.userId}</strong>: {event.messageText}</p>;
        break;
      default:
        break;
    }
    return rendered;
  });

  const sendingMessage = useRef(false);

  const sendMessage = () => {
    if (sendingMessage.current) {
      return;
    }

    sendingMessage.current = true;

    try {
      validateUserId(userId);
    } catch (e) {
      alert(e);
      sendingMessage.current = false;
      return;
    }

    if (!messageText) {
      sendingMessage.current = false;
      return;
    }

    if (!messageText.trim()) {
      sendingMessage.current = false;
      return;
    }

    if (messageText.length > 1024) {
      window.alert('메시지가 너무 깁니다.');
      sendingMessage.current = false;
      return;
    }

    let event;
    try {
      event = {
        userId: userId,
        type: 'message',
        messageType: 'text',
        messageText: messageText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
    } catch (e) {
      sendingMessage.current = false;
      return;
    }

    db.collection(eventsPath).doc().set(event).then(value => {
      messageTextInputElementRef.current?.focus();
      setMessageText('');
      sendingMessage.current = false;
    }).catch(reason => {
      sendingMessage.current = false;
    });
  };

  const handleMessageTextEnter = (event: any) => {
    if (event.key === 'Enter') {
      sendMessageButtonElementRef.current?.click();
    }
  };

  const [tailing, setTailing] = useState(true);

  useLayoutEffect(() => {
    const eventsDiv = eventsElementRef.current;
    if (eventsDiv == null) {
      return;
    }

    if (tailing) {
      eventsDiv.scrollTop = eventsDiv.scrollHeight - eventsDiv.clientHeight;
    }
  });

  const handleScrollEvents = (event: React.UIEvent) => {
    const eventsDiv = eventsElementRef.current;
    if (eventsDiv == null) {
      return;
    }

    setTailing(eventsDiv.scrollHeight - eventsDiv.clientHeight - 5 <= eventsDiv.scrollTop);
  };

  const handleShowCreatedAtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target == null) {
      return;
    }
    setShowCreatedAt(event.target.checked);
  };

  const handleUserIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const userId = event.target.value;
    setUserId(userId);
    try {
      localStorage.setItem('userId', userId);
    } catch (e) {
      // Ignore
    }
  };

  let validUserId = false;
  try {
    validateUserId(userId);
    validUserId = true;
  } catch (e) {
    // Ignore
  }

  return (
      <div id="messages">
        <div id="messages-header">
          <h3>대화 ({selectedRoom.id})</h3>
          <div id="messages-control-panel">
            <label>
              <input
                  type="checkbox"
                  name="showCreatedAt"
                  checked={showCreatedAt}
                  onChange={handleShowCreatedAtChange}
                  style={{verticalAlign: 'baseline'}}
              />
              시간 보기
            </label>
          </div>
        </div>
        <div id="events" ref={eventsElementRef} onScroll={handleScrollEvents}>
          {renderedEvents}
        </div>
        <div className="send-window">
          <input
              id="user-id"
              className={!userId || validUserId ? undefined : 'user-id-invalid'}
              type="text"
              name="userId"
              value={userId}
              onChange={handleUserIdChange}
              placeholder="유저 Id"
              maxLength={16}
              autoComplete="off"
          />
          <input
              ref={messageTextInputElementRef}
              id="message-text"
              className="message-text"
              type="text"
              name="messageText"
              value={messageText}
              onChange={event => {setMessageText(event.target.value)}}
              onKeyUp={handleMessageTextEnter}
              placeholder="메시지"
              maxLength={1024}
              autoComplete="off"
          />
          <button
              ref={sendMessageButtonElementRef}
              id="send-message-button"
              onClick={sendMessage}
          >
            보내기
          </button>
        </div>
      </div>
  );
};

const MessagesPanel: React.FunctionComponent<any> = ({selectedRoom}) => {
  if (selectedRoom) {
    return (
        <Messages selectedRoom={selectedRoom} />
    );
  } else {
    return (
        <div id="messages-with-no-selected-room">
          <div>방을 선택하세요.</div>
        </div>
    );
  }
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
        <h2>개톡</h2>
      </div>
      <Rooms
          rooms={rooms}
          setRooms={setRooms}
          selectedRoom={selectedRoom}
          setSelectedRoom={setSelectedRoom}
      />
      <MessagesPanel selectedRoom={selectedRoom} />
    </div>
  );
}

export default App;
