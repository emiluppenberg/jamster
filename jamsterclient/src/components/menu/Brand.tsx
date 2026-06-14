import { useRef } from "react";

const Brand = () => {
    const brandDialogRef = useRef<HTMLDialogElement>(null);
    const showBrandDialog = () => brandDialogRef.current?.showModal();

    return (
        <>
            <button
                type="button"
                className="brand"
                aria-label="BeatDoc"
                onClick={showBrandDialog}
            >
                <img className="logo" src="/beatdoc-logo.svg" alt="" aria-hidden="true" />
                <img className="icon" src="/favicon.svg" alt="" aria-hidden="true" />
            </button>
            <dialog className="brand-dialog" ref={brandDialogRef}>
                <div className="dialog-header">
                    <div className="brand">
                        <img className="logo" src="/beatdoc-logo.svg" alt="" aria-hidden="true" />
                        <img className="icon" src="/favicon.svg" alt="" aria-hidden="true" />
                    </div>
                    <button className="btn dialog-close" type="button" onClick={() => brandDialogRef.current?.close()}>
                        X
                    </button>
                </div>
                <div className="dialog-body">
                    <section className="about-summary">
                        <p>Create beats directly in your browser with BeatDoc.</p>
                        <p>Go full hands-on or team up with an AI by hooking it up to our MCP server.</p>
                    </section>
                    <section className="about-credits" aria-label="Sample credits">
                        <h2>Sample Credits</h2>
                        <p>Samples provided by <a href="https://soundpacks.com">soundpacks.com</a></p>
                        <p>LoFi drum samples by <a href="https://soundpacks.com/entity/dj-ignorant/">dj-ignorant</a></p>
                        <p>Chord instrument samples by <a href="https://soundpacks.com/entity/jbl3677/">JBL3677</a></p>
                        <p>TR909 drum samples by <a href="https://soundpacks.com/entity/maunster/">Maunster</a></p>
                    </section>
                </div>
            </dialog>
        </>
    )
}

export default Brand;
