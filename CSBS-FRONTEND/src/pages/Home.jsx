import { useRef, useState, useCallback, lazy, Suspense } from 'react';
import { MapPin, Wifi, Coffee, Users, Printer, Clock, Star, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Squares from './Squares';
import ElectricBorder from '../components/ElectricBorder';
import cowImg from '../assets/cow.png';
import { workspaces, reviews, tariffs, faqs, galleryItems } from '../constants/homeData';
import './Home.css';

const CircularGallery = lazy(() => import('../components/CircularGallery/CircularGallery'));

export default function Home() {
    const [activeFaq, setActiveFaq] = useState(null);
    const heroRef = useRef(null);

    const toggleFaq = useCallback((id) => {
        setActiveFaq(prev => (prev === id ? null : id));
    }, []);

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
                        <ElectricBorder>
                            <div className="amenity-card" style={{ border: 'none' }}>
                                <Wifi size={32} className="amenity-icon" />
                                <h3>Высокоскоростной Wi-Fi</h3>
                                <p>Резервные каналы и стабильный интернет 1 Гбит/с для любых задач вашей команды.</p>
                            </div>
                        </ElectricBorder>
                        <ElectricBorder>
                            <div className="amenity-card" style={{ border: 'none' }}>
                                <Coffee size={32} className="amenity-icon" />
                                <h3>Кофе и снеки</h3>
                                <p>Безлимитный свежесваренный спешелти кофе и полезные перекусы в лаунж-зонах.</p>
                            </div>
                        </ElectricBorder>
                        <ElectricBorder>
                            <div className="amenity-card" style={{ border: 'none' }}>
                                <Printer size={32} className="amenity-icon" />
                                <h3>Принт-зона</h3>
                                <p>Современные МФУ для цветной печати, сканирования и копирования документов.</p>
                            </div>
                        </ElectricBorder>
                        <ElectricBorder>
                            <div className="amenity-card" style={{ border: 'none' }}>
                                <Clock size={32} className="amenity-icon" />
                                <h3>Доступ 24/7</h3>
                                <p>Круглосуточная поддержка и возможность бронировать места в любое время суток.</p>
                            </div>
                        </ElectricBorder>
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
                                src={cowImg}
                                alt="Coworking Space"
                                className="about-image neon-image-border"
                                loading="lazy"
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
                        <ElectricBorder key={space.id}>
                            <div className="workspace-card glass-panel" style={{ border: 'none' }}>
                                <div className="workspace-img-container">
                                    <img src={space.img} alt={space.name} className="workspace-img" loading="lazy" />
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
                        </ElectricBorder>
                    ))}
                </div>
            </section>

            {/* TARIFFS SECTION */}
            <section className="tariffs-section">
                <div className="container">
                    <div className="section-header text-center" style={{ display: 'block', marginBottom: '3rem' }}>
                        <h2>Тарифы</h2>
                        <p className="hero-subtitle" style={{ marginTop: '0.5rem' }}>Подберите идеальный формат для себя или своей команды</p>
                    </div>

                    <div className="tariffs-grid">
                        {tariffs.map(tariff => (
                            <div key={tariff.id} className={`tariff-card glass-panel ${tariff.popular ? 'popular' : ''}`}>
                                {tariff.popular && <div className="popular-badge">Выбор резидентов</div>}
                                <h3 className="tariff-name">{tariff.name}</h3>
                                <div className="tariff-price-block">
                                    <span className="tariff-price">{tariff.price}</span>
                                    <span className="tariff-period">{tariff.period}</span>
                                </div>
                                <p className="tariff-desc">{tariff.desc}</p>
                                <div className="tariff-features">
                                    {tariff.features.map((feat, index) => (
                                        <div key={index} className="tariff-feature-item">
                                            <Check size={18} className="text-accent" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link to="/booking" className={`btn ${tariff.popular ? 'btn-primary' : 'btn-outline'} tariff-btn`}>
                                    Выбрать тариф
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* GALLERY SECTION */}
            <section className="gallery-section">
                <div className="container gallery-heading">
                    <div className="section-header">
                        <h2>Пространство</h2>
                    </div>
                </div>
                <div className="gallery-canvas">
                    <Suspense fallback={<div className="gallery-fallback">Загрузка галереи...</div>}>
                        <CircularGallery
                            bend={3}
                            textColor="#ffffff"
                            borderRadius={0.05}
                            items={galleryItems}
                        />
                    </Suspense>
                </div>
            </section>

            {/* REVIEWS SECTION */}
            <section className="reviews-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Что говорят резиденты</h2>
                    </div>
                    <div className="reviews-grid">
                        {reviews.map(review => (
                            <div key={review.id} className="review-card glass-panel">
                                <div className="review-header">
                                    <img src={review.avatar} alt={review.name} className="review-avatar" loading="lazy" />
                                    <div className="review-author">
                                        <h4>{review.name}</h4>
                                        <span className="review-role">{review.role}</span>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={16} fill="var(--color-accent)" color="var(--color-accent)" />
                                    ))}
                                </div>
                                <p className="review-text">"{review.text}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="faq-section">
                <div className="container faq-container">
                    <div className="faq-text-column">
                        <h2>Частые вопросы</h2>
                        <p className="about-description">Остались сомнения? Здесь мы собрали ответы на самые популярные вопросы о работе в нашем коворкинге.</p>
                    </div>
                    <div className="faq-accordion-column">
                        {faqs.map(faq => (
                            <div key={faq.id} className={`faq-item glass-panel ${activeFaq === faq.id ? 'active' : ''}`} onClick={() => toggleFaq(faq.id)}>
                                <div className="faq-question">
                                    <h3>{faq.q}</h3>
                                    <ChevronDown className={`faq-icon ${activeFaq === faq.id ? 'rotated' : ''}`} />
                                </div>
                                <div className="faq-answer">
                                    <p>{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* MAP & CTA SECTION */}
            <section className="map-cta-section">
                <div className="container map-cta-container glass-panel">
                    <div className="cta-content">
                        <h2>Приходите на тестовый день</h2>
                        <p>Попробуйте поработать у нас один день абсолютно бесплатно. Оцените атмосферу, кофе и интернет.</p>
                        <form className="cta-form" onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder="Ваш Email" className="cta-input" required />
                            <button type="submit" className="btn btn-primary">Получить пропуск</button>
                        </form>
                    </div>
                    <div className="map-wrapper">
                        {/* Используем iframe для Google Maps. Фильтр инверсии делает карту темной! */}
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1111!2d37.6173!3d55.7558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sru!2sru!4v1600000000000!5m2!1sru!2sru"
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(100%)' }}
                            allowFullScreen=""
                            loading="lazy"
                            title="Карта коворкинга"
                        ></iframe>
                    </div>
                </div>
            </section>
        </div>
    );
}
