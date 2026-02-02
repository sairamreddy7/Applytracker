import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './Applications.css';

const STATUS_COLORS = {
    Applied: 'blue',
    Interview: 'purple',
    Offer: 'green',
    Rejected: 'red',
    Ghosted: 'gray'
};

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'];
const PAGE_SIZE = 20;

function Applications() {
    const [applications, setApplications] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // Filter state
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [selectedStatuses, setSelectedStatuses] = useState(
        searchParams.get('statuses')?.split(',').filter(Boolean) || []
    );
    const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
    const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');
    const [selectedResume, setSelectedResume] = useState(searchParams.get('resume_id') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'updated_at');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination state
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

    const needsAttention = searchParams.get('needs_attention') === 'true';

    useEffect(() => {
        fetchResumes();
    }, []);

    useEffect(() => {
        fetchApplications();
        // Reset to page 1 when filters change (except page itself)
        const newPage = parseInt(searchParams.get('page') || '1', 10);
        setPage(newPage);
    }, [searchParams]);

    const fetchResumes = async () => {
        try {
            const response = await fetch('/api/resumes', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) setResumes(data.resumes || []);
        } catch {
            // Silent fail for secondary data
        }
    };

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError('');
            const params = new URLSearchParams();

            if (searchParams.get('search')) params.append('search', searchParams.get('search'));
            if (searchParams.get('statuses')) params.append('statuses', searchParams.get('statuses'));
            if (searchParams.get('date_from')) params.append('date_from', searchParams.get('date_from'));
            if (searchParams.get('date_to')) params.append('date_to', searchParams.get('date_to'));
            if (searchParams.get('resume_id')) params.append('resume_id', searchParams.get('resume_id'));
            if (searchParams.get('sort')) params.append('sort', searchParams.get('sort'));
            if (searchParams.get('needs_attention')) params.append('needs_attention', 'true');

            const url = `/api/applications?${params.toString()}`;
            const response = await fetch(url, { credentials: 'include' });
            const data = await response.json();

            if (response.ok) {
                setApplications(data.applications || []);
            } else {
                setError(data.error || 'Failed to load applications');
            }
        } catch {
            setError('Unable to connect to server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // Paginated applications
    const paginatedApps = useMemo(() => {
        const startIndex = (page - 1) * PAGE_SIZE;
        return applications.slice(startIndex, startIndex + PAGE_SIZE);
    }, [applications, page]);

    const totalPages = Math.ceil(applications.length / PAGE_SIZE);

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','));
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        if (selectedResume) params.set('resume_id', selectedResume);
        if (sortBy !== 'updated_at') params.set('sort', sortBy);
        // Reset to page 1 on filter change
        setSearchParams(params);
        setPage(1);
    };

    const goToPage = (newPage) => {
        const params = new URLSearchParams(searchParams);
        if (newPage > 1) {
            params.set('page', String(newPage));
        } else {
            params.delete('page');
        }
        setSearchParams(params);
        setPage(newPage);
        // Scroll to top of list
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedStatuses([]);
        setDateFrom('');
        setDateTo('');
        setSelectedResume('');
        setSortBy('updated_at');
        setSearchParams({});
        setPage(1);
    };

    const toggleStatus = (status) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/applications/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setApplications(prev => prev.filter(app => app.id !== id));
                setDeleteId(null);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete application');
            }
        } catch {
            setError('Failed to delete application. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const hasActiveFilters = search || selectedStatuses.length > 0 || dateFrom || dateTo || selectedResume || needsAttention;
    const overdueApps = applications.filter(app => app.is_overdue);

    if (loading) {
        return (
            <div className="applications-page" aria-busy="true">
                <div className="applications-container">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Job Applications</h1>
                            <p className="page-subtitle">Loading your applications...</p>
                        </div>
                    </div>
                    <div className="applications-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="application-card skeleton" style={{ height: '180px' }} aria-hidden="true" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="applications-page">
            <div className="applications-container">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Job Applications</h1>
                        <p className="page-subtitle">Track and manage your job applications</p>
                    </div>
                    <Link to="/applications/new" className="btn btn-primary" aria-label="Add a new job application">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                        </svg>
                        <span>Add Application</span>
                    </Link>
                </div>

                {/* Needs Attention Banner */}
                {overdueApps.length > 0 && !needsAttention && (
                    <div className="attention-banner" role="alert">
                        <span className="attention-icon" aria-hidden="true">⚠️</span>
                        <span>You have <strong>{overdueApps.length}</strong> overdue follow-up{overdueApps.length > 1 ? 's' : ''}</span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSearchParams({ needs_attention: 'true' })}
                            aria-label={`View ${overdueApps.length} overdue follow-ups`}
                        >
                            View
                        </button>
                    </div>
                )}

                {/* Search & Filters */}
                <section className="filters-section" aria-label="Search and filter applications">
                    <div className="search-row">
                        <div className="search-bar">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                            </svg>
                            <label className="sr-only" htmlFor="search-input">Search applications</label>
                            <input
                                id="search-input"
                                type="text"
                                placeholder="Search company, job title, notes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            />
                        </div>
                        <button
                            className={`btn btn-ghost filter-toggle ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                            aria-expanded={showFilters}
                            aria-controls="filters-panel"
                        >
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" />
                            </svg>
                            <span>Filters</span>
                        </button>
                        <button className="btn btn-primary" onClick={applyFilters}>Search</button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div id="filters-panel" className="filters-expanded" role="region" aria-label="Advanced filters">
                            <fieldset className="filter-group">
                                <legend className="filter-label">Status</legend>
                                <div className="status-chips" role="group" aria-label="Filter by status">
                                    {STATUSES.map(status => (
                                        <button
                                            key={status}
                                            className={`status-chip ${selectedStatuses.includes(status) ? 'selected' : ''}`}
                                            onClick={() => toggleStatus(status)}
                                            aria-pressed={selectedStatuses.includes(status)}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="filter-row">
                                <div className="filter-group">
                                    <label htmlFor="date-from" className="filter-label">From Date</label>
                                    <input
                                        id="date-from"
                                        type="date"
                                        className="filter-input"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="date-to" className="filter-label">To Date</label>
                                    <input
                                        id="date-to"
                                        type="date"
                                        className="filter-input"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="resume-filter" className="filter-label">Resume</label>
                                    <select
                                        id="resume-filter"
                                        className="filter-input"
                                        value={selectedResume}
                                        onChange={(e) => setSelectedResume(e.target.value)}
                                    >
                                        <option value="">All resumes</option>
                                        {resumes.map(r => (
                                            <option key={r.id} value={r.id}>{r.original_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="sort-by" className="filter-label">Sort By</label>
                                    <select
                                        id="sort-by"
                                        className="filter-input"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="updated_at">Last Updated</option>
                                        <option value="application_date">Applied Date</option>
                                        <option value="company_name">Company</option>
                                        <option value="urgency">Urgency</option>
                                    </select>
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <button className="btn btn-ghost clear-filters" onClick={clearFilters}>
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* Results Info */}
                <div className="results-bar" role="status" aria-live="polite">
                    <span className="results-count">
                        {applications.length} application{applications.length !== 1 ? 's' : ''}
                        {needsAttention && ' needing attention'}
                        {totalPages > 1 && ` • Page ${page} of ${totalPages}`}
                    </span>
                    {needsAttention && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setSearchParams({})}>
                            Show all
                        </button>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="error-banner" role="alert">
                        <span>{error}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setError('')} aria-label="Dismiss error">
                            ✕
                        </button>
                    </div>
                )}

                {/* Applications List */}
                {applications.length === 0 ? (
                    <div className="empty-state" role="region" aria-label="No applications">
                        <div className="empty-icon" aria-hidden="true">📋</div>
                        <h3>{hasActiveFilters ? 'No matching applications' : 'No applications yet'}</h3>
                        <p>
                            {hasActiveFilters
                                ? 'Try adjusting your filters'
                                : 'Start tracking your job search by adding your first application'}
                        </p>
                        {!hasActiveFilters && (
                            <Link to="/applications/new" className="btn btn-primary">
                                Add your first application
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="applications-grid" role="list" aria-label="Job applications">
                            {paginatedApps.map((app) => (
                                <article
                                    key={app.id}
                                    className={`application-card ${app.is_overdue ? 'overdue' : ''}`}
                                    role="listitem"
                                >
                                    {app.is_overdue && (
                                        <div className="overdue-badge" role="status">Overdue Follow-up</div>
                                    )}
                                    <div className="card-header">
                                        <div className="company-info">
                                            <h3 className="company-name">{app.company_name}</h3>
                                            <p className="job-title">{app.job_title}</p>
                                        </div>
                                        <span className={`status-badge status-${STATUS_COLORS[app.status]}`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    <div className="card-details">
                                        {app.location && (
                                            <div className="detail-item">
                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                                                </svg>
                                                <span>{app.location}</span>
                                            </div>
                                        )}
                                        <div className="detail-item">
                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                                            </svg>
                                            <span>Applied: {formatDate(app.application_date)}</span>
                                        </div>
                                        {app.follow_up_date && (
                                            <div className={`detail-item ${app.is_overdue ? 'overdue-text' : ''}`}>
                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                                                </svg>
                                                <span>Follow-up: {formatDate(app.follow_up_date)}</span>
                                            </div>
                                        )}
                                        {app.interview_round > 0 && (
                                            <div className="detail-item">
                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                </svg>
                                                <span>Interview Round {app.interview_round}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-actions" role="group" aria-label={`Actions for ${app.company_name}`}>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => navigate(`/applications/${app.id}/edit`)}
                                            aria-label={`Edit ${app.company_name} application`}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-danger"
                                            onClick={() => setDeleteId(app.id)}
                                            aria-label={`Delete ${app.company_name} application`}
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {/* Delete Confirmation */}
                                    {deleteId === app.id && (
                                        <div className="delete-confirm" role="alertdialog" aria-labelledby={`delete-title-${app.id}`}>
                                            <p id={`delete-title-${app.id}`}>Delete this application?</p>
                                            <div className="confirm-actions">
                                                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>
                                                    Cancel
                                                </button>
                                                <button className="btn btn-danger" onClick={() => handleDelete(app.id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <nav className="pagination" role="navigation" aria-label="Pagination">
                                <button
                                    className="btn btn-ghost pagination-btn"
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page === 1}
                                    aria-label="Previous page"
                                >
                                    ← Previous
                                </button>
                                <span className="pagination-info">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    className="btn btn-ghost pagination-btn"
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page === totalPages}
                                    aria-label="Next page"
                                >
                                    Next →
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Applications;
