import React from "react"

function SkillTag({skill,type}){

return(

<span className={type === "found" ? "skillTag" : "missingTag"}>

{skill}

</span>

)

}

export default SkillTag