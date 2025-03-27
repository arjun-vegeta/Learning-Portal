import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchQuizDetails();
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/quizzes/${quizId}`, {
        headers: { authorization: token }
      });
      
      setQuiz(res.data.quiz);
      setQuestions(res.data.questions);
      setAttempt(res.data.attempt);
      
      // If there's an attempt, parse the answers
      if (res.data.attempt && res.data.attempt.answers) {
        try {
          const parsedAnswers = JSON.parse(res.data.attempt.answers);
          setAnswers(parsedAnswers);
          setResult({
            score: res.data.attempt.score,
            totalQuestions: res.data.attempt.total_questions
          });
        } catch (parseError) {
          console.error('Error parsing answers:', parseError);
          setError('Failed to parse quiz answers.');
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quiz details:', err);
      setError('Failed to load quiz. Please try again.');
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5001/api/quizzes/${quizId}/submit`,
        { answers },
        { headers: { authorization: token } }
      );
      setResult(res.data);
      fetchQuizDetails(); // Refresh to get the attempt
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz. Please try again.');
    }
  };

  const getAnswerClass = (question, option) => {
    if (!attempt) return '';
    
    const userAnswer = answers[question.id];
    const isCorrect = question.correct_answer === option;
    
    if (userAnswer === option) {
      return isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
    } else if (isCorrect) {
      return 'bg-green-50 border-green-300';
    }
    
    return '';
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center py-12">Loading quiz...</div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center py-12">Quiz not found</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Course
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-gray-600 mb-6">{quiz.description}</p>

        {result && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-2">
              Your Score
            </h2>
            <p className="text-lg">
              {result.score} / {result.totalQuestions} correct answers
            </p>
          </div>
        )}

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <p className="font-semibold mb-3">
                {index + 1}. {question.question}
              </p>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map(option => {
                  const userAnswer = answers[question.id];
                  const isCorrectOption = attempt && question.correct_answer === option;
                  const userSelectedThisOption = userAnswer === option;
                  const isCorrectAnswer = userSelectedThisOption && isCorrectOption;
                  const isWrongAnswer = userSelectedThisOption && !isCorrectOption;
                  
                  return (
                    <label 
                      key={option} 
                      className={`flex items-center p-2 border rounded-lg ${
                        isCorrectAnswer ? 'bg-green-100 border-green-500' : 
                        isWrongAnswer ? 'bg-red-100 border-red-500' : 
                        isCorrectOption ? 'bg-green-50 border-green-300' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswerSelect(question.id, option)}
                        disabled={!!attempt}
                        className="mr-3"
                      />
                      <span className="flex-1">{question[`option_${option.toLowerCase()}`]}</span>
                      
                      {attempt && userSelectedThisOption && (
                        isCorrectOption ? 
                          <FiCheckCircle className="text-green-500 ml-2" /> : 
                          <FiXCircle className="text-red-500 ml-2" />
                      )}
                      
                      {attempt && isCorrectOption && !userSelectedThisOption && (
                        <FiCheckCircle className="text-green-500 ml-2" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!attempt && (
          <button
            onClick={handleSubmit}
            className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            disabled={Object.keys(answers).length !== questions.length}
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPage; 