import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useJamsterContext } from "../Context";

export interface EqualizerProps {
    isPlaying: boolean;
}

const getMenuContentDimensions = (menuElement: HTMLElement) => {
    const menuStyles = window.getComputedStyle(menuElement);

    const heightBlock = (
        Number.parseFloat(menuStyles.paddingTop) +
        Number.parseFloat(menuStyles.paddingBottom)
    );

    const widthBlock = (
        Number.parseFloat(menuStyles.paddingLeft) +
        Number.parseFloat(menuStyles.paddingRight)
    );

    const height = Math.max(0, menuElement.clientHeight - heightBlock);
    const width = Math.max(0, menuElement.clientWidth - widthBlock);

    return { width, height };
}

const Equalizer = (props: EqualizerProps) => {
    const { analyserNode } = useJamsterContext();
    const equalizerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [equalizerWidth, setEqualizerWidth] = useState(0)
    const [equalizerHeight, setEqualizerHeight] = useState(0);

    useLayoutEffect(() => {
        const equalizerElement = equalizerRef.current;
        const menuElement = equalizerElement?.closest<HTMLElement>(".menu");
        if (!menuElement) return;

        const updateEqualizerDimensions = () => {
            const { width, height } = getMenuContentDimensions(menuElement);

            setEqualizerHeight((currentHeight) => (
                currentHeight === height
                    ? currentHeight
                    : height
            ));

            setEqualizerWidth((currentWidth) => (
                currentWidth === width
                    ? currentWidth
                    : width
            ));
        }

        updateEqualizerDimensions();

        const resizeObserver = new ResizeObserver(updateEqualizerDimensions);
        resizeObserver.observe(menuElement);

        return () => resizeObserver.disconnect();
    }, []);

    const equalizerStyle = {
        "--equalizer-width": `${equalizerWidth}px`,
        "--equalizer-height": `${equalizerHeight}px`,
    } as CSSProperties;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const array = new Uint8Array(analyserNode.frequencyBinCount);
        let animationFrameId: number;

        const drawAudio = () => {
            const w = canvas.width;
            const h = canvas.height;

            analyserNode.getByteTimeDomainData(array);

            ctx.clearRect(0, 0, w, h);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#22d3ee";
            ctx.beginPath();

            const slice = w / array.length;
            let x = 0;

            for (let i = 0; i < array.length; i++) {
                const v = array[i] / 128;
                const y = (v * h) / 2;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                x += slice;
            }

            ctx.stroke();

            animationFrameId = requestAnimationFrame(drawAudio);
        }

        if (props.isPlaying) {
            drawAudio();
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [props.isPlaying, analyserNode]);

    return (
        <div className="equalizer" ref={equalizerRef} style={equalizerStyle}>
            <canvas className="visual" ref={canvasRef} />
        </div>
    )
}

export default Equalizer;
