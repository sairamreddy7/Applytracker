import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ApplicationForm.css';

const STATUSES = ['Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Ghosted'];
const SOURCES = ['LinkedIn', 'Indeed', 'Jobright', 'Company Website', 'Referral', 'Job Board', 'Recruiter', 'Other'];

// CS/Tech job roles for dropdown
const JOB_ROLES = [
    'Software Engineer',
    'Software Developer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Data Analyst',
    'Data Engineer',
    'Machine Learning Engineer',
    'AI Engineer',
    'DevOps Engineer',
    'Site Reliability Engineer',
    'Cloud Engineer',
    'Mobile Developer',
    'iOS Developer',
    'Android Developer',
    'QA Engineer',
    'Security Engineer',
    'Product Manager',
    'Engineering Manager',
    'Technical Program Manager',
    'UX Designer',
    'UI Developer',
    'Intern - Software Engineer',
    'Intern - Data Science',
    'Intern - Product',
    'New Grad - Software Engineer',
    'New Grad - Data Science',
    'Other'
];

// Experience levels
const EXPERIENCE_LEVELS = [
    'Internship',
    'Entry Level / New Grad',
    'Mid Level (2-4 years)',
    'Senior (5+ years)',
    'Lead / Staff',
    'Manager / Director'
];

// Top US tech cities
const US_CITIES = [
    'Remote',
    'Hybrid',
    'San Francisco, CA',
    'San Jose, CA',
    'Mountain View, CA',
    'Palo Alto, CA',
    'Sunnyvale, CA',
    'Seattle, WA',
    'Bellevue, WA',
    'Redmond, WA',
    'New York, NY',
    'Austin, TX',
    'Dallas, TX',
    'Houston, TX',
    'Boston, MA',
    'Cambridge, MA',
    'Los Angeles, CA',
    'San Diego, CA',
    'Chicago, IL',
    'Denver, CO',
    'Boulder, CO',
    'Atlanta, GA',
    'Raleigh, NC',
    'Charlotte, NC',
    'Phoenix, AZ',
    'Portland, OR',
    'Salt Lake City, UT',
    'Washington, DC',
    'Miami, FL',
    'Philadelphia, PA',
    'Minneapolis, MN'
];

function ApplicationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const locationInputRef = useRef(null);

    const [formData, setFormData] = useState({
        company_name: '',
        job_title: '',
        experience_level: 'Entry Level / New Grad',
        application_email: '',
        job_description: '',
        job_requirements: '',
        location: '',
        job_url: '',
        salary: '',
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
    const [userEmails, setUserEmails] = useState([]);
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    // Location autocomplete
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

    // Custom job title
    const [customJobTitle, setCustomJobTitle] = useState('');
    const [isCustomRole, setIsCustomRole] = useState(false);

    useEffect(() => {
        fetchResumes();
        fetchUserEmails();
        if (isEditing) {
            fetchApplication();
        }
    }, [id]);

    const fetchResumes = async () => {
        try {
            const response = await fetch('/api/resumes', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                setResumes(data.resumes || []);
            }
        } catch {
            // Silent fail
        }
    };

    const fetchUserEmails = async () => {
        try {
            const response = await fetch('/api/user/emails', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                setUserEmails(data.emails || []);
            }
        } catch {
            // Silent fail - emails are optional
        }
    };

    const fetchApplication = async () => {
        try {
            const response = await fetch(`/api/applications/${id}`, { credentials: 'include' });
            const data = await response.json();

            if (response.ok) {
                const app = data.application;
                const jobTitle = app.job_title || '';
                const isCustom = !JOB_ROLES.includes(jobTitle);

                setFormData({
                    company_name: app.company_name || '',
                    job_title: isCustom ? 'Other' : jobTitle,
                    experience_level: app.experience_level || 'Entry Level / New Grad',
                    application_email: app.application_email || '',
                    job_description: app.job_description || '',
                    job_requirements: app.job_requirements || '',
                    location: app.location || '',
                    job_url: app.job_url || '',
                    salary: app.salary || '',
                    application_date: app.application_date ? app.application_date.split('T')[0] : '',
                    application_source: app.application_source || '',
                    status: app.status || 'Applied',
                    notes: app.notes || '',
                    follow_up_date: app.follow_up_date ? app.follow_up_date.split('T')[0] : '',
                    interview_round: app.interview_round || 0,
                    interview_notes: app.interview_notes || '',
                    resume_ids: app.resumes ? app.resumes.map(r => r.id) : []
                });

                if (isCustom) {
                    setIsCustomRole(true);
                    setCustomJobTitle(jobTitle);
                }

                // Show details section if there's extra data
                if (app.job_description || app.job_requirements || app.notes) {
                    setShowDetails(true);
                }
            } else {
                setError(data.error || 'Failed to load application');
            }
        } catch {
            setError('Failed to load application');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Handle job title "Other" selection
        if (name === 'job_title') {
            if (value === 'Other') {
                setIsCustomRole(true);
            } else {
                setIsCustomRole(false);
                setCustomJobTitle('');
            }
        }
    };

    const handleLocationChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, location: value }));

        if (value.length >= 2) {
            const filtered = US_CITIES.filter(city =>
                city.toLowerCase().includes(value.toLowerCase())
            );
            setLocationSuggestions(filtered);
            setShowLocationSuggestions(filtered.length > 0);
        } else {
            setShowLocationSuggestions(false);
        }
    };

    const selectLocation = (city) => {
        setFormData(prev => ({ ...prev, location: city }));
        setShowLocationSuggestions(false);
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
            const finalJobTitle = isCustomRole ? customJobTitle : formData.job_title;

            const payload = {
                ...formData,
                job_title: finalJobTitle,
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
                setError(data.error || 'Failed to save');
            }
        } catch {
            setError('Failed to save application');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="form-page" aria-busy="true">
                <div className="loading-container">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="form-page">
            <div className="form-container">
                <div className="form-header">
                    <Link to="/applications" className="back-link" aria-label="Back to applications">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
                        </svg>
                        Back
                    </Link>
                    <h1 className="form-title">
                        {isEditing ? 'Edit Application' : 'New Application'}
                    </h1>
                </div>

                {error && (
                    <div className="error-banner" role="alert">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="application-form">
                    {/* Quick Info - Required Fields */}
                    <div className="form-section form-section-quick">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="company_name" className="form-label">Company *</label>
                                <input
                                    id="company_name"
                                    name="company_name"
                                    type="text"
                                    className="form-input"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Google, Meta, Amazon..."
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="job_title" className="form-label">Role *</label>
                                <select
                                    id="job_title"
                                    name="job_title"
                                    className="form-input"
                                    value={formData.job_title}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select role...</option>
                                    {JOB_ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Custom role input */}
                        {isCustomRole && (
                            <div className="form-group">
                                <label htmlFor="custom_job_title" className="form-label">Custom Role Title *</label>
                                <input
                                    id="custom_job_title"
                                    type="text"
                                    className="form-input"
                                    value={customJobTitle}
                                    onChange={(e) => setCustomJobTitle(e.target.value)}
                                    required
                                    placeholder="Enter custom job title"
                                />
                            </div>
                        )}

                        <div className="form-row form-row-3">
                            <div className="form-group form-group-location">
                                <label htmlFor="location" className="form-label">Location</label>
                                <input
                                    id="location"
                                    ref={locationInputRef}
                                    type="text"
                                    className="form-input"
                                    value={formData.location}
                                    onChange={handleLocationChange}
                                    onFocus={() => formData.location.length >= 2 && setShowLocationSuggestions(locationSuggestions.length > 0)}
                                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 150)}
                                    placeholder="Start typing..."
                                    autoComplete="off"
                                />
                                {showLocationSuggestions && (
                                    <ul className="location-suggestions" role="listbox">
                                        {locationSuggestions.slice(0, 6).map(city => (
                                            <li
                                                key={city}
                                                role="option"
                                                onClick={() => selectLocation(city)}
                                                onMouseDown={(e) => e.preventDefault()}
                                            >
                                                {city}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="form-group">
                                <label htmlFor="experience_level" className="form-label">Experience</label>
                                <select
                                    id="experience_level"
                                    name="experience_level"
                                    className="form-input"
                                    value={formData.experience_level}
                                    onChange={handleChange}
                                >
                                    {EXPERIENCE_LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
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
                        </div>

                        <div className="form-row">
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
                                <label htmlFor="application_source" className="form-label">Source</label>
                                <select
                                    id="application_source"
                                    name="application_source"
                                    className="form-input"
                                    value={formData.application_source}
                                    onChange={handleChange}
                                >
                                    <option value="">Select...</option>
                                    {SOURCES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Email Used for Application */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="application_email" className="form-label">Email Used</label>
                                {userEmails.length > 0 ? (
                                    <select
                                        id="application_email"
                                        name="application_email"
                                        className="form-input"
                                        value={formData.application_email}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select email...</option>
                                        {userEmails.map(e => (
                                            <option key={e.id} value={e.email}>{e.email}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        id="application_email"
                                        name="application_email"
                                        type="email"
                                        className="form-input"
                                        value={formData.application_email}
                                        onChange={handleChange}
                                        placeholder="your.email@example.com"
                                    />
                                )}
                                <span className="form-hint">
                                    {userEmails.length === 0 && "Add emails in Settings to select from dropdown"}
                                </span>
                            </div>
                            <div className="form-group">
                                <label htmlFor="salary" className="form-label">Salary Range</label>
                                <input
                                    id="salary"
                                    name="salary"
                                    type="text"
                                    className="form-input"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    placeholder="e.g. $120k-$150k"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resume Selection - Prominent */}
                    {resumes.length > 0 && (
                        <div className="form-section">
                            <h2 className="section-title">Resume Used</h2>
                            <div className="resume-selector">
                                {resumes.map(resume => (
                                    <label key={resume.id} className={`resume-option ${formData.resume_ids.includes(resume.id) ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.resume_ids.includes(resume.id)}
                                            onChange={() => handleResumeToggle(resume.id)}
                                        />
                                        <span className="resume-name">{resume.original_name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Interview Tracking */}
                    {formData.status === 'Interview' && (
                        <div className="form-section">
                            <h2 className="section-title">Interview Progress</h2>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="interview_round" className="form-label">Round</label>
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
                                <div className="form-group">
                                    <label htmlFor="follow_up_date" className="form-label">Next Interview Date</label>
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
                            <div className="form-group">
                                <label htmlFor="interview_notes" className="form-label">Interview Notes</label>
                                <textarea
                                    id="interview_notes"
                                    name="interview_notes"
                                    className="form-input form-textarea"
                                    value={formData.interview_notes}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Interviewer names, topics covered, next steps..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Optional Details - Collapsible */}
                    <div className="form-section">
                        <button
                            type="button"
                            className="section-toggle"
                            onClick={() => setShowDetails(!showDetails)}
                            aria-expanded={showDetails}
                        >
                            <span>{showDetails ? '−' : '+'}</span>
                            More Details (optional)
                        </button>

                        {showDetails && (
                            <div className="section-content">
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

                                <div className="form-group">
                                    <label htmlFor="job_description" className="form-label">Job Description</label>
                                    <textarea
                                        id="job_description"
                                        name="job_description"
                                        className="form-input form-textarea"
                                        value={formData.job_description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Paste job description..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="notes" className="form-label">Notes</label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        className="form-input form-textarea"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="Your notes..."
                                    />
                                </div>

                                {formData.status !== 'Interview' && (
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
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        <Link to="/applications" className="btn btn-secondary">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? (
                                <>
                                    <div className="spinner" aria-hidden="true" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                isEditing ? 'Save Changes' : 'Add Application'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ApplicationForm;
