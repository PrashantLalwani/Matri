import "./styles/app.css";

export default function PrivacyPage() {
  return (
    <div style={{background:"#fff", minHeight:"100vh", fontFamily:"'DM Sans', sans-serif", color:"#1a1a1a"}}>

      {/* Top bar */}
      <div style={{borderBottom:"1px solid #e8e8e8", padding:"16px 24px", display:"flex", alignItems:"center", gap:8}}>
        <div style={{width:6, height:6, borderRadius:"50%", background:"var(--rose)", flexShrink:0}}/>
        <span style={{fontSize:12, fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", color:"var(--muted)"}}>Matri</span>
      </div>

      <div style={{maxWidth:640, margin:"0 auto", padding:"48px 24px 80px"}}>

        {/* Header */}
        <h1 style={{fontFamily:"'Cormorant Garamond', serif", fontSize:36, fontWeight:400, color:"#1a1a1a", marginBottom:6, lineHeight:1.2}}>
          Privacy Policy
        </h1>
        <p style={{fontSize:13, color:"#888", marginBottom:48}}>Last updated: June 2026</p>

        <hr style={{border:"none", borderTop:"1px solid #e8e8e8", marginBottom:40}}/>

        {/* Section */}
        <Section num="1" title="Who we are">
          <p>Matri is an AI-powered pregnancy companion app built to support mothers through their pregnancy journey. Matri is developed and operated by <strong>Prashant Lalwani</strong>, based in Bangalore, India.</p>
          <p>For any privacy-related questions, contact us at: <a href="mailto:prashantlalwani100@gmail.com">prashantlalwani100@gmail.com</a></p>
        </Section>

        <Section num="2" title="What data we collect">
          <SubLabel>Mandatory — required to use Matri</SubLabel>
          <ul>
            <li><strong>Account information</strong> — your name and email address via Google Sign-In</li>
            <li><strong>Pregnancy information</strong> — your due date and pregnancy week, so we can personalise your experience to where you are in your journey</li>
          </ul>

          <SubLabel>Optional — significantly enhances your experience</SubLabel>
          <ul>
            <li><strong>Prescriptions and medical documents</strong> — uploading these allows Matri to give you contextual, personalised guidance based on your actual health records</li>
            <li><strong>Lab reports</strong> — helps Matri track your health markers over time and flag anything worth discussing with your doctor</li>
            <li><strong>Medications</strong> — adding your medicines allows Matri to factor them into your AI conversations and send timely reminders</li>
            <li><strong>Additional health details</strong> — any other information you choose to share to make your experience more personalised</li>
          </ul>

          <p>We only collect information you actively provide. We do not collect location data, contacts, or any information in the background.</p>
        </Section>

        <Section num="3" title="How we use your data">
          <p>Your data is used exclusively to:</p>
          <ul>
            <li>Provide you with personalised pregnancy guidance</li>
            <li>Power the Matri AI companion with your health context</li>
            <li>Display your health records, medications, and lab results within the app</li>
            <li>Improve the accuracy and relevance of your experience</li>
          </ul>
          <Callout>We do not use your data for advertising. We do not sell your data. Ever.</Callout>
        </Section>

        <Section num="4" title="How your data is stored">
          <p>Your data is stored securely on encrypted, industry-standard cloud infrastructure. Access to your data is strictly limited to your account — no other user can access your information.</p>
        </Section>

        <Section num="5" title="AI and third-party services">
          <p>Matri uses third-party AI services to power the pregnancy companion chat. When you interact with the AI, relevant health context from your profile is shared to personalise your responses. We do not share your name, phone number, or any directly identifying information with any third-party service.</p>
          <p>We use Google Sign-In for authentication. Your use of Google Sign-In is subject to Google's privacy policy.</p>
        </Section>

        <Section num="6" title="Your rights">
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> your data — everything you've shared is visible within the app</li>
            <li><strong>Delete</strong> your data — use the "Delete my account" option in settings to permanently remove all your information from our servers</li>
            <li><strong>Withdraw consent</strong> — you may stop using Matri and request deletion of your data at any time by emailing <a href="mailto:prashantlalwani100@gmail.com">prashantlalwani100@gmail.com</a></li>
          </ul>
          <p>In accordance with India's Digital Personal Data Protection Act 2023, we are committed to handling your data responsibly and transparently.</p>
        </Section>

        <Section num="7" title="Data retention">
          <p>We retain your data for as long as your account is active. When you delete your account, all your personal data is permanently deleted within 48 hours.</p>
        </Section>

        <Section num="8" title="Children's privacy">
          <p>Matri is intended for use by adults aged 18 and above. We do not knowingly collect data from minors.</p>
        </Section>

        <Section num="9" title="Changes to this policy">
          <p>If we make significant changes to this privacy policy, we will notify you within the app. The date at the top of this page reflects the most recent update.</p>
        </Section>

        <Section num="10" title="Contact us" last>
          <p>For any privacy concerns, data requests, or questions:</p>
          <p><a href="mailto:prashantlalwani100@gmail.com">📧 prashantlalwani100@gmail.com</a></p>
        </Section>

        {/* Footer */}
        <div style={{marginTop:48, paddingTop:24, borderTop:"1px solid #e8e8e8", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{fontSize:12, color:"#aaa"}}>© {new Date().getFullYear()} Matri · Bangalore, India</span>
          <a href="/" style={{fontSize:12, color:"var(--rose)", textDecoration:"none", fontWeight:600}}>← Back to app</a>
        </div>

      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .priv-section { margin-bottom: 36px; }
        .priv-section-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
        .priv-num { font-size: 12px; font-weight: 700; color: #bbb; letter-spacing: 0.1em; flex-shrink: 0; width: 20px; }
        .priv-title { font-size: 15px; font-weight: 700; color: #1a1a1a; }
        .priv-section p { font-size: 14px; line-height: 1.8; color: #333; margin-bottom: 12px; }
        .priv-section ul { padding-left: 20px; margin: 8px 0 14px; }
        .priv-section li { font-size: 14px; line-height: 1.75; color: #333; margin-bottom: 8px; }
        .priv-section a { color: var(--rose); text-decoration: none; }
        .priv-section a:hover { text-decoration: underline; }
        .priv-sublabel { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin: 16px 0 8px; }
        .priv-callout { background: #fdf0f3; border-left: 3px solid var(--rose); padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #333; font-weight: 500; margin-top: 4px; }
        @media (max-width: 600px) {
          h1 { font-size: 28px !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ num, title, children, last }) {
  return (
    <div className="priv-section">
      <div className="priv-section-head">
        <span className="priv-num">{num}.</span>
        <span className="priv-title">{title}</span>
      </div>
      {children}
      {!last && <hr style={{border:"none", borderTop:"1px solid #f0f0f0", marginTop:28}}/>}
    </div>
  );
}

function SubLabel({ children }) {
  return <p className="priv-sublabel">{children}</p>;
}

function Callout({ children }) {
  return <div className="priv-callout">{children}</div>;
}
