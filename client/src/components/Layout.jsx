import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';

function Layout() {
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            {/* Skip to main content link for keyboard users */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            <header className="header" role="banner">
                <div className="header-container">
                    <Link
                        to={isAuthenticated ? "/dashboard" : "/"}
                        className="logo"
                        aria-label="ApplyTrack Pro - Go to home"
                    >
                        <div className="logo-icon" aria-hidden="true">AT</div>
                        <span className="logo-text">ApplyTrack Pro</span>
                    </Link>

                    <nav className="nav" role="navigation" aria-label="Main navigation">
                        {isAuthenticated ? (
                            <>
                                <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
                                <NavLink to="/applications" className="nav-link">Applications</NavLink>
                                <NavLink to="/resumes" className="nav-link">Resumes</NavLink>
                                <NavLink to="/analytics" className="nav-link">Analytics</NavLink>
                                <NavLink to="/ai-tools" className="nav-link">✨ AI Tools</NavLink>
                                <NavLink to="/settings" className="nav-link">Settings</NavLink>

                                <button
                                    onClick={toggleTheme}
                                    className="theme-toggle"
                                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                >
                                    {theme === 'dark' ? (
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                        </svg>
                                    )}
                                </button>

                                <div className="user-menu">
                                    <span className="user-email" aria-label={`Logged in as ${user?.email}`}>
                                        {user?.email}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="btn btn-ghost"
                                        aria-label="Log out of your account"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link">Login</Link>
                                <Link to="/register" className="btn btn-primary">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Mobile navigation */}
                    {isAuthenticated && (
                        <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
                            <NavLink
                                to="/dashboard"
                                className="mobile-nav-link"
                                aria-label="Dashboard"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                            </NavLink>
                            <NavLink
                                to="/applications"
                                className="mobile-nav-link"
                                aria-label="Applications"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" />
                                </svg>
                            </NavLink>
                            <NavLink
                                to="/resumes"
                                className="mobile-nav-link"
                                aria-label="Resumes"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                </svg>
                            </NavLink>
                            <NavLink
                                to="/analytics"
                                className="mobile-nav-link"
                                aria-label="Analytics"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                            </NavLink>
                            <NavLink
                                to="/ai-tools"
                                className="mobile-nav-link"
                                aria-label="AI Tools"
                            >
                                <span style={{ fontSize: '16px' }}>✨</span>
                            </NavLink>
                            <button
                                onClick={handleLogout}
                                className="mobile-nav-link"
                                aria-label="Log out"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />
                                </svg>
                            </button>
                        </nav>
                    )}
                </div>
            </header>

            <main id="main-content" className="main" role="main">
                <Outlet />
            </main>

            <footer className="footer" role="contentinfo">
                <div className="footer-container">
                    <p>&copy; {new Date().getFullYear()} ApplyTrack Pro. Track your career journey.</p>
                </div>
            </footer>
        </div>
    );
}

export default Layout;
