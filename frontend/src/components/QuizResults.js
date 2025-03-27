import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchQuizDetails();
    fetchAttempts();
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/quizzes/${quizId}/teacher`, {
        headers: { authorization: token }
      });
      setQuiz(res.data.quiz);
      setQuestions(res.data.questions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quiz details:', err);
      setError('Failed to load quiz details. Please try again.');
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/quizzes/${quizId}/attempts`, {
        headers: { authorization: token }
      });
      setAttempts(res.data.attempts);
    } catch (err) {
      console.error('Error fetching attempts:', err);
      setError('Failed to load quiz attempts.');
    }
  };

  const handleAttemptSelect = (attempt) => {
    setSelectedAttempt(attempt);
    if (attempt.answers) {
      setAnswers(JSON.parse(attempt.answers));
    }
  };

  const getAnswerClass = (questionId, option) => {
    if (!selectedAttempt) return '';
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return '';
    
    const userAnswer = answers[questionId];
    const isCorrect = question.correct_answer === option;
    
    if (userAnswer === option) {
      return isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
    } else if (isCorrect) {
      return 'bg-green-50 border-green-300';
    }
    
    return '';
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center py-12">Loading quiz results...</div>
    </div>
  );

  if (error) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        <FiArrowLeft className="mr-2" /> Back
      </button>
    </div>
  );

  if (!quiz) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center py-12">Quiz not found</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Course
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h1 className="text-2xl font-bold mb-2">{quiz.title} - Results</h1>
        <p className="text-gray-600">{quiz.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attempts List */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Student Attempts</h2>
          
          {attempts.length === 0 ? (
            <p className="text-gray-500">No attempts yet</p>
          ) : (
            <div className="space-y-3">
              {attempts.map(attempt => (
                <div 
                  key={attempt.id}
                  className={`p-3 border rounded-lg cursor-pointer ${selectedAttempt?.id === attempt.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => handleAttemptSelect(attempt)}
                >
                  <div className="flex items-center">
                    <FiUser className="text-gray-500 mr-2" />
                    <div>
                      <p className="font-medium">{attempt.student_name}</p>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500">{new Date(attempt.submitted_at).toLocaleString()}</span>
                        <span className="mx-2">•</span>
                        <span className="font-semibold">
                          Score: {attempt.score}/{attempt.total_questions}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Attempt Results */}
        <div className="md:col-span-2">
          {selectedAttempt ? (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {selectedAttempt.student_name}'s Answers
                </h2>
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  Score: {selectedAttempt.score}/{selectedAttempt.total_questions}
                </div>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <p className="font-semibold mb-3">
                      {index + 1}. {question.question}
                    </p>
                    <div className="space-y-2">
                      {['A', 'B', 'C', 'D'].map(option => (
                        <div 
                          key={option}
                          className={`flex items-center p-2 border rounded-lg ${getAnswerClass(question.id, option)}`}
                        >
                          <div className="w-6 h-6 flex items-center justify-center border rounded-full mr-2">
                            {answers[question.id] === option && '•'}
                          </div>
                          <span className="flex-1">{question[`option_${option.toLowerCase()}`]}</span>
                          
                          {answers[question.id] === option && (
                            option === question.correct_answer ? 
                              <FiCheckCircle className="text-green-500 ml-2" /> : 
                              <FiXCircle className="text-red-500 ml-2" />
                          )}
                          
                          {option === question.correct_answer && answers[question.id] !== option && (
                            <FiCheckCircle className="text-green-500 ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-center h-full">
              <p className="text-gray-500">Select a student attempt to view their answers</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResults; 