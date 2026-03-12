import React from "react"

function ScoreCircle({score}){

return(

<div className="scorePanel">

<h2>Resume Score</h2>

<div className="circle">

{score}

</div>

<p>ATS Compatibility</p>

</div>

)

}

export default ScoreCircle