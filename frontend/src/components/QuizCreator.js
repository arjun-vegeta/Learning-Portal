import React, { useState } from 'react';
import axios from 'axios';

const QuizCreator = ({ courseId, onQuizCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: ''
      }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to create a quiz');
        return;
      }

      const res = await axios.post(
        `http://localhost:5001/api/courses/${courseId}/quizzes`,
        {
          title,
          description,
          questions
        },
        {
          headers: { 
            authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );
      onQuizCreated(res.data.quizId);
      // Reset form
      setTitle('');
      setDescription('');
      setQuestions([]);
    } catch (err) {
      console.error('Error creating quiz:', err);
      if (err.response?.status === 403) {
        setError('Your session has expired. Please log in again.');
        // Optionally redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.error || 'Failed to create quiz. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Create New Quiz</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Questions</h3>

          {questions.map((q, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Question {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map(option => (
                    <div key={option}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option {option}
                      </label>
                      <input
                        type="text"
                        value={q[`option${option}`]}
                        onChange={(e) => updateQuestion(index, `option${option}`, e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <select
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select correct answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={addQuestion}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200"
          >
            Add Question
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={questions.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizCreator; 