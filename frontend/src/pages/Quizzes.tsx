import React, { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  duration?: number;
}
interface Question {
  id: number;
  text: string;
  choices: string[];
  correct_index?: number;
  order?: number;
}

const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selected, setSelected] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [result, setResult] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // seconds

  useEffect(() => {
    api.get("/quizzes/").then((res) => setQuizzes(res.data));
  }, []);

  const take = (quiz: Quiz) => {
    setSelected(quiz);
    setAnswers({});
    setResult(null);
    setStartTime(Date.now());
    if (quiz.duration) {
      setTimeLeft(quiz.duration * 60);
    } else {
      setTimeLeft(null);
    }
  };

  const handleAnswer = (qid: number, idx: number) => {
    setAnswers((a) => ({ ...a, [qid]: idx }));
  };

  const submit = async () => {
    if (!selected) return;
    const payload = {
      quiz: selected.id,
      student: 0, // backend should ignore or set from request
      answers,
    };
    const resp = await api.post(`/quiz-submissions/`, payload);
    setResult(resp.data.score);
  };

  // countdown timer effect
  useEffect(() => {
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      // time up, auto submit
      submit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => (t != null ? t - 1 : t));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (selected)
    return (
      <Layout showBackButton>
        <div className="p-6">
          <h2 className="text-2xl font-bold">{selected.title}</h2>
          {timeLeft != null && (
            <p className="text-red-600 font-bold">
              Time left: {Math.floor(timeLeft / 60)}:
              {("0" + (timeLeft % 60)).slice(-2)}
            </p>
          )}
          {selected.questions.map((q) => (
            <div key={q.id} className="mt-4">
              <p className="font-semibold">{q.text}</p>
              {q.choices.map((c, i) => (
                <label key={i} className="block">
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    onChange={() => handleAnswer(q.id, i)}
                    disabled={result !== null}
                  />{" "}
                  {c}
                </label>
              ))}
            </div>
          ))}
          {result === null ? (
            <button
              onClick={submit}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Submit
            </button>
          ) : (
            <>
              <p className="mt-4">Score: {result}</p>
              {/* review section */}
              <div className="mt-6">
                <h3 className="font-semibold">Review</h3>
                {selected.questions.map((q) => {
                  const selectedIdx = answers[q.id];
                  const correctIdx = q.correct_index;
                  return (
                    <div key={q.id} className="mt-2 p-2 border rounded">
                      <p className="font-semibold">{q.text}</p>
                      <p>
                        Your answer: {q.choices[selectedIdx] || "—"}{" "}
                        {selectedIdx === correctIdx ? "✅" : "❌"}
                      </p>
                      {!(selectedIdx === correctIdx) && (
                        <p>Correct answer: {q.choices[correctIdx ?? 0]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Layout>
    );

  return (
    <Layout showBackButton>
      <div className="p-6">
        <h2 className="text-2xl font-bold">Available Quizzes</h2>
        <ul className="mt-4 space-y-2">
          {quizzes.map((q) => (
            <li key={q.id}>
              <button
                onClick={() => take(q)}
                className="text-blue-600 underline"
              >
                {q.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default Quizzes;
