import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Analytics.css';

function Analytics() {
    const [stats, setStats] = useState({ statusCounts: [], total: 0 });
    const [overTime, setOverTime] = useState({ data: [], period: 'week' });
    const [resumes, setResumes] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [followUps, setFollowUps] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('week');

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        fetchOverTime();
    }, [period]);

    const fetchAllData = async () => {
        try {
            const [statsRes, resumesRes, companiesRes, followUpsRes] = await Promise.all([
                fetch('/api/analytics/stats', { credentials: 'include' }),
                fetch('/api/analytics/resumes', { credentials: 'include' }),
                fetch('/api/analytics/companies', { credentials: 'include' }),
                fetch('/api/analytics/follow-ups', { credentials: 'include' })
            ]);

            const [statsData, resumesData, companiesData, followUpsData] = await Promise.all([
                statsRes.json(),
                resumesRes.json(),
                companiesRes.json(),
                followUpsRes.json()
            ]);

            if (statsRes.ok) setStats(statsData);
            if (resumesRes.ok) setResumes(resumesData.resumes || []);
            if (companiesRes.ok) setCompanies(companiesData.companies || []);
            if (followUpsRes.ok) setFollowUps(followUpsData.followUps || {});

            await fetchOverTime();
        } catch (err) {
            setError('Unable to load analytics. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchOverTime = async () => {
        try {
            const res = await fetch(`/api/analytics/over-time?period=${period}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setOverTime(data);
        } catch {
            // Silent fail for secondary data
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Applied: '#3b82f6',
            Interview: '#8b5cf6',
            Offer: '#22c55e',
            Rejected: '#ef4444',
            Ghosted: '#6b7280'
        };
        return colors[status] || '#6b7280';
    };

    const safeStatusCounts = stats.statusCounts || [];
    const safeOverTimeData = overTime.data || [];
    const safeResumes = resumes || [];
    const safeCompanies = companies || [];

    const maxCount = Math.max(...safeStatusCounts.map(s => parseInt(s.count) || 0), 1);
    const maxOverTime = Math.max(...safeOverTimeData.map(d => parseInt(d.count) || 0), 1);
    const maxResumeUsage = Math.max(...safeResumes.map(r => parseInt(r.usage_count) || 0), 1);

    // Skeleton loading component
    const ChartSkeleton = () => (
        <div className="skeleton-chart" aria-hidden="true">
            <div className="skeleton" style={{ height: '100%' }} />
        </div>
    );

    if (loading) {
        return (
            <div className="analytics-page" aria-busy="true">
                <div className="analytics-container">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Analytics</h1>
                            <p className="page-subtitle">Loading your insights...</p>
                        </div>
                    </div>
                    <section className="followup-section" aria-label="Loading follow-up summary">
                        <div className="followup-cards">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="followup-card skeleton" style={{ height: '90px' }} />
                            ))}
                        </div>
                    </section>
                    <div className="charts-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="chart-card">
                                <ChartSkeleton />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-page">
            <div className="analytics-container">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Analytics</h1>
                        <p className="page-subtitle">Insights into your job search progress</p>
                    </div>
                    <div className="header-actions" role="group" aria-label="Export options">
                        <a
                            href="/api/export/csv"
                            className="btn btn-secondary"
                            download
                            aria-label="Export data as CSV file"
                        >
                            Export CSV
                        </a>
                        <a
                            href="/api/export/json"
                            className="btn btn-secondary"
                            download
                            aria-label="Export data as JSON file"
                        >
                            Export JSON
                        </a>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="error-banner" role="alert">
                        {error}
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setError(''); fetchAllData(); }}
                            style={{ marginLeft: 'auto' }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Follow-up Summary */}
                <section className="followup-section" aria-labelledby="followup-heading">
                    <h2 id="followup-heading" className="sr-only">Follow-up Summary</h2>
                    <div className="followup-cards" role="list">
                        <Link
                            to="/applications?needs_attention=true"
                            className="followup-card overdue"
                            role="listitem"
                            aria-label={`${parseInt(followUps.overdue) || 0} overdue follow-ups, click to view`}
                        >
                            <div className="followup-count">{parseInt(followUps.overdue) || 0}</div>
                            <div className="followup-label">Overdue</div>
                        </Link>
                        <div className="followup-card today" role="listitem" aria-label={`${parseInt(followUps.today) || 0} follow-ups due today`}>
                            <div className="followup-count">{parseInt(followUps.today) || 0}</div>
                            <div className="followup-label">Today</div>
                        </div>
                        <div className="followup-card upcoming" role="listitem" aria-label={`${parseInt(followUps.upcoming) || 0} follow-ups this week`}>
                            <div className="followup-count">{parseInt(followUps.upcoming) || 0}</div>
                            <div className="followup-label">This Week</div>
                        </div>
                        <div className="followup-card total" role="listitem" aria-label={`${stats.total || 0} total applications`}>
                            <div className="followup-count">{stats.total || 0}</div>
                            <div className="followup-label">Total Apps</div>
                        </div>
                    </div>
                </section>

                {/* Charts Grid */}
                <div className="charts-grid">
                    {/* Status Distribution */}
                    <section className="chart-card" aria-labelledby="status-chart-title">
                        <h2 id="status-chart-title" className="chart-title">Status Distribution</h2>
                        <div className="bar-chart" role="img" aria-label="Bar chart showing application counts by status">
                            {safeStatusCounts.length > 0 ? safeStatusCounts.map((item) => (
                                <div key={item.status} className="bar-item">
                                    <div className="bar-label">{item.status}</div>
                                    <div className="bar-wrapper" role="progressbar" aria-valuenow={parseInt(item.count)} aria-valuemin={0} aria-valuemax={maxCount}>
                                        <div
                                            className="bar"
                                            style={{
                                                width: `${(parseInt(item.count) / maxCount) * 100}%`,
                                                backgroundColor: getStatusColor(item.status)
                                            }}
                                        />
                                    </div>
                                    <div className="bar-value" aria-hidden="true">{item.count}</div>
                                </div>
                            )) : (
                                <div className="empty-chart">
                                    <p className="no-data">No applications yet</p>
                                    <Link to="/applications/new" className="btn btn-secondary">Add your first</Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Applications Over Time */}
                    <section className="chart-card" aria-labelledby="overtime-chart-title">
                        <div className="chart-header">
                            <h2 id="overtime-chart-title" className="chart-title">Applications Over Time</h2>
                            <label className="sr-only" htmlFor="period-select">Select time period</label>
                            <select
                                id="period-select"
                                className="period-select"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                            >
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                            </select>
                        </div>
                        <div className="line-chart" role="img" aria-label={`Column chart showing applications per ${period}`}>
                            {safeOverTimeData.length > 0 ? (
                                <div className="line-chart-bars">
                                    {safeOverTimeData.map((item, index) => (
                                        <div key={index} className="line-bar-item">
                                            <div
                                                className="line-bar"
                                                style={{ height: `${(parseInt(item.count) / maxOverTime) * 100}%` }}
                                                role="progressbar"
                                                aria-valuenow={parseInt(item.count)}
                                                aria-valuemin={0}
                                                aria-valuemax={maxOverTime}
                                            >
                                                <span className="line-bar-value">{item.count}</span>
                                            </div>
                                            <div className="line-bar-label">{item.period?.slice(-5) || item.period}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-chart">
                                    <p className="no-data">No data available yet</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Resume Usage */}
                    <section className="chart-card" aria-labelledby="resume-chart-title">
                        <h2 id="resume-chart-title" className="chart-title">Resume Usage</h2>
                        <div className="bar-chart horizontal" role="img" aria-label="Bar chart showing how often each resume was used">
                            {safeResumes.length > 0 ? safeResumes.slice(0, 5).map((resume) => (
                                <div key={resume.id} className="bar-item">
                                    <div className="bar-label" title={resume.name}>
                                        {resume.name?.length > 20 ? resume.name.slice(0, 20) + '...' : resume.name}
                                    </div>
                                    <div className="bar-wrapper">
                                        <div
                                            className="bar"
                                            style={{
                                                width: `${(parseInt(resume.usage_count) / maxResumeUsage) * 100}%`,
                                                backgroundColor: '#8b5cf6'
                                            }}
                                        />
                                    </div>
                                    <div className="bar-value">{resume.usage_count}</div>
                                </div>
                            )) : (
                                <div className="empty-chart">
                                    <p className="no-data">No resumes uploaded</p>
                                    <Link to="/resumes" className="btn btn-secondary">Upload resume</Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Top Companies */}
                    <section className="chart-card" aria-labelledby="companies-chart-title">
                        <h2 id="companies-chart-title" className="chart-title">Top Companies</h2>
                        <div className="companies-list" role="list">
                            {safeCompanies.length > 0 ? safeCompanies.slice(0, 8).map((company, index) => (
                                <div key={company.company_name} className="company-item" role="listitem">
                                    <span className="company-rank" aria-hidden="true">#{index + 1}</span>
                                    <span className="company-name">{company.company_name}</span>
                                    <span className="company-count">{company.count} app{parseInt(company.count) !== 1 ? 's' : ''}</span>
                                </div>
                            )) : (
                                <div className="empty-chart">
                                    <p className="no-data">No applications yet</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
