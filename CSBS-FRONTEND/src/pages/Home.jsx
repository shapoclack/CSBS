import { useRef } from 'react';
import { Search, MapPin, Wifi, Coffee, Users, Printer, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Squares from './Squares';
import './Home.css';

export default function Home() {
    const workspaces = [
        { id: 1, name: "Открытое пространство", location: "Центр", price: "$25/день", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800", rating: 4.9 },
        { id: 2, name: "Переговорная", location: "Технопарк", price: "$30/день", img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800", rating: 4.8 },
        { id: 3, name: "Аренда небольших офисов", location: "Набережная", price: "$40/день", img: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800", rating: 5.0 },
    ];

    const heroRef = useRef(null);

    return (
        <div className="home-page">
            <section className="hero" ref={heroRef} style={{ position: 'relative', overflow: 'hidden' }}>
                <Squares
                    direction="diagonal"
                    speed={0.5}
                    borderColor="#2a4a5e"
                    squareSize={44}
                    hoverFillColor="#00a6c0"
                    eventSourceRef={heroRef}
                />
                <div className="container">
                    <div className="hero-content">
                        <h1 className="main-title">
                            <span className="coworking-text"><span className="text-accent">COW</span>ORKING</span>
                            <br />
                            <span className="future-text">OF THE FUTURE</span>
                        </h1>
                        <p className="hero-subtitle">Бронируйте премиальные рабочие места, созданные для глубокой концентрации и успешного сотрудничества. Идеальное место для вашего бизнеса.</p>

                        <div className="hero-actions">
                            <Link to="/booking" className="btn btn-primary btn-lg">Забронировать место</Link>
                            <a href="#about" className="btn btn-outline btn-lg">О нас</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="stats-section">
                <div className="container stats-container">
                    <div className="stat-item">
                        <div className="stat-number">3</div>
                        <div className="stat-label">Локации в центре города</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">250+</div>
                        <div className="stat-label">Рабочих мест</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">24/7</div>
                        <div className="stat-label">Доступ в любое время</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">1200+</div>
                        <div className="stat-label">Доверяют нам ежемесячно</div>
                    </div>
                </div>
            </section>

            {/* AMENITIES SECTION */}
            <section className="amenities-section">
                <div className="container">
                    <div className="amenities-header">
                        <h2>Все включено</h2>
                        <p>Оставляем быт нам. Вы фокусируетесь на главном.</p>
                    </div>
                    <div className="amenities-grid">
                        <div className="amenity-card">
                            <Wifi size={32} className="amenity-icon" />
                            <h3>Высокоскоростной Wi-Fi</h3>
                            <p>Резервные каналы и стабильный интернет 1 Гбит/с для любых задач вашей команды.</p>
                        </div>
                        <div className="amenity-card">
                            <Coffee size={32} className="amenity-icon" />
                            <h3>Кофе и снеки</h3>
                            <p>Безлимитный свежесваренный спешелти кофе и полезные перекусы в лаунж-зонах.</p>
                        </div>
                        <div className="amenity-card">
                            <Printer size={32} className="amenity-icon" />
                            <h3>Принт-зона</h3>
                            <p>Современные МФУ для цветной печати, сканирования и копирования документов.</p>
                        </div>
                        <div className="amenity-card">
                            <Clock size={32} className="amenity-icon" />
                            <h3>Доступ 24/7</h3>
                            <p>Круглосуточная поддержка и возможность бронировать места в любое время суток.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ABOUT US SECTION */}
            <section id="about" className="about-section">
                <div className="container">
                    <div className="about-content-wrapper">
                        <div className="about-text-column">
                            <h2>О нас</h2>
                            <p className="about-description">
                                Мы переосмысливаем рабочее пространство. Наш коворкинг — это экосистема для новаторов,
                                где технологии встречаются с комфортом. Мы верим, что окружение формирует идеи,
                                поэтому создали идеальное место для продуктивности, нетворкинга и масштабных проектов.
                                Присоединяйтесь к комьюнити, создающему будущее!
                            </p>
                        </div>
                        <div className="about-image-column">
                            <img
                                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80"
                                alt="Coworking Space"
                                className="about-image neon-image-border"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="workspaces-section container">
                <div className="section-header">
                    <h2>Популярные Места</h2>
                    <Link to="/booking" className="view-all">Смотреть все &rarr;</Link>
                </div>

                <div className="workspaces-grid">
                    {workspaces.map(space => (
                        <div key={space.id} className="workspace-card glass-panel">
                            <div className="workspace-img-container">
                                <img src={space.img} alt={space.name} className="workspace-img" />
                                <div className="workspace-price">{space.price}</div>
                            </div>
                            <div className="workspace-info">
                                <h3>{space.name}</h3>
                                <div className="workspace-meta">
                                    <span className="meta-item"><MapPin size={16} /> {space.location}</span>
                                    <span className="meta-item rating">★ {space.rating}</span>
                                </div>
                                <div className="workspace-features">
                                    <span className="feature-icon" title="Быстрый Wi-Fi"><Wifi size={18} /></span>
                                    <span className="feature-icon" title="Бесплатный кофе"><Coffee size={18} /></span>
                                    <span className="feature-icon" title="Переговорка"><Users size={18} /></span>
                                </div>
                                <Link to="/booking" className="btn btn-outline book-btn text-center inline-block">Забронировать</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
