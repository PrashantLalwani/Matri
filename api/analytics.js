export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).end();
    }
  
    const body = req.body;
  
    console.log("EVENT:", body);
  
    return res.status(200).json({
      success: true
    });
  }