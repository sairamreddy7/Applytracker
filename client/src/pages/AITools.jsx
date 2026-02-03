import { useState } from 'react';
import './AITools.css';

function AITools() {
    const [activeTab, setActiveTab] = useState('cover-letter');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Cover Letter State
    const [coverLetterForm, setCoverLetterForm] = useState({
        jobTitle: '',
        companyName: '',
        jobDescription: '',
        resumeText: '',
        tone: 'professional'
    });
    const [coverLetter, setCoverLetter] = useState('');

    // Resume Match State
    const [matchForm, setMatchForm] = useState({
        jobDescription: '',
        resumeText: ''
    });
    const [matchResult, setMatchResult] = useState(null);

    // Interview Questions State
    const [interviewForm, setInterviewForm] = useState({
        jobTitle: '',
        companyName: '',
        jobDescription: '',
        experienceLevel: 'Mid-Level'
    });
    const [questions, setQuestions] = useState(null);

    const handleCoverLetter = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setCoverLetter('');

        try {
            const response = await fetch('/api/ai/cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(coverLetterForm)
            });

            const data = await response.json();
            if (response.ok) {
                setCoverLetter(data.coverLetter);
            } else {
                setError(data.error || 'Failed to generate cover letter');
            }
        } catch {
            setError('Failed to generate cover letter');
        } finally {
            setLoading(false);
        }
    };

    const handleMatchResume = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMatchResult(null);

        try {
            const response = await fetch('/api/ai/match-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(matchForm)
            });

            const data = await response.json();
            if (response.ok) {
                setMatchResult(data);
            } else {
                setError(data.error || 'Failed to analyze match');
            }
        } catch {
            setError('Failed to analyze match');
        } finally {
            setLoading(false);
        }
    };

    const handleInterviewQuestions = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setQuestions(null);

        try {
            const response = await fetch('/api/ai/interview-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(interviewForm)
            });

            const data = await response.json();
            if (response.ok) {
                setQuestions(data);
            } else {
                setError(data.error || 'Failed to generate questions');
            }
        } catch {
            setError('Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="ai-tools-page">
            <div className="ai-tools-container">
                <h1 className="page-title">✨ AI Tools</h1>
                <p className="page-subtitle">Powered by Google Gemini</p>

                {/* Tabs */}
                <div className="ai-tabs">
                    <button
                        className={`ai-tab ${activeTab === 'cover-letter' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cover-letter')}
                    >
                        📝 Cover Letter
                    </button>
                    <button
                        className={`ai-tab ${activeTab === 'match' ? 'active' : ''}`}
                        onClick={() => setActiveTab('match')}
                    >
                        🎯 Resume Match
                    </button>
                    <button
                        className={`ai-tab ${activeTab === 'interview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('interview')}
                    >
                        💬 Interview Prep
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {/* Cover Letter Tab */}
                {activeTab === 'cover-letter' && (
                    <div className="ai-panel">
                        <h2>Cover Letter Generator</h2>
                        <p className="panel-description">Generate a personalized cover letter for your job application.</p>

                        <form onSubmit={handleCoverLetter} className="ai-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Job Title *</label>
                                    <input
                                        type="text"
                                        value={coverLetterForm.jobTitle}
                                        onChange={(e) => setCoverLetterForm({ ...coverLetterForm, jobTitle: e.target.value })}
                                        placeholder="Software Engineer"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Company Name *</label>
                                    <input
                                        type="text"
                                        value={coverLetterForm.companyName}
                                        onChange={(e) => setCoverLetterForm({ ...coverLetterForm, companyName: e.target.value })}
                                        placeholder="Google"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Job Description</label>
                                <textarea
                                    value={coverLetterForm.jobDescription}
                                    onChange={(e) => setCoverLetterForm({ ...coverLetterForm, jobDescription: e.target.value })}
                                    placeholder="Paste the job description here..."
                                    rows={4}
                                />
                            </div>
                            <div className="form-group">
                                <label>Your Resume/Background</label>
                                <textarea
                                    value={coverLetterForm.resumeText}
                                    onChange={(e) => setCoverLetterForm({ ...coverLetterForm, resumeText: e.target.value })}
                                    placeholder="Paste your resume text or describe your experience..."
                                    rows={4}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tone</label>
                                <select
                                    value={coverLetterForm.tone}
                                    onChange={(e) => setCoverLetterForm({ ...coverLetterForm, tone: e.target.value })}
                                >
                                    <option value="professional">Professional</option>
                                    <option value="enthusiastic">Enthusiastic</option>
                                    <option value="conversational">Conversational</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? '✨ Generating...' : '✨ Generate Cover Letter'}
                            </button>
                        </form>

                        {coverLetter && (
                            <div className="ai-result">
                                <div className="result-header">
                                    <h3>Your Cover Letter</h3>
                                    <button className="btn btn-ghost" onClick={() => copyToClipboard(coverLetter)}>
                                        📋 Copy
                                    </button>
                                </div>
                                <div className="result-content">
                                    {coverLetter.split('\n').map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Resume Match Tab */}
                {activeTab === 'match' && (
                    <div className="ai-panel">
                        <h2>Resume-Job Match Analysis</h2>
                        <p className="panel-description">See how well your resume matches a job description.</p>

                        <form onSubmit={handleMatchResume} className="ai-form">
                            <div className="form-group">
                                <label>Job Description *</label>
                                <textarea
                                    value={matchForm.jobDescription}
                                    onChange={(e) => setMatchForm({ ...matchForm, jobDescription: e.target.value })}
                                    placeholder="Paste the job description here..."
                                    rows={5}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Your Resume *</label>
                                <textarea
                                    value={matchForm.resumeText}
                                    onChange={(e) => setMatchForm({ ...matchForm, resumeText: e.target.value })}
                                    placeholder="Paste your resume text here..."
                                    rows={5}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? '🎯 Analyzing...' : '🎯 Analyze Match'}
                            </button>
                        </form>

                        {matchResult && (
                            <div className="ai-result">
                                <div className="match-score-container">
                                    <div className="match-score" style={{
                                        '--score-color': matchResult.matchScore >= 70 ? '#22c55e' :
                                            matchResult.matchScore >= 50 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        <span className="score-number">{matchResult.matchScore}%</span>
                                        <span className="score-label">Match Score</span>
                                    </div>
                                </div>

                                {matchResult.summary && (
                                    <p className="match-summary">{matchResult.summary}</p>
                                )}

                                <div className="match-details">
                                    {matchResult.matchingSkills?.length > 0 && (
                                        <div className="match-section">
                                            <h4>✅ Matching Skills</h4>
                                            <div className="skill-tags">
                                                {matchResult.matchingSkills.map((skill, i) => (
                                                    <span key={i} className="skill-tag match">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {matchResult.missingSkills?.length > 0 && (
                                        <div className="match-section">
                                            <h4>⚠️ Missing Skills</h4>
                                            <div className="skill-tags">
                                                {matchResult.missingSkills.map((skill, i) => (
                                                    <span key={i} className="skill-tag missing">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {matchResult.recommendations?.length > 0 && (
                                        <div className="match-section">
                                            <h4>💡 Recommendations</h4>
                                            <ul className="recommendations-list">
                                                {matchResult.recommendations.map((rec, i) => (
                                                    <li key={i}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Interview Prep Tab */}
                {activeTab === 'interview' && (
                    <div className="ai-panel">
                        <h2>Interview Question Generator</h2>
                        <p className="panel-description">Prepare for your interview with AI-generated questions.</p>

                        <form onSubmit={handleInterviewQuestions} className="ai-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Job Title *</label>
                                    <input
                                        type="text"
                                        value={interviewForm.jobTitle}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, jobTitle: e.target.value })}
                                        placeholder="Software Engineer"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        value={interviewForm.companyName}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, companyName: e.target.value })}
                                        placeholder="Google"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Experience Level</label>
                                <select
                                    value={interviewForm.experienceLevel}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, experienceLevel: e.target.value })}
                                >
                                    <option value="Entry Level">Entry Level</option>
                                    <option value="Mid-Level">Mid-Level</option>
                                    <option value="Senior">Senior</option>
                                    <option value="Lead/Manager">Lead/Manager</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Job Description</label>
                                <textarea
                                    value={interviewForm.jobDescription}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, jobDescription: e.target.value })}
                                    placeholder="Paste the job description for more relevant questions..."
                                    rows={4}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? '💬 Generating...' : '💬 Generate Questions'}
                            </button>
                        </form>

                        {questions && (
                            <div className="ai-result">
                                <div className="questions-container">
                                    {questions.technical?.length > 0 && (
                                        <div className="questions-section">
                                            <h3>🔧 Technical Questions</h3>
                                            {questions.technical.map((q, i) => (
                                                <div key={i} className="question-card">
                                                    <p className="question">{q.question}</p>
                                                    <p className="tip">💡 <em>{q.tip}</em></p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {questions.behavioral?.length > 0 && (
                                        <div className="questions-section">
                                            <h3>🧠 Behavioral Questions</h3>
                                            {questions.behavioral.map((q, i) => (
                                                <div key={i} className="question-card">
                                                    <p className="question">{q.question}</p>
                                                    <p className="tip">💡 <em>{q.tip}</em></p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {questions.askInterviewer?.length > 0 && (
                                        <div className="questions-section">
                                            <h3>❓ Questions to Ask</h3>
                                            {questions.askInterviewer.map((q, i) => (
                                                <div key={i} className="question-card">
                                                    <p className="question">{q.question}</p>
                                                    <p className="tip">💡 <em>{q.tip}</em></p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AITools;
