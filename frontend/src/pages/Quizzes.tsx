// frontend/src/pages/Quizzes.tsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  BookOpen,
} from "lucide-react";
import { getUserData } from "../utils/authUtils";

interface Choice {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  choices: Choice[];
  correct_index?: number;
  order?: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  duration?: number;
}

interface SubmissionResponse {
  id: number;
  score: number;
  total: number;
  answers: Record<number, number>;
  correct_answers?: Record<number, number>;
}

//  Helper functions
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const extractData = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.results) return response.results;
  return [];
};

//  Main Component
const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz taking state
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const userData = getUserData();
  const userId = userData?.id ?? 0;

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const res = await api.get("/quizzes/", { params: { page_size: 200 } });
        const data = extractData(res.data);
        setQuizzes(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  //  Timer logic
  useEffect(() => {
    if (selectedQuiz?.duration && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedQuiz, timeLeft]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && selectedQuiz && submissionResult === null) {
      handleSubmit();
    }
  }, [timeLeft]);

  //  Handlers
  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
    setCurrentQuestion(0);
    setSubmissionResult(null);
    setStartTime(Date.now());
    if (quiz.duration) {
      setTimeLeft(quiz.duration * 60);
    } else {
      setTimeLeft(null);
    }
  };

  const handleAnswer = (questionId: number, choiceIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceIndex }));
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedQuiz) return;
    setIsSubmitting(true);
    try {
      const payload = {
        quiz: selectedQuiz.id,
        student: userId || 0,
        answers,
      };
      const res = await api.post("/quiz-submissions/", payload);
      setSubmissionResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedQuiz, userId, answers]);

  const goToQuestion = (idx: number) => {
    if (idx >= 0 && idx < (selectedQuiz?.questions?.length || 0)) {
      setCurrentQuestion(idx);
    }
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setAnswers({});
    setCurrentQuestion(0);
    setSubmissionResult(null);
    setTimeLeft(null);
    setStartTime(null);
  };

  //  Render helpers

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
            Loading quizzes…
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  //  Quiz Taking View
  if (selectedQuiz) {
    const questions = selectedQuiz.questions || [];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const progress =
      totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
    const isSubmitted = submissionResult !== null;
    const currentQ = questions[currentQuestion];

    // Show results
    if (isSubmitted) {
      const {
        score,
        total,
        answers: submittedAnswers,
        correct_answers,
      } = submissionResult;

      return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            {/* Score Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
              <Award className="w-16 h-16 text-white/80 mx-auto mb-3" />
              <h2 className="text-3xl font-black text-white">Quiz Complete!</h2>
              <p className="text-4xl font-black text-white mt-2">
                {score}/{total}
              </p>
              <p className="text-white/70 text-sm mt-1">
                {((score / total) * 100).toFixed(0)}% –{" "}
                {score === total
                  ? "Perfect! 🎉"
                  : score >= total * 0.7
                    ? "Great job! 🌟"
                    : score >= total * 0.5
                      ? "Good effort! 💪"
                      : "Keep practicing! 📚"}
              </p>
              <button
                onClick={resetQuiz}
                className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Back to Quizzes
              </button>
            </div>

            {/* Review */}
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Review Answers
              </h3>
              {questions.map((q, idx) => {
                const chosen = answers[q.id];
                const correct = q.correct_index;
                const isCorrect = chosen === correct;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border ${
                      isCorrect
                        ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
                        : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        Q{idx + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {q.text}
                        </p>
                        <div className="mt-2 space-y-1">
                          {q.choices.map((choice, ci) => (
                            <div
                              key={choice.id ?? ci} // ← FIXED: fallback key
                              className={`text-sm px-3 py-1 rounded flex items-center gap-2 ${
                                ci === correct
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                  : ci === chosen && chosen !== correct
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                                    : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {ci === correct && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {ci === chosen && chosen !== correct && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              {choice.text}
                            </div>
                          ))}
                        </div>
                        {!isCorrect && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Correct answer:{" "}
                            {q.choices[correct ?? 0]?.text || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      );
    }

    // Quiz taking view
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          {/* Header with timer & progress */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedQuiz.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>
            <div className="flex items-center gap-4">
              {timeLeft !== null && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                    timeLeft < 60
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </div>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question */}
          <div className="p-6">
            <div className="flex items-start gap-2 mb-4">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                Q{currentQuestion + 1}
              </span>
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentQ?.text}
                </p>
              </div>
            </div>

            {/* Choices */}
            <div className="space-y-3">
              {currentQ?.choices.map((choice, idx) => {
                const isSelected = answers[currentQ.id] === idx;
                return (
                  <label
                    key={choice.id ?? idx} // ← FIXED: fallback key
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQ.id}`}
                      value={idx}
                      checked={isSelected}
                      onChange={() => handleAnswer(currentQ.id, idx)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {choice.text}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => goToQuestion(currentQuestion - 1)}
                disabled={currentQuestion === 0}
                className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex gap-1">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToQuestion(idx)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                      idx === currentQuestion
                        ? "bg-blue-600 text-white"
                        : answers[questions[idx].id] !== undefined
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                    aria-label={`Go to question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentQuestion < totalQuestions - 1 ? (
                <button
                  onClick={() => goToQuestion(currentQuestion + 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || answeredCount < totalQuestions}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Quiz"
                  )}
                </button>
              )}
            </div>

            {/* Warning if not all answered */}
            {answeredCount < totalQuestions && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {totalQuestions - answeredCount} question(s) left unanswered
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  //  Quiz List View
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Available Quizzes
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {quizzes.length} quizzes
        </span>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No quizzes available
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Check back later for new quizzes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {quiz.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>{quiz.questions?.length || 0} questions</span>
                    {quiz.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.duration} min
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startQuiz(quiz)}
                  className="shrink-0 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
                >
                  Start Quiz
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quizzes;
