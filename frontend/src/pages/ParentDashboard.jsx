import React, { useEffect, useState } from "react";
import api from "../services/api";

const ParentDashboard = () => {
  const [child, setChild] = useState(null);
  const [results, setResults] = useState([]);
  const [reportCards, setReportCards] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [childRes, resultsRes, cardsRes] = await Promise.all([
          api.get("/parent/child-info/"),
          api.get("/parent/"),
          api.get("/parent/report-cards/"),
        ]);
        setChild(childRes.data);
        setResults(resultsRes.data);
        setReportCards(cardsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  if (!child) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Parent Dashboard</h1>
      <div className="mt-4 p-4 border rounded">
        <h2 className="text-xl">
          Child: {child.full_name} ({child.student_id})
        </h2>
        <p>
          Class: {child.class} | Department: {child.department}
        </p>
      </div>

      <h2 className="text-xl mt-6">Results</h2>
      <table className="min-w-full border mt-2">
        <thead>
          <tr>
            <th>Course</th>
            <th>Quiz/Exam</th>
            <th>Score</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.course?.title}</td>
              <td>{r.quiz?.title || "Exam"}</td>
              <td>
                {r.score} / {r.total_marks}
              </td>
              <td>{r.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl mt-6">Report Cards</h2>
      {reportCards.map((card) => (
        <div key={card.id} className="border p-4 mt-2">
          <p>
            Term: {card.term} | Year: {card.academic_year}
          </p>
          <button
            onClick={() => window.open(`/api/report-cards/${card.id}/pdf/`)}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Download PDF
          </button>
        </div>
      ))}
    </div>
  );
};

export default ParentDashboard;
