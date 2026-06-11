import "./styles/app.css";

export default function TosPage() {
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
          Terms of Service
        </h1>
        <p style={{fontSize:13, color:"#888", marginBottom:48}}>Last updated: June 2026</p>

        <hr style={{border:"none", borderTop:"1px solid #e8e8e8", marginBottom:40}}/>

        <Section num="1" title="About Matri">
          <p>Matri is an AI-powered pregnancy companion app designed to support and inform you through your pregnancy journey. Matri is developed and operated by <strong>Prashant Lalwani</strong>, based in Bangalore, India.</p>
          <Callout>Matri is not a medical service. Content within the app — including AI-generated responses — is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for any medical concerns.</Callout>
        </Section>

        <Section num="2" title="Eligibility">
          <p>By using Matri, you confirm that you are:</p>
          <ul>
            <li>At least <strong>18 years of age</strong></li>
            <li>Pregnant, postpartum, or actively trying to conceive</li>
            <li>Using the app for personal, non-commercial purposes</li>
          </ul>
          <p>If you do not meet these criteria, please do not use Matri.</p>
        </Section>

        <Section num="3" title="Your responsibilities">
          <p>When using Matri, you agree to:</p>
          <ul>
            <li>Provide accurate information about yourself and your pregnancy</li>
            <li>Keep your account credentials secure and not share them with others</li>
            <li>Use the app only for its intended purpose — personal pregnancy support</li>
            <li><strong>Not use Matri in place of emergency medical services.</strong> If you are experiencing a medical emergency, call your local emergency number immediately.</li>
            <li>Not upload content that is false, harmful, or unrelated to your own health</li>
          </ul>
        </Section>

        <Section num="4" title="Health disclaimer">
          <p>Matri uses artificial intelligence to provide personalised guidance based on the information you share. This guidance is:</p>
          <ul>
            <li>Informational only — not medical advice</li>
            <li>Based on general pregnancy knowledge and your provided health context</li>
            <li>Not reviewed in real time by a licensed medical professional</li>
          </ul>
          <p>You should always verify AI-generated content with your doctor, midwife, or qualified healthcare provider before making any health decisions.</p>
          <Callout>Matri is not liable for any health outcomes resulting from decisions made based on information provided within the app.</Callout>
        </Section>

        <Section num="5" title="Data and device access">
          <p>Your use of Matri is also governed by our <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, which describes in detail what data we collect, how we use it, and your rights as a user.</p>
          <p>By using Matri, you consent to the collection and use of your data as described in our Privacy Policy.</p>
          <p><strong>Camera and photo library:</strong> Matri requests access to your device camera and photo library solely to allow you to photograph and upload documents such as prescriptions, lab reports, and scans. Photos are stored securely and are only accessible to you. Matri does not access your camera or photos at any other time or for any other purpose.</p>
        </Section>

        <Section num="6" title="Account deletion">
          <p>You may delete your account at any time from within the app. Upon deletion, all your personal data — including health records, prescriptions, lab reports, and journal entries — will be permanently removed from our servers within 48 hours.</p>
          <p>You may also request account deletion by emailing <a href="mailto:prashantlalwani100@gmail.com">prashantlalwani100@gmail.com</a>.</p>
        </Section>

        <Section num="7" title="Changes to these terms">
          <p>We may update these Terms of Service from time to time. When we make significant changes, we will notify you within the app. The date at the top of this page reflects the most recent update.</p>
          <p>Your continued use of Matri after any changes constitutes your acceptance of the revised terms.</p>
        </Section>

        <Section num="8" title="Governing law">
          <p>These terms are governed by and construed in accordance with the laws of India. Any disputes arising from your use of Matri shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.</p>
        </Section>

        <Section num="9" title="Contact us" last>
          <p>For any questions about these terms, please contact our grievance officer:</p>
          <p><strong>Prashant Lalwani</strong><br/>Bangalore, India</p>
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

function Callout({ children }) {
  return <div className="priv-callout">{children}</div>;
}
