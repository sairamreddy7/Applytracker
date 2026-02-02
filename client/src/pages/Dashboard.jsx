import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const STATUS_COLORS = {
    Applied: 'blue',
    Interview: 'purple',
    Offer: 'green',
    Rejected: 'red',
    Ghosted: 'gray'
};

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        ghosted: 0,
        total: 0
    });
    const [recentApps, setRecentApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch stats
            const statsRes = await fetch('/api/applications/stats/summary', { credentials: 'include' });
            const statsData = await statsRes.json();
            if (statsRes.ok) {
                setStats(statsData.stats);
            }

            // Fetch recent applications
            const appsRes = await fetch('/api/applications?limit=5', { credentials: 'include' });
            const appsData = await appsRes.json();
            if (appsRes.ok) {
                setRecentApps(appsData.applications.slice(0, 5));
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const statusCards = [
        { label: 'Applied', count: parseInt(stats.applied) || 0, color: 'blue' },
        { label: 'Interview', count: parseInt(stats.interview) || 0, color: 'purple' },
        { label: 'Offer', count: parseInt(stats.offer) || 0, color: 'green' },
        { label: 'Rejected', count: parseInt(stats.rejected) || 0, color: 'red' }
    ];

    if (loading) {
        return (
            <div className="dashboard">
                <div className="dashboard-container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-container">
                {/* Welcome Section */}
                <section className="welcome-section">
                    <div className="welcome-content">
                        <h1 className="welcome-title">
                            Welcome back, <span className="text-gradient">{user?.firstName || 'there'}</span>! 👋
                        </h1>
                        <p className="welcome-subtitle">
                            Track your job applications and land your dream job
                        </p>
                    </div>
                    <Link to="/applications/new" className="btn btn-primary add-application-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                        </svg>
                        Add Application
                    </Link>
                </section>

                {/* Stats Overview */}
                <section className="stats-section">
                    <div className="stats-grid">
                        {statusCards.map((card) => (
                            <div key={card.label} className={`stat-card stat-card-${card.color}`}>
                                <div className="stat-count">{card.count}</div>
                                <div className="stat-label">{card.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Applications */}
                <section className="applications-section">
                    <div className="section-header">
                        <h2 className="section-title">Recent Applications</h2>
                        <Link to="/applications" className="btn btn-ghost">View all</Link>
                    </div>

                    {recentApps.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <h3>No applications yet</h3>
                            <p>Start tracking your job search by adding your first application</p>
                            <Link to="/applications/new" className="btn btn-primary">
                                Add your first application
                            </Link>
                        </div>
                    ) : (
                        <div className="recent-apps-list">
                            {recentApps.map(app => (
                                <Link
                                    key={app.id}
                                    to={`/applications/${app.id}/edit`}
                                    className="recent-app-item"
                                >
                                    <div className="app-info">
                                        <h4 className="app-company">{app.company_name}</h4>
                                        <p className="app-title">{app.job_title}</p>
                                    </div>
                                    <div className="app-meta">
                                        <span className={`status-badge status-${STATUS_COLORS[app.status]}`}>
                                            {app.status}
                                        </span>
                                        <span className="app-date">{formatDate(app.application_date)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <section className="quick-actions">
                    <Link to="/applications" className="action-card">
                        <div className="action-icon">📋</div>
                        <div className="action-content">
                            <h3>Applications</h3>
                            <p>View and manage all your job applications</p>
                        </div>
                    </Link>
                    <Link to="/resumes" className="action-card">
                        <div className="action-icon">📄</div>
                        <div className="action-content">
                            <h3>Resumes</h3>
                            <p>Upload and manage your resume documents</p>
                        </div>
                    </Link>
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
