export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS,DELETE');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');if(req.method==='OPTIONS'){res.status(200).end();return;}
    if (req.method !== "POST") {
      return res.status(405).end();
    }
  
    const body = req.body;
  
    console.log("EVENT:", body);
  
    return res.status(200).json({
      success: true
    });
  }