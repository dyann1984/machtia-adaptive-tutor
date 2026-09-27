"use client";

import React, { useState } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { Bot, Send, Sparkles } from "lucide-react";

export function StudentTutorChat() {
  const { selectedStudentId, students } = useTutor();
  const student = students.find((s) => s.id === selectedStudentId) || students[0];

  const [messages, setMessages] = useState<
    { sender: "student" | "tutor"; text: string; time: string }[]
  >([
    {
      sender: "tutor",
      text: `¡Hola ${student.name.split(" ")[0]}! 🤖 Soy tu Tutor IA de Matemáticas. Si tienes dudas sobre fracciones, simplificación o cómo resolver tus tareas, ¡pregúntame lo que quieras!`,
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden max-w-3xl mx-auto">
      <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">MACHTIA Tutor IA (Modo Alumno)</h2>
            <p className="text-[11px] text-blue-200">Asistente pedagógico interactivo 24/7</p>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
          ACTIVO
        </span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isTutor = m.sender === "tutor";
          return (
            <div
              key={idx}
              className={`flex gap-3 ${isTutor ? "items-start" : "items-end justify-end"}`}
            >
              {isTutor && (
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isTutor
                    ? "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm"
                    : "bg-blue-600 text-white rounded-br-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe tu duda sobre fracciones (ej. ¿Por qué 1/2 es igual a 2/4?)..."
          className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <span>Preguntar</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
