import { useState, useEffect } from 'react';
import './Settings.css';

function Settings() {
    const [emails, setEmails] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        try {
            const response = await fetch('/api/user/emails', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                setEmails(data.emails || []);
            }
        } catch {
            setError('Failed to load emails');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmail = async (e) => {
        e.preventDefault();
        if (!newEmail.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/user/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: newEmail })
            });

            const data = await response.json();
            if (response.ok) {
                setEmails([...emails, data.email]);
                setNewEmail('');
                setSuccess('Email added successfully');
            } else {
                setError(data.error || 'Failed to add email');
            }
        } catch {
            setError('Failed to add email');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEmail = async (id) => {
        try {
            const response = await fetch(`/api/user/emails/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setEmails(emails.filter(e => e.id !== id));
                setSuccess('Email removed');
            }
        } catch {
            setError('Failed to delete email');
        }
    };

    const handleSetPrimary = async (id) => {
        try {
            const response = await fetch(`/api/user/emails/${id}/primary`, {
                method: 'PUT',
                credentials: 'include'
            });

            if (response.ok) {
                setEmails(emails.map(e => ({
                    ...e,
                    is_primary: e.id === id
                })));
                setSuccess('Primary email updated');
            }
        } catch {
            setError('Failed to set primary email');
        }
    };

    if (loading) {
        return (
            <div className="settings-page">
                <div className="settings-container">
                    <div className="loading-container">
                        <div className="spinner" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-container">
                <h1 className="page-title">Settings</h1>

                {/* Email Management Section */}
                <section className="settings-section">
                    <h2 className="section-title">📧 Application Emails</h2>
                    <p className="section-description">
                        Manage emails you use for job applications. Select from these when adding applications.
                    </p>

                    {error && <div className="error-banner">{error}</div>}
                    {success && <div className="success-banner">{success}</div>}

                    {/* Add Email Form */}
                    <form onSubmit={handleAddEmail} className="add-email-form">
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Enter email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Adding...' : 'Add Email'}
                        </button>
                    </form>

                    {/* Email List */}
                    <div className="emails-list">
                        {emails.length === 0 ? (
                            <div className="empty-state">
                                <p>No emails added yet. Add an email to select it when creating applications.</p>
                            </div>
                        ) : (
                            emails.map(email => (
                                <div key={email.id} className={`email-item ${email.is_primary ? 'is-primary' : ''}`}>
                                    <div className="email-info">
                                        <span className="email-address">{email.email}</span>
                                        {email.is_primary && <span className="primary-badge">Primary</span>}
                                    </div>
                                    <div className="email-actions">
                                        {!email.is_primary && (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleSetPrimary(email.id)}
                                            >
                                                Set Primary
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-ghost btn-danger btn-sm"
                                            onClick={() => handleDeleteEmail(email.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Settings;
