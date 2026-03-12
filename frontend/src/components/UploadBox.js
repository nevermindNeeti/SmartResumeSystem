import React,{useState} from "react"

function UploadBox({setAnalysis}){

const [file,setFile] = useState(null)

const uploadResume = async ()=>{

const formData = new FormData()
formData.append("file",file)

const res = await fetch("http://localhost:5000/analyze_resume",{
method:"POST",
body:formData
})

const data = await res.json()

setAnalysis(data)

}

return(

<div className="uploadBox">

<h2>Upload your resume</h2>

<input type="file"
onChange={(e)=>setFile(e.target.files[0])}
/>

<button onClick={uploadResume}>
Analyze Resume
</button>

</div>

)

}

export default UploadBox