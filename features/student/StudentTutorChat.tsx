"use client";

import React, { useState } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { TutorRobotAvatar } from "@/components/TutorRobotAvatar";
import { Bot, Send, Sparkles, User } from "lucide-react";

export function StudentTutorChat() {
  const { selectedStudentId, students } = useTutor();
  const student = students.find((s) => s.id === selectedStudentId) || students[0];

  const [messages, setMessages] = useState<
    { sender: "student" | "tutor"; text: string; time: string }[]
  >([
    {
      sender: "tutor",
      text: `¡Hola ${student.name.split(" ")[0]}! 🤖 Soy tu Tutor IA de Matemáticas. Si tienes dudas sobre fracciones, denominadores o simplificación, ¡pregúntame lo que quieras!`,
      time: "Ahora",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const query = inputText;
    setInputText("");

    const newMsgs = [
      ...messages,
      { sender: "student" as const, text: query, time: "Ahora" },
    ];
    setMessages(newMsgs);

    setTimeout(() => {
      let reply = `¡Gran pregunta, ${student.name.split(" ")[0]}! Recuerda siempre que dos fracciones son equivalentes si multiplicas o divides tanto el numerador como el denominador por el mismo número.`;

      if (query.toLowerCase().includes("1/2")) {
        reply = `¡Exacto! 1/2 es equivalente a 2/4, 3/6, 4/8 y 5/10. ¡Todas cubren la mitad exacta del entero! 🍫`;
      } else if (query.toLowerCase().includes("denominador")) {
        reply = `El denominador te dice en cuántas partes iguales se divide el entero. ¡Entre más partes dividas una pizza, más pequeñas serán las rebanadas! Por eso 1/4 es más pequeño que 1/2.`;
      }

      setMessages((prev) => [
        ...prev,
        { sender: "tutor", text: reply, time: "Ahora" },
      ]);
    }, 600);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-[600px] overflow-hidden max-w-4xl mx-auto py-2">
      {/* Header limpio */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <TutorRobotAvatar size="sm" showGlow />
          <div>
            <h2 className="text-base font-bold text-slate-900">MACHTIA Tutor IA</h2>
            <p className="text-xs text-slate-500">Sesión de acompañamiento individual • {student.name}</p>
          </div>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
          En línea
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isTutor = m.sender === "tutor";
          return (
            <div
              key={idx}
              className={`flex gap-3 ${isTutor ? "items-start" : "items-end justify-end"}`}
            >
              {isTutor && <TutorRobotAvatar size="xs" />}
              <div
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  isTutor
                    ? "bg-slate-50 border border-slate-200/80 text-slate-800"
                    : "bg-blue-600 text-white font-medium"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe tu duda sobre fracciones (ej. ¿Por qué 1/2 es igual a 2/4?)..."
          className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0"
        >
          <span>Preguntar</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
