import './Footer.css';
import { Mail, Phone, MapPin, Instagram, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-content">
                <div className="footer-brand">
                    <h2 className="footer-logo">CSBS</h2>
                    <p className="footer-desc">
                        Современный коворкинг для продуктивной работы. Создаем идеальные пространства для бизнеса и фриланса.
                    </p>
                    <div className="social-links">
                        <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                        <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                        <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                    </div>
                </div>

                <div className="footer-links-group">
                    <h4>Навигация</h4>
                    <ul>
                        <li><a href="/#locations">Локации</a></li>
                        <li><a href="/#amenities">Удобства</a></li>
                        <li><a href="/#pricing">Тарифы</a></li>
                        <li><a href="/ai-assistant">AI Ассистент</a></li>
                    </ul>
                </div>

                <div className="footer-links-group">
                    <h4>Контакты</h4>
                    <ul className="contact-info">
                        <li>
                            <MapPin size={16} />
                            <span>ул. Тверская, 15, Москва</span>
                        </li>
                        <li>
                            <Phone size={16} />
                            <span>+7 (495) 123-45-67</span>
                        </li>
                        <li>
                            <Mail size={16} />
                            <span>hello@csbs.work</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="container footer-bottom">
                <p className="copyright">&copy; {new Date().getFullYear()} CSBS Коворкинг. Все права защищены.</p>
                <div className="legal-links">
                    <a href="#">Политика конфиденциальности</a>
                    <a href="#">Условия использования</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
