// All dates in IST (Asia/Kolkata, UTC+5:30)
export const istDate = (d = new Date()) =>
  d.toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric", timeZone:"Asia/Kolkata"});
export const istTime = (d = new Date()) =>
  d.toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit", timeZone:"Asia/Kolkata"});
