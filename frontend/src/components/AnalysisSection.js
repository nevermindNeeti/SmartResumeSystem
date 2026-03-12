import React from "react"
import SkillTag from "./SkillTag"
import SuggestionList from "./SuggestionList"

function AnalysisSection({data}){

return(

<div className="analysisPanel">

<h3>Detected Skills</h3>

<div className="skillsRow">
{data.detected_skills.map((s,i)=>(
<SkillTag key={i} skill={s} type="found"/>
))}
</div>

<h3>Missing Skills</h3>

<div className="skillsRow">
{data.missing_skills.map((s,i)=>(
<SkillTag key={i} skill={s} type="missing"/>
))}
</div>

<h3>Suggestions</h3>

<SuggestionList suggestions={data.suggestions}/>

</div>

)

}

export default AnalysisSection