import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css'
import logo from '../assets/Elix-logo.png'

const Landing = () => {
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.scroll-section').forEach(section => {
            observer.observe(section);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-container">
            <section className="hero-section">
                <div className="hero-content">
                    <div className="logo-container">
                        <img src={logo} alt="ELIX Logo" className="hero-logo" />
                    </div>
                    <h1 className="hero-title">
                        <span className="gradient-text">ELIX</span>
                        <span className="hero-subtitle">Executive Learning Interface eXpert</span>
                    </h1>
                    <p className="hero-tagline">Your Words, Our Execution</p>
                    <button 
                        className="cta-button pulse"
                        onClick={() => navigate('/signin')}
                    >
                        Get Started
                    </button>
                </div>
                <div className="hero-background"></div>
                <div className="scroll-down">
                    <p ref={scrollRef} className="scroll-text">
                        Scroll Down ↓
                    </p>
                </div>
            </section>
            <section className="scroll-section features-section">
                <h2 className="section-title">Powerful Features</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🎙️</div>
                        <h3>Voice-First Interface</h3>
                        <p>Just say "Elix" followed by your command and "dot" to activate developer mode</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Lightning Execution</h3>
                        <p>Open apps, search web, set reminders - all through natural language</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Secure & Private</h3>
                        <p>Your data stays on your device with optional cloud sync</p>
                    </div>
                </div>
            </section>
            <section className="scroll-section tutorial-section">
                <h2 className="section-title">How To Use ELIX</h2>
                <div className="tutorial-steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h3>Activate Developer Mode</h3>
                            <p>Say wake words <span className="code">"Elix"</span> or <span className="code">"Alex"</span> followed by your command and end with <span className="code">"dot"</span></p>
                            <div className="prompt-example">
                                <p>"Elix open calculator dot"</p>
                            </div>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h3>Try Sample Prompts</h3>
                            <div className="prompt-grid">
                                <div className="prompt-card">
                                    <p>"Elix search for AI trends dot"</p>
                                </div>
                                <div className="prompt-card">
                                    <p>"Elix set reminder for meeting at 3pm dot"</p>
                                </div>
                                <div className="prompt-card">
                                    <p>"Elix open whatsapp dot"</p>
                                </div>
                                <div className="prompt-card">
                                    <p>"Elix summarize this article dot"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h3>Chat Mode</h3>
                            <p>Type normally for general queries without developer mode commands</p>
                            <div className="prompt-example">
                                <p>"What's the weather today?"</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="scroll-section final-cta">
                <h2>Ready to Boost Your Productivity?</h2>
                <button 
                    className="cta-button pulse"
                    onClick={() => navigate('/signin')}
                >
                    Start Using ELIX Now
                </button>
            </section>
        </div>
    );
};

export default Landing;