import React from "react"

function SuggestionList({suggestions}){

return(

<ul className="suggestions">

{suggestions.map((s,i)=>(
<li key={i}>⚠ {s}</li>
))}

</ul>

)

}

export default SuggestionList