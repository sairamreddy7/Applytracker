import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ApplicationForm.css';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'];
const SOURCES = ['LinkedIn', 'Indeed', 'Company Website', 'Referral', 'Job Board', 'Recruiter', 'Other'];

function ApplicationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        company_name: '',
        job_title: '',
        job_description: '',
        job_requirements: '',
        location: '',
        job_url: '',
        salary_min: '',
        salary_max: '',
        application_date: new Date().toISOString().split('T')[0],
        application_source: '',
        status: 'Applied',
        notes: '',
        follow_up_date: '',
        interview_round: 0,
        interview_notes: '',
        resume_ids: []
    });

    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchResumes();
        if (isEditing) {
            fetchApplication();
        }
    }, [id]);

    const fetchResumes = async () => {
        try {
            const response = await fetch('/api/resumes', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                setResumes(data.resumes);
            }
        } catch (err) {
            console.error('Failed to fetch resumes:', err);
        }
    };

    const fetchApplication = async () => {
        try {
            const response = await fetch(`/api/applications/${id}`, { credentials: 'include' });
            const data = await response.json();

            if (response.ok) {
                const app = data.application;
                setFormData({
                    company_name: app.company_name || '',
                    job_title: app.job_title || '',
                    job_description: app.job_description || '',
                    job_requirements: app.job_requirements || '',
                    location: app.location || '',
                    job_url: app.job_url || '',
                    salary_min: app.salary_min || '',
                    salary_max: app.salary_max || '',
                    application_date: app.application_date ? app.application_date.split('T')[0] : '',
                    application_source: app.application_source || '',
                    status: app.status || 'Applied',
                    notes: app.notes || '',
                    follow_up_date: app.follow_up_date ? app.follow_up_date.split('T')[0] : '',
                    interview_round: app.interview_round || 0,
                    interview_notes: app.interview_notes || '',
                    resume_ids: app.resumes ? app.resumes.map(r => r.id) : []
                });
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to load application');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleResumeToggle = (resumeId) => {
        setFormData(prev => ({
            ...prev,
            resume_ids: prev.resume_ids.includes(resumeId)
                ? prev.resume_ids.filter(id => id !== resumeId)
                : [...prev.resume_ids, resumeId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const payload = {
                ...formData,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
                interview_round: formData.interview_round ? parseInt(formData.interview_round) : 0
            };

            const response = await fetch(
                isEditing ? `/api/applications/${id}` : '/api/applications',
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            if (response.ok) {
                navigate('/applications');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to save application');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="form-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="form-page">
            <div className="form-container">
                <div className="form-header">
                    <Link to="/applications" className="back-link">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
                        </svg>
                        Back to Applications
                    </Link>
                    <h1 className="form-title">
                        {isEditing ? 'Edit Application' : 'New Application'}
                    </h1>
                </div>

                {error && (
                    <div className="error-banner">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="application-form">
                    {/* Company & Position */}
                    <div className="form-section">
                        <h2 className="section-title">Job Information</h2>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="company_name" className="form-label">Company Name *</label>
                                <input
                                    id="company_name"
                                    name="company_name"
                                    type="text"
                                    className="form-input"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Google"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="job_title" className="form-label">Job Title *</label>
                                <input
                                    id="job_title"
                                    name="job_title"
                                    type="text"
                                    className="form-input"
                                    value={formData.job_title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="location" className="form-label">Location</label>
                                <input
                                    id="location"
                                    name="location"
                                    type="text"
                                    className="form-input"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. San Francisco, CA"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="job_url" className="form-label">Job URL</label>
                                <input
                                    id="job_url"
                                    name="job_url"
                                    type="url"
                                    className="form-input"
                                    value={formData.job_url}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="job_description" className="form-label">Job Description</label>
                            <textarea
                                id="job_description"
                                name="job_description"
                                className="form-input form-textarea"
                                value={formData.job_description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Paste the job description here..."
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="job_requirements" className="form-label">Job Requirements</label>
                            <textarea
                                id="job_requirements"
                                name="job_requirements"
                                className="form-input form-textarea"
                                value={formData.job_requirements}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Key requirements and qualifications..."
                            />
                        </div>
                    </div>

                    {/* Application Details */}
                    <div className="form-section">
                        <h2 className="section-title">Application Details</h2>
                        <div className="form-row form-row-4">
                            <div className="form-group">
                                <label htmlFor="status" className="form-label">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    className="form-input"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    {STATUSES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="application_source" className="form-label">Source</label>
                                <select
                                    id="application_source"
                                    name="application_source"
                                    className="form-input"
                                    value={formData.application_source}
                                    onChange={handleChange}
                                >
                                    <option value="">Select source</option>
                                    {SOURCES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="application_date" className="form-label">Applied Date</label>
                                <input
                                    id="application_date"
                                    name="application_date"
                                    type="date"
                                    className="form-input"
                                    value={formData.application_date}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="follow_up_date" className="form-label">Follow-up Date</label>
                                <input
                                    id="follow_up_date"
                                    name="follow_up_date"
                                    type="date"
                                    className="form-input"
                                    value={formData.follow_up_date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="salary_min" className="form-label">Salary Min ($)</label>
                                <input
                                    id="salary_min"
                                    name="salary_min"
                                    type="number"
                                    className="form-input"
                                    value={formData.salary_min}
                                    onChange={handleChange}
                                    placeholder="80000"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="salary_max" className="form-label">Salary Max ($)</label>
                                <input
                                    id="salary_max"
                                    name="salary_max"
                                    type="number"
                                    className="form-input"
                                    value={formData.salary_max}
                                    onChange={handleChange}
                                    placeholder="120000"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes" className="form-label">Notes</label>
                            <textarea
                                id="notes"
                                name="notes"
                                className="form-input form-textarea"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Any additional notes..."
                            />
                        </div>
                    </div>

                    {/* Interview Tracking */}
                    {formData.status === 'Interview' && (
                        <div className="form-section">
                            <h2 className="section-title">Interview Tracking</h2>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="interview_round" className="form-label">Interview Round</label>
                                    <select
                                        id="interview_round"
                                        name="interview_round"
                                        className="form-input"
                                        value={formData.interview_round}
                                        onChange={handleChange}
                                    >
                                        <option value={0}>Not started</option>
                                        <option value={1}>Round 1 - Phone Screen</option>
                                        <option value={2}>Round 2 - Technical</option>
                                        <option value={3}>Round 3 - Onsite</option>
                                        <option value={4}>Round 4 - Final</option>
                                        <option value={5}>Round 5+</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="interview_notes" className="form-label">Interview Notes</label>
                                <textarea
                                    id="interview_notes"
                                    name="interview_notes"
                                    className="form-input form-textarea"
                                    value={formData.interview_notes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Notes from interviews, feedback, next steps..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Resume Selection */}
                    <div className="form-section">
                        <h2 className="section-title">Linked Resumes</h2>
                        {resumes.length === 0 ? (
                            <div className="no-resumes">
                                <p>No resumes uploaded yet.</p>
                                <Link to="/resumes" className="btn btn-secondary">Upload Resume</Link>
                            </div>
                        ) : (
                            <div className="resume-selector">
                                {resumes.map(resume => (
                                    <label key={resume.id} className="resume-option">
                                        <input
                                            type="checkbox"
                                            checked={formData.resume_ids.includes(resume.id)}
                                            onChange={() => handleResumeToggle(resume.id)}
                                        />
                                        <div className="resume-info">
                                            <span className="resume-name">{resume.original_name}</span>
                                            <span className="resume-date">
                                                {new Date(resume.uploaded_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        <Link to="/applications" className="btn btn-secondary">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? (
                                <>
                                    <div className="spinner"></div>
                                    Saving...
                                </>
                            ) : (
                                isEditing ? 'Save Changes' : 'Create Application'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ApplicationForm;
