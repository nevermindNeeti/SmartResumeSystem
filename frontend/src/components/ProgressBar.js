import React from "react";

function ProgressBar({ label, value }) {

return (

<div className="progressItem">

<div className="progressLabel">
{label}
<span>{value}%</span>
</div>

<div className="progressBar">
<div className="progressFill" style={{width: `${value}%`}}></div>
</div>

</div>

);

}

export default ProgressBar;