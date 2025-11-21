import React, { useEffect, useRef } from "react";

interface ZyraLoaderProps {
    backgroundColor?: string;
    textColor?: string;
    dotColor?: string;
}

export default function ZyraLoader({
    backgroundColor = "#ffffff",
    textColor = "#000000",
    dotColor = "#000000",
}: ZyraLoaderProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const text = container.querySelector("#text") as HTMLDivElement;
        const dotsContainer = container.querySelector("#dots") as HTMLDivElement;
        const letters = ["Z", "Y", "R", "A"];

        let dotCount = 260;
        let dots: HTMLDivElement[] = [];

        // Create dots
        for (let i = 0; i < dotCount; i++) {
            const d = document.createElement("div");
            d.classList.add("dot");
            d.style.background = dotColor;
            dots.push(d);
            dotsContainer.appendChild(d);
        }

        function animate() {
            text.style.transition = "transform 0.6s ease, opacity 0.6s";
            text.style.transform = "rotateX(90deg)";
            text.style.opacity = "0";

            setTimeout(centerDots, 600);
            setTimeout(blowOutDots, 1200);
            setTimeout(circleWave, 2300);
            setTimeout(typeLettersCentered, 3300);
        }

        function centerDots() {
            dots.forEach((d) => {
                d.style.opacity = "1";
                d.style.transition = "transform 0.6s ease, opacity 0.6s ease";
                d.style.transform = "translate(-50%, -50%)";
            });
        }

        function blowOutDots() {
            dots.forEach((d) => {
                const angle = Math.random() * Math.PI * 2;
                const distance = 110 + Math.random() * 90;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                d.style.transition = "transform 0.8s ease-out";
                d.style.transform = `translate(${x}px, ${y}px)`;
            });
        }

        function circleWave() {
            dots.forEach((d, i) => {
                const angle = (i / dots.length) * Math.PI * 2;
                const radius = 85;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                d.style.transition = "transform 1.2s ease";
                d.style.transform = `translate(${x}px, ${y}px)`;
            });
        }

        function typeLettersCentered() {
            text.innerText = "";
            text.style.opacity = "1";
            text.style.transform = "rotateX(0deg)";

            let i = 0;
            const interval = setInterval(() => {
                text.innerText += letters[i];
                i++;
                if (i >= letters.length) clearInterval(interval);
            }, 200);

            dots.forEach((d) => {
                d.style.opacity = "0";
                d.style.transition = "opacity 1s ease";
            });
        }

        animate();

        return () => {
            dotsContainer.innerHTML = "";
        };
    }, [dotColor]);

    return (
        <div
            ref={containerRef}
            style={{
                background: backgroundColor,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100%",
                margin: 0,
                overflow: "hidden",
                fontFamily: "Arial, sans-serif",
                position: "fixed",
                top: 0,
                left: 0,
                zIndex: 9999,
            }}
        >
            <div
                id="container"
                style={{ position: "relative", width: "260px", height: "260px" }}
            >
                <div
                    id="text"
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        fontSize: "50px",
                        fontWeight: 700,
                        color: textColor,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        transformStyle: "preserve-3d",
                        backfaceVisibility: "hidden",
                    }}
                >
                    ZYRA
                </div>

                <div
                    id="dots"
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                ></div>
            </div>

            <style>{`
        .dot {
          position: absolute;
          width: 3.5px;
          height: 3.5px;
          border-radius: 50%;
          opacity: 0;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>
        </div>
    );
}
