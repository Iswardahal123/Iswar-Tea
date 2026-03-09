export default async function handler(req, res) {

const GEMINI_KEYS = [
process.env.GEMINI_KEY_1,
process.env.GEMINI_KEY_2,
process.env.GEMINI_KEY_3
].filter(Boolean)

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

let currentKey = 0

try {

const { prompt } = req.body

for(let i=0;i<GEMINI_KEYS.length;i++){

const key = GEMINI_KEYS[currentKey]

const response = await fetch(`${GEMINI_URL}?key=${key}`,{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
contents:[{parts:[{text:prompt}]}]
})
})

const data = await response.json()

if(response.status === 429){
currentKey = (currentKey + 1) % GEMINI_KEYS.length
continue
}

return res.status(200).json(data)

}

res.status(500).json({error:"All API keys exhausted"})

} catch(err){
res.status(500).json({error:err.message})
}

}
