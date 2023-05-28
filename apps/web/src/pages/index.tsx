import { io } from "socket.io-client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { DarkMode } from "../components/DarkMode";
import { Copy, Eye, ArrowsClockwise } from "@phosphor-icons/react";
import { generateRandomString } from "../utils/shared";

interface Users {
  id: string;
  nickname: string;
  value: number;
  spectate: boolean;
}

let socket = io(process.env.NEXT_PUBLIC_WS, {
  secure: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelayMax: 5000,
});

export default function Home() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [room, setRoom] = useState<string | string[]>();
  const [users, setUsers] = useState<Users[]>([]);
  const [nameRoom, setNameRoom] = useState<string>("Scrum Poker");
  const [nickname, setNickname] = useState<string>();
  const [persistNickname, setPersistNickname] = useState<string>();
  const [spectateMode, setSpectateMode] = useState(false);
  const [actualVote, setActualVote] = useState(0);

  const { query, push, asPath } = useRouter();

  useEffect(() => {
    try {
      socket.on("connect", () => {
        console.log("Conectado!");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Desconectado!");
        setIsConnected(false);
      });

      socket.on("voteReceived", (arg) => {
        if (arg.nameRoom) setNameRoom(arg.nameRoom);
        if (arg.reset) setActualVote(0);
        setUsers(arg.users);
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
        nameRoom,
        room: query.room,
        nickname: nickname,
        value: 0,
        spectate: false,
      });
    }
  }, [query, nickname, nameRoom]);

  const handleSpectate = useCallback(() => {
    setPersistNickname(nickname);
    setSpectateMode(true);
    if (query?.room && query.room.length > 0) {
      setRoom(query.room);
      socket.emit("join", {
        nameRoom,
        room: query.room,
        nickname: nickname,
        value: 0,
        spectate: true,
      });
    }
  }, [query, nickname, nameRoom]);

  const handleNewRoom = useCallback(() => {
    push(`/?room=${generateRandomString()}`);
  }, [push]);

  const handleVote = useCallback(
    (value: number) => {
      setActualVote(value);
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
    <>
      <main className="relative w-full flex flex-col h-screen bg-zinc-100 dark:bg-indigo-900">
        <Head>
          <title>
            {nameRoom !== "Scrum Poker" && nameRoom.length > 0
              ? `${nameRoom} - Scrum Poker`
              : "Scrum Poker"}
          </title>
        </Head>
        <DarkMode />
        <h1
          className={`self-center font-bold text-blue-500 dark:text-white mt-10 text-6xl`}
        >
          {nameRoom !== "Scrum Poker" && nameRoom.length > 0
            ? nameRoom
            : "Scrum Poker"}
        </h1>
        {!persistNickname ? (
          <div className="text-blue-500 dark:text-white flex-col text-xl flex space-y-4 mt-10 items-center">
            {query.room && (
              <>
                <div className="flex items-center space-x-1">
                  <p>Código da sala: {query.room}</p>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${process.env.NEXT_PUBLIC_URL + asPath}`
                      )
                    }
                    className="bg-blue-500 dark:bg-indigo-500 text-white text-lg rounded-md h-10 p-2 hover:opacity-80 transition-all"
                  >
                    <Copy />
                  </button>
                </div>
                <input
                  onChange={(e) => setNameRoom(e.target.value)}
                  type="text"
                  value={nameRoom}
                  className="rounded-md text-lg bg-blue-500 dark:bg-indigo-500 text-white placeholder:text-zinc-300 w-56 h-10 p-2 text-center"
                />
                <input
                  onChange={(e) => setNickname(e.target.value)}
                  type="text"
                  placeholder="John Doe"
                  className="rounded-md text-lg bg-blue-500 dark:bg-indigo-500 text-white placeholder:text-zinc-300 w-56 h-10 p-2 text-center"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleJoin}
                    disabled={!nickname || !nameRoom}
                    className="bg-blue-500 dark:bg-indigo-500 text-white text-lg w-44 rounded-md h-10 p-2 cursor-pointer hover:opacity-80 transition-all"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={handleSpectate}
                    disabled={!nickname}
                    className="bg-blue-500 dark:bg-indigo-500 text-white text-lg rounded-md h-10 p-2 cursor-pointer hover:opacity-80 transition-all"
                  >
                    <Eye />
                  </button>
                </div>
              </>
            )}
            {query.room && <p className="text-lg">ou</p>}
            <button
              onClick={handleNewRoom}
              className="bg-blue-500 dark:bg-indigo-500 text-white text-lg w-52 rounded-md h-10 p-2 hover:opacity-80 transition-all"
            >
              Criar uma nova sala
            </button>
          </div>
        ) : (
          <div className="flex flex-col justify-around h-full">
            <div className="flex space-x-4 items-center justify-center mt-10">
              {users
                .filter((x) => x.spectate === false)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-around flex-col bg-blue-500 dark:bg-indigo-600 text-center border p-2 border-white rounded-md h-36 w-28"
                  >
                    <p className="text-5xl font-bold text-white">
                      {item.value === 0
                        ? "?"
                        : item.value !== 1000
                        ? item.value
                        : "OK"}
                    </p>
                    <p className="text-lg font-semibold text-white truncate">
                      {item.nickname}
                    </p>
                  </div>
                ))}
              {users.filter((x) => x.spectate === false).length === 0 && (
                <p className="text-blue-600 dark:text-white text-lg">
                  Ops... Ninguém aqui!
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-center mb-10">
                {users
                  .filter((x) => x.spectate === true)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-blue-600 dark:bg-indigo-600 flex items-center justify-center space-x-2 border text-white border-white rounded-md p-2"
                    >
                      <Eye size={18} />
                      <p>{item.nickname}</p>
                    </div>
                  ))}
              </div>
              {spectateMode && (
                <div className="flex justify-center space-x-2 text-center">
                  <button
                    className="bg-blue-600 dark:bg-indigo-600 flex items-center justify-center space-x-2 border w-32 text-white border-white rounded-md p-2"
                    onClick={handleReveal}
                  >
                    <Eye size={18} />
                    <p>Revelar</p>
                  </button>
                  <button
                    className="bg-blue-600 dark:bg-indigo-600 flex items-center justify-center space-x-2 border w-32 text-white border-white rounded-md p-2"
                    onClick={handleReset}
                  >
                    <ArrowsClockwise size={18} />

                    <p>Reiniciar</p>
                  </button>
                </div>
              )}
              {!spectateMode && (
                <div className="space-x-4 flex items-center justify-center">
                  {[1, 2, 3, 5, 8, 13].map((item) => (
                    <button
                      key={item}
                      onClick={() => handleVote(item)}
                      className={`bg-blue-600 dark:bg-indigo-600 text-5xl font-bold text-white cursor-pointer 
                  border dark:border-white rounded-md h-28 w-20 transition-all 
                  ${
                    item === actualVote ? "bg-blue-500 dark:bg-indigo-500" : ""
                  } hover:bg-blue-500 dark:hover:bg-indigo-500`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* <Modal
        title="O Scrum Poker atualizou!"
        id="oi"
        isOpen
        closeButton="Fechar"
        onClose={() => setRead}
      >
        <h1>Oi</h1>
      </Modal> */}
    </>
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
