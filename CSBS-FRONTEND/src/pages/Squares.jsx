import { useRef, useEffect } from 'react';
import './Squares.css';

/**
 * Squares — animated scrolling grid background with hover highlight.
 * Source: reactbits.dev/backgrounds/squares (MIT License, David Haz).
 *
 * eventSourceRef — optional ref to the parent element to attach mouse events.
 *   Pass this when the canvas is behind other elements that absorb pointer events.
 */
const Squares = ({
    direction = 'diagonal',
    speed = 0.5,
    borderColor = '#2a4a5e',
    squareSize = 44,
    hoverFillColor = '#00a6c0',
    className = '',
    eventSourceRef = null,
}) => {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const gridOffset = useRef({ x: 0, y: 0 });
    const hoveredSquare = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
            const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;

            for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
                for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
                    const squareX = x - (gridOffset.current.x % squareSize);
                    const squareY = y - (gridOffset.current.y % squareSize);

                    const isHovered =
                        hoveredSquare.current &&
                        Math.floor((x - startX) / squareSize) === hoveredSquare.current.x &&
                        Math.floor((y - startY) / squareSize) === hoveredSquare.current.y;

                    if (isHovered) {
                        ctx.fillStyle = hoverFillColor;
                        ctx.fillRect(squareX, squareY, squareSize, squareSize);
                    }

                    // Brighter stroke for hovered square
                    ctx.strokeStyle = isHovered ? hoverFillColor : borderColor;
                    ctx.lineWidth = isHovered ? 1.5 : 1;
                    ctx.strokeRect(squareX, squareY, squareSize, squareSize);
                }
            }

            // Radial vignette overlay
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2,
                Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(26,31,38,0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const updateAnimation = () => {
            const effectiveSpeed = Math.max(speed, 0.1);
            switch (direction) {
                case 'right':
                    gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize;
                    break;
                case 'left':
                    gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize;
                    break;
                case 'up':
                    gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize;
                    break;
                case 'down':
                    gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize;
                    break;
                case 'diagonal':
                    gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize;
                    gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize;
                    break;
                default:
                    break;
            }

            drawGrid();
            requestRef.current = requestAnimationFrame(updateAnimation);
        };

        // Attach mouse listeners to eventSourceRef (parent element) if provided,
        // so hover works even when cursor is over child elements above the canvas.
        const eventTarget = eventSourceRef?.current ?? canvas;

        const handleMouseMove = event => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
            const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;

            const hoveredSquareX = Math.floor((mouseX + gridOffset.current.x - startX) / squareSize);
            const hoveredSquareY = Math.floor((mouseY + gridOffset.current.y - startY) / squareSize);

            if (
                !hoveredSquare.current ||
                hoveredSquare.current.x !== hoveredSquareX ||
                hoveredSquare.current.y !== hoveredSquareY
            ) {
                hoveredSquare.current = { x: hoveredSquareX, y: hoveredSquareY };
            }
        };

        const handleMouseLeave = () => {
            hoveredSquare.current = null;
        };

        eventTarget.addEventListener('mousemove', handleMouseMove);
        eventTarget.addEventListener('mouseleave', handleMouseLeave);

        requestRef.current = requestAnimationFrame(updateAnimation);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(requestRef.current);
            eventTarget.removeEventListener('mousemove', handleMouseMove);
            eventTarget.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [direction, speed, borderColor, hoverFillColor, squareSize, eventSourceRef]);

    return <canvas ref={canvasRef} className={`squares-canvas ${className}`}></canvas>;
};

export default Squares;
