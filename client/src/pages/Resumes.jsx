import { useState, useEffect, useRef } from 'react';
import './Resumes.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

function Resumes() {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchResumes();
    }, []);

    // Auto-clear messages after 5 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 8000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchResumes = async () => {
        try {
            const response = await fetch('/api/resumes', { credentials: 'include' });
            const data = await response.json();

            if (response.ok) {
                setResumes(data.resumes || []);
            } else {
                setError(data.error || 'Failed to load resumes');
            }
        } catch {
            setError('Unable to connect to server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const validateFile = (file) => {
        if (!file) return 'No file selected';

        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Invalid file type. Please upload a PDF, DOC, or DOCX file.';
        }

        if (file.size > MAX_FILE_SIZE) {
            return `File too large. Maximum size is 5MB. Your file is ${formatFileSize(file.size)}.`;
        }

        return null;
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setError('');
        setSuccess('');
        setUploading(true);
        setUploadProgress(10);

        const formData = new FormData();
        formData.append('resume', file);

        try {
            // Simulate progress (real progress would need XMLHttpRequest)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 15, 90));
            }, 200);

            const response = await fetch('/api/resumes/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            const data = await response.json();

            if (response.ok) {
                setResumes(prev => [data.resume, ...prev]);
                setSuccess(`"${file.name}" uploaded successfully!`);
            } else {
                setError(data.error || 'Upload failed. Please try again.');
            }
        } catch {
            setError('Upload failed. Please check your connection and try again.');
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/resumes/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setResumes(prev => prev.filter(r => r.id !== id));
                setDeleteId(null);
                setSuccess('Resume deleted successfully');
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete resume');
            }
        } catch {
            setError('Failed to delete resume. Please try again.');
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '—';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType) => {
        const isPdf = mimeType?.includes('pdf');
        return (
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`file-icon ${isPdf ? 'pdf' : 'doc'}`}
                aria-hidden="true"
            >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="resumes-page" aria-busy="true">
                <div className="resumes-container">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">My Resumes</h1>
                            <p className="page-subtitle">Loading your documents...</p>
                        </div>
                    </div>
                    <div className="resumes-list">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="resume-card skeleton" style={{ height: '80px' }} aria-hidden="true" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="resumes-page">
            <div className="resumes-container">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">My Resumes</h1>
                        <p className="page-subtitle">Manage your resume documents</p>
                    </div>
                    <label
                        className={`btn btn-primary ${uploading ? 'uploading' : ''}`}
                        aria-label="Upload a new resume file"
                    >
                        {uploading ? (
                            <>
                                <div className="spinner" aria-hidden="true" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
                                </svg>
                                <span>Upload Resume</span>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleUpload}
                            className="file-input"
                            disabled={uploading}
                            aria-label="Choose file to upload"
                        />
                    </label>
                </div>

                {/* Upload Progress */}
                {uploading && (
                    <div className="upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <span className="progress-text">{uploadProgress}%</span>
                    </div>
                )}

                {/* Messages */}
                {error && (
                    <div className="error-banner" role="alert">
                        <span>{error}</span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setError('')}
                            aria-label="Dismiss error"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {success && (
                    <div className="success-banner" role="status">
                        <span>{success}</span>
                    </div>
                )}

                {/* File Type Info */}
                <div className="upload-info" role="note">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                    </svg>
                    <span>Accepted formats: PDF, DOC, DOCX (max 5MB)</span>
                </div>

                {/* Resumes List */}
                {resumes.length === 0 ? (
                    <div className="empty-state" role="region" aria-label="No resumes">
                        <div className="empty-icon" aria-hidden="true">📄</div>
                        <h3>No resumes uploaded</h3>
                        <p>Upload your first resume to attach it to job applications</p>
                    </div>
                ) : (
                    <div className="resumes-list" role="list" aria-label="Your resumes">
                        {resumes.map(resume => (
                            <article key={resume.id} className="resume-card" role="listitem">
                                <div className="resume-icon">
                                    {getFileIcon(resume.mime_type)}
                                </div>
                                <div className="resume-details">
                                    <h3 className="resume-name">{resume.original_name}</h3>
                                    <div className="resume-meta">
                                        <span>{formatFileSize(resume.file_size)}</span>
                                        <span aria-hidden="true">•</span>
                                        <span>Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="resume-actions" role="group" aria-label={`Actions for ${resume.original_name}`}>
                                    <a
                                        href={`/api/resumes/${resume.id}/download`}
                                        className="btn btn-ghost"
                                        download
                                        aria-label={`Download ${resume.original_name}`}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                                        </svg>
                                    </a>
                                    <button
                                        className="btn btn-ghost btn-danger"
                                        onClick={() => setDeleteId(resume.id)}
                                        aria-label={`Delete ${resume.original_name}`}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Delete Confirmation */}
                                {deleteId === resume.id && (
                                    <div className="delete-overlay" role="alertdialog" aria-labelledby={`delete-title-${resume.id}`}>
                                        <p id={`delete-title-${resume.id}`}>Delete this resume?</p>
                                        <div className="delete-actions">
                                            <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>
                                                Cancel
                                            </button>
                                            <button className="btn btn-danger" onClick={() => handleDelete(resume.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Resumes;
