export const eq_fftSize = 512;

export const getViewportWidthRem = () => {
    if (typeof window === "undefined") return 75;

    const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
    );

    if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) return 75;
    return window.innerWidth / rootFontSize;
}