import { io } from "socket.io-client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { IoIosCopy } from "react-icons/io";
import { BiShow } from "react-icons/bi";
import { FiRefreshCw } from "react-icons/fi";

interface Users {
  id: string;
  room: string;
  nickname: string;
  value: number;
  spectate: boolean;
}

let socket = io("scrum.villacity.fun", {
  reconnection: false,
  reconnectionAttempts: 2,
  reconnectionDelayMax: 5000,
});

export default function Home() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [room, setRoom] = useState<string | string[]>();
  const [users, setUsers] = useState<Users[]>([]);
  const [nickname, setNickname] = useState<string>();
  const [persistNickname, setPersistNickname] = useState<string>();
  const [spectateMode, setSpectateMode] = useState(false);

  const { query, push, asPath } = useRouter();

  useEffect(() => {
    try {
      if (!isConnected) {
        fetch("/api/main");
      }

      socket.on("connect", () => {
        console.log("Conectado");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Desconectado");
        setIsConnected(false);
      });

      // socket.on('pong', () => {
      //   setLastPong(new Date().toISOString());
      // });

      socket.on("voteReceived", (arg) => {
        setUsers(arg);
      });

      socket.on("connect_failed", function () {
        console.log("Connection Failed");
      });

      socket.on("connect_error", (err) => {
        console.log(err.message);
      });

      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("voteReceived");
        socket.off("connect_error");
        socket.off("connect_failed");
      };
    } catch (error) {
      console.log(error);
    }
  }, [isConnected, query]);

  const handleJoin = useCallback(() => {
    setPersistNickname(nickname);
    if (query?.room && query.room.length > 0) {
      setRoom(query.room);
      socket.emit("join", {
        room: query.room,
        nickname: nickname,
        value: 0,
        spectate: false,
      });
    }
  }, [query, nickname]);

  const handleSpectate = useCallback(() => {
    setPersistNickname(nickname);
    setSpectateMode(true);
    if (query?.room && query.room.length > 0) {
      setRoom(query.room);
      socket.emit("join", {
        room: query.room,
        nickname: nickname,
        value: 0,
        spectate: true,
      });
    }
  }, [query, nickname]);

  const handleNewRoom = useCallback(() => {
    const numberRoom = Math.floor(Math.random() * 100000 + 1);
    push(`/?room=${numberRoom}`);
  }, [push]);

  const handleVote = useCallback(
    (value: number) => {
      socket.emit("vote", {
        room: room,
        nickname: nickname,
        value: value,
        spectate: spectateMode,
      });
    },
    [nickname, room, spectateMode]
  );

  const handleReveal = useCallback(() => {
    socket.emit("reveal");
  }, []);

  const handleReset = useCallback(() => {
    socket.emit("reset");
  }, []);

  return (
    <main className="w-full flex flex-col h-screen bg-indigo-900">
      <h1 className="self-center font-bold text-white mt-10 text-6xl">
        Estimativa G02
      </h1>
      {!persistNickname ? (
        <div className="text-white flex-col text-xl flex space-y-4 mt-10 items-center">
          {query.room && (
            <>
              <div className="flex items-center space-x-1">
                <p>
                  Digite seu nome abaixo para entrar na sala N° {query.room}
                </p>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `scrum-poker.vercel.app${asPath}`
                    )
                  }
                  className="bg-indigo-500 text-lg rounded-md h-10 p-2 hover:opacity-80 transition-all"
                >
                  <IoIosCopy />
                </button>
              </div>
              <input
                onChange={(e) => setNickname(e.target.value)}
                type="text"
                placeholder="John Doe"
                className="rounded-md text-lg bg-indigo-500 w-56 h-10 p-2 text-center"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleJoin}
                  disabled={!nickname}
                  className="bg-indigo-500 text-lg w-44 rounded-md h-10 p-2 cursor-pointer hover:opacity-80 transition-all"
                >
                  Entrar
                </button>
                <button
                  onClick={handleSpectate}
                  disabled={!nickname}
                  className="bg-indigo-500 text-lg rounded-md h-10 p-2 cursor-pointer hover:opacity-80 transition-all"
                >
                  <BiShow />
                </button>
              </div>
            </>
          )}
          {query.room && <p className="text-lg">ou</p>}
          <button
            onClick={handleNewRoom}
            className="bg-indigo-500 text-lg w-52 rounded-md h-10 p-2 hover:opacity-80 transition-all"
          >
            Criar uma nova sala
          </button>
        </div>
      ) : (
        <>
          <div className="flex space-x-4 items-center justify-center h-full">
            {users
              .filter((x) => x.spectate === false)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex justify-around flex-col text-center border p-2 border-white rounded-md h-36 w-28"
                >
                  <p className="text-5xl font-bold text-white">
                    {item.value === 0
                      ? "?"
                      : item.value !== 1000
                      ? item.value
                      : "OK"}
                  </p>
                  <p className="text-xl font-bold text-white ">
                    {item.nickname}
                  </p>
                </div>
              ))}
          </div>
          {spectateMode && (
            <div className="flex mb-10 justify-center space-x-2 text-center">
              <button
                className="flex items-center justify-center space-x-2 border w-32 text-white border-white rounded-md p-2 bg-indigo-600"
                onClick={handleReveal}
              >
                <BiShow />
                <p>Revelar</p>
              </button>
              <button
                className="flex items-center justify-center space-x-2 border w-32 text-white border-white rounded-md p-2 bg-indigo-600"
                onClick={handleReset}
              >
                <FiRefreshCw />

                <p>Reinciar</p>
              </button>
            </div>
          )}
          {!spectateMode && (
            <div className=" space-x-4 flex items-center justify-center h-full">
              {[1, 2, 3, 5, 8, 13].map((item) => (
                <button
                  key={item}
                  onClick={() => handleVote(item)}
                  className="text-5xl font-bold text-white cursor-pointer border border-white rounded-md h-28 w-20 transition-all hover:bg-indigo-500"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>

    // <div className=" space-x-2 bg-blue-400">
    //   <button
    //     className="p-2 bg-blue-600"
    //     onClick={() =>
    //       socket.emit("vote", { room: room, nickname: "Kayo", value: 1 })
    //     }
    //   >
    //     1
    //   </button>
    //   <button className="p-2 bg-blue-600" onClick={() => socket.disconnect()}>
    //     Disconnect
    //   </button>
    // </div>
  );
}
