import type { Warning } from "../types";

export interface WarningDisplayProps {
    warnings: Warning[];
}

const WarningDisplay = (props: WarningDisplayProps) => (
    <div className="warning">
        {props.warnings.map(warning =>
        (
            <p><span>Warning: </span>{warning.message}</p>
        )
        )}
    </div>
)

export default WarningDisplay;
