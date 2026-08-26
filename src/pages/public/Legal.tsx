import { useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useDocumentHead } from '../../lib/seo'

export default function Legal() {
  const { doc } = useParams()
  const { t } = useI18n()
  if (doc === 'refund') return <RefundPolicy />
  if (doc === 'privacy') return <PrivacyPolicy />
  const key = 'termsBody'
  const title = t('terms')
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, marginBottom: 12 }}>{title}</h1>
      <div style={{ whiteSpace: 'pre-wrap', color: '#334', lineHeight: 1.6, fontSize: 15 }}>{t(key)}</div>
    </div>
  )
}

const h2: React.CSSProperties = { fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 18, margin: '28px 0 10px' }
const p: React.CSSProperties = { color: '#33415A', lineHeight: 1.7, fontSize: 15, margin: '0 0 12px' }
const ul: React.CSSProperties = { margin: '0 0 12px', paddingLeft: 22, color: '#33415A', lineHeight: 1.7, fontSize: 15 }
const Li = ({ children }: { children: React.ReactNode }) => <li style={{ marginBottom: 6 }}>{children}</li>

function RefundPolicy() {
  useDocumentHead({ title: 'Refund & Cancellation Policy · Asirem Academy', description: 'Asirem Academy refund and cancellation terms for courses, live programs, memberships and payment plans.' })
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 28, marginBottom: 6 }}>Refund &amp; Cancellation Policy</h1>
      <p style={{ ...p, fontWeight: 700, color: 'var(--navy-800)', marginBottom: 18 }}>Effective Date: August 21, 2026</p>

      <p style={p}>We want every student to understand our refund and cancellation terms before purchasing a course. By purchasing or enrolling in any course, program, workshop, training, membership, or educational product offered by us, you acknowledge and agree to this Refund &amp; Cancellation Policy.</p>

      <h2 style={h2}>1. Three-Business-Day Cancellation Period</h2>
      <p style={p}>Students may request cancellation and a full refund within <strong>three (3) business days of the original purchase date</strong>, provided that:</p>
      <ul style={ul}>
        <Li>No certificate of completion has been issued;</Li>
        <Li>The student has not completed more than 20% of the course;</Li>
        <Li>The student has not downloaded a substantial portion of downloadable course materials; and</Li>
        <Li>The account has not been used in a manner indicating substantial consumption of the course.</Li>
      </ul>
      <p style={p}>Requests must be submitted in writing within the applicable cancellation period.</p>

      <h2 style={h2}>2. Digital Course Access</h2>
      <p style={p}>Because our courses contain digital educational materials that may be accessed immediately after purchase, refund eligibility is limited once a substantial portion of the educational content has been accessed or consumed.</p>
      <p style={p}>After the three-business-day cancellation period, <strong>course purchases are generally nonrefundable</strong>, except as specifically stated in this policy or required by applicable law.</p>

      <h2 style={h2}>3. No Refund After Substantial Course Use</h2>
      <p style={p}>A refund will not normally be issued when:</p>
      <ul style={ul}>
        <Li>More than 20% of the course has been completed or accessed;</Li>
        <Li>A certificate of completion has been issued;</Li>
        <Li>Substantial downloadable materials have been downloaded;</Li>
        <Li>The student fails to complete the course;</Li>
        <Li>The student changes their mind after the refund period;</Li>
        <Li>The student does not have sufficient time to complete the course;</Li>
        <Li>The student purchases the wrong course without contacting us during the cancellation period; or</Li>
        <Li>The student is dissatisfied because a particular employment, income, certification, licensing, or examination result was not achieved.</Li>
      </ul>

      <h2 style={h2}>4. Live Classes and Cohort Programs</h2>
      <p style={p}>For scheduled live classes, workshops, or cohort-based programs, cancellation requests must be received before the applicable cancellation deadline stated during enrollment.</p>
      <p style={p}>Once a live course or scheduled cohort has begun, amounts already attributable to classes, services, materials, or instruction provided may be nonrefundable, subject to applicable law.</p>
      <p style={p}>If we cancel a class or program and cannot provide a reasonable replacement or rescheduled option, affected students will be eligible for a refund of the amount paid for the portion of the program that was not provided.</p>

      <h2 style={h2}>5. Memberships and Subscription Programs</h2>
      <p style={p}>If a course is sold through a recurring subscription or membership, cancellation stops future renewals.</p>
      <p style={p}>Cancellation of a subscription does <strong>not automatically generate a refund for previously processed payments</strong>. Students remain responsible for charges incurred before cancellation unless otherwise required by law.</p>

      <h2 style={h2}>6. Payment Plans</h2>
      <p style={p}>Students purchasing a course through a payment plan remain responsible for the agreed payments unless the enrollment is properly canceled under this policy.</p>
      <p style={p}>Stopping attendance, failing to log in, or failing to complete coursework does not automatically cancel a payment obligation.</p>

      <h2 style={h2}>7. Duplicate or Incorrect Charges</h2>
      <p style={p}>Duplicate payments or confirmed billing errors will be corrected and refunded when appropriate.</p>
      <p style={p}>Students should contact us promptly with the purchaser's name, email address, transaction information, and description of the billing issue.</p>

      <h2 style={h2}>8. Chargebacks and Payment Disputes</h2>
      <p style={p}>Students are encouraged to contact us before initiating a chargeback so that we have an opportunity to investigate and resolve any billing or access issue.</p>
      <p style={p}>Submitting a chargeback does not automatically cancel contractual obligations associated with an enrollment.</p>
      <p style={p}>We reserve the right to provide the payment processor or financial institution with relevant transaction records, including enrollment records, acceptance of terms, login records, course-access records, completed lessons, downloaded materials, and communications relating to the transaction.</p>

      <h2 style={h2}>9. Educational Disclaimer</h2>
      <p style={p}>Our tax courses are provided for <strong>education and professional development purposes</strong>.</p>
      <p style={p}>Enrollment does not guarantee:</p>
      <ul style={ul}>
        <Li>Employment;</Li>
        <Li>A particular salary or level of income;</Li>
        <Li>Successful completion of any government or professional examination;</Li>
        <Li>Acceptance by the Internal Revenue Service or any state agency;</Li>
        <Li>Professional licensing or credentialing; or</Li>
        <Li>Business or financial success.</Li>
      </ul>
      <p style={p}>Students remain responsible for satisfying any federal, state, IRS, licensing, registration, continuing-education, or professional requirements applicable to their individual circumstances.</p>

      <h2 style={h2}>10. Refund Processing</h2>
      <p style={p}>Approved refunds will be returned, whenever reasonably possible, to the original payment method.</p>
      <p style={p}>Processing times may vary depending on the payment processor, bank, or financial institution.</p>

      <h2 style={h2}>11. Promotional and Discounted Purchases</h2>
      <p style={p}>Promotional pricing, coupons, scholarships, discounts, bundles, and special offers are subject to the same refund conditions unless different terms are expressly disclosed before purchase.</p>

      <h2 style={h2}>12. Policy Acceptance</h2>
      <p style={p}>By completing a purchase, the student acknowledges that they had an opportunity to review this Refund &amp; Cancellation Policy before payment and agrees to its terms.</p>
      <p style={p}>This policy is intended to operate to the fullest extent permitted by applicable law. If applicable federal or Florida law provides a consumer with rights greater than those stated here, the applicable law will control.</p>
    </div>
  )
}

function PrivacyPolicy() {
  useDocumentHead({ title: 'Privacy Policy · Asirem Academy', description: 'How Asirem Academy collects, uses, discloses, stores, and protects your personal information.' })
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 28, marginBottom: 6 }}>Privacy Policy</h1>
      <p style={{ ...p, fontWeight: 700, color: 'var(--navy-800)', margin: '0 0 4px' }}>Effective Date: August 21, 2026</p>
      <p style={{ ...p, fontWeight: 700, color: 'var(--navy-800)', marginBottom: 18 }}>Last Updated: August 21, 2026</p>

      <p style={p}>Asirem Academy (“Company,” “we,” “us,” or “our”) respects your privacy and is committed to protecting the personal information of students, customers, website visitors, and other users of our educational services.</p>
      <p style={p}>This Privacy Policy explains how we collect, use, disclose, store, and protect information when you visit our website, create an account, enroll in a course, make a purchase, communicate with us, or otherwise use our services.</p>
      <p style={p}>By accessing or using our website or services, you acknowledge the practices described in this Privacy Policy.</p>

      <h2 style={h2}>1. Information We Collect</h2>
      <p style={p}>We may collect information that you voluntarily provide to us, including:</p>
      <ul style={ul}>
        <Li>First and last name;</Li>
        <Li>Email address;</Li>
        <Li>Telephone number;</Li>
        <Li>Billing address;</Li>
        <Li>Mailing address;</Li>
        <Li>Username and account information;</Li>
        <Li>Course enrollment information;</Li>
        <Li>Course progress and completion records;</Li>
        <Li>Quiz, assignment, and assessment results;</Li>
        <Li>Certificates earned through our courses;</Li>
        <Li>Communications with our instructors or support staff;</Li>
        <Li>Customer-service inquiries;</Li>
        <Li>Transaction and purchase information; and</Li>
        <Li>Other information you voluntarily submit through our website.</Li>
      </ul>
      <h3 style={{ ...h2, fontSize: 16 }}>Payment Information</h3>
      <p style={p}>Payments may be processed through third-party payment processors.</p>
      <p style={p}>We generally do not directly store complete credit-card or debit-card numbers when those payments are processed through a third-party payment provider.</p>
      <p style={p}>Payment processing is also subject to the privacy and security policies of the applicable payment processor.</p>

      <h2 style={h2}>2. Information Collected Automatically</h2>
      <p style={p}>When you use our website or educational platform, certain information may be collected automatically, including:</p>
      <ul style={ul}>
        <Li>IP address;</Li>
        <Li>Browser type;</Li>
        <Li>Device type;</Li>
        <Li>Operating system;</Li>
        <Li>Pages viewed;</Li>
        <Li>Dates and times of visits;</Li>
        <Li>Course activity;</Li>
        <Li>Login activity;</Li>
        <Li>Referring websites;</Li>
        <Li>Approximate geographic location;</Li>
        <Li>Cookies and similar technologies; and</Li>
        <Li>Website interaction and analytics information.</Li>
      </ul>
      <p style={p}>We may use this information to operate our website, maintain security, understand student engagement, improve our courses, and evaluate the performance of our services.</p>

      <h2 style={h2}>3. Cookies and Similar Technologies</h2>
      <p style={p}>Our website may use cookies, pixels, analytics tools, and similar technologies.</p>
      <p style={p}>These technologies may be used to:</p>
      <ul style={ul}>
        <Li>Keep users logged into their accounts;</Li>
        <Li>Remember user preferences;</Li>
        <Li>Maintain website security;</Li>
        <Li>Measure website traffic;</Li>
        <Li>Analyze how users interact with courses and website content;</Li>
        <Li>Improve website performance;</Li>
        <Li>Measure advertising effectiveness; and</Li>
        <Li>Deliver or evaluate marketing campaigns.</Li>
      </ul>
      <p style={p}>Depending on the technologies used on our website, third parties such as analytics providers, advertising platforms, hosting companies, course-platform providers, or payment processors may also use cookies or similar technologies.</p>
      <p style={p}>Users may be able to control certain cookies through their browser settings or any cookie-consent tools provided on our website.</p>

      <h2 style={h2}>4. How We Use Personal Information</h2>
      <p style={p}>We may use information we collect to:</p>
      <ul style={ul}>
        <Li>Create and administer student accounts;</Li>
        <Li>Process course registrations;</Li>
        <Li>Process purchases and payments;</Li>
        <Li>Provide access to courses and educational materials;</Li>
        <Li>Track course progress;</Li>
        <Li>Administer quizzes, assignments, and assessments;</Li>
        <Li>Issue course-completion certificates;</Li>
        <Li>Provide customer support;</Li>
        <Li>Respond to inquiries;</Li>
        <Li>Send transactional emails;</Li>
        <Li>Send important notices about courses or accounts;</Li>
        <Li>Prevent fraud and unauthorized access;</Li>
        <Li>Protect our systems and users;</Li>
        <Li>Maintain business and accounting records;</Li>
        <Li>Improve our courses, website, and educational services;</Li>
        <Li>Conduct internal analytics;</Li>
        <Li>Promote our courses and services where permitted;</Li>
        <Li>Comply with applicable laws and legal obligations; and</Li>
        <Li>Enforce our agreements, policies, and Terms &amp; Conditions.</Li>
      </ul>

      <h2 style={h2}>5. Email and Marketing Communications</h2>
      <p style={p}>Students and customers may receive transactional communications relating to purchases, accounts, course access, scheduled classes, certificates, security, or administrative matters.</p>
      <p style={p}>Where permitted by law, we may also send promotional emails concerning courses, workshops, programs, products, or services.</p>
      <p style={p}>You may unsubscribe from promotional emails by using the unsubscribe link contained in those communications.</p>
      <p style={p}>Unsubscribing from promotional communications will not necessarily prevent you from receiving essential transactional or account-related communications.</p>

      <h2 style={h2}>6. How We Share Information</h2>
      <p style={p}>We do not sell personal information for money as part of our ordinary business operations.</p>
      <p style={p}>We may disclose information to service providers that help us operate our business, including providers of:</p>
      <ul style={ul}>
        <Li>Website hosting;</Li>
        <Li>Learning-management systems;</Li>
        <Li>Cloud storage;</Li>
        <Li>Email delivery;</Li>
        <Li>Payment processing;</Li>
        <Li>Customer support;</Li>
        <Li>Analytics;</Li>
        <Li>Cybersecurity;</Li>
        <Li>Advertising and marketing;</Li>
        <Li>Accounting; and</Li>
        <Li>Other technology or professional services.</Li>
      </ul>
      <p style={p}>These service providers may process information only as necessary to provide their services to us, subject to their respective contractual and legal obligations.</p>
      <p style={p}>We may also disclose information when reasonably necessary to:</p>
      <ul style={ul}>
        <Li>Comply with applicable law;</Li>
        <Li>Respond to a subpoena, court order, or lawful governmental request;</Li>
        <Li>Protect our legal rights;</Li>
        <Li>Investigate fraud;</Li>
        <Li>Prevent security threats;</Li>
        <Li>Enforce our agreements;</Li>
        <Li>Protect our students or customers; or</Li>
        <Li>Complete a merger, acquisition, restructuring, financing, or sale of all or part of our business.</Li>
      </ul>

      <h2 style={h2}>7. Advertising and Analytics</h2>
      <p style={p}>We may use third-party analytics or advertising technologies to understand website traffic, evaluate advertising campaigns, or promote our educational services.</p>
      <p style={p}>Depending on the technology used, these providers may receive information about your browser, device, IP address, website activity, or interactions with advertisements.</p>
      <p style={p}>Where required by applicable law, users will be provided with appropriate choices concerning targeted advertising or related tracking technologies.</p>

      <h2 style={h2}>8. Student Records</h2>
      <p style={p}>We may maintain records concerning:</p>
      <ul style={ul}>
        <Li>Enrollment;</Li>
        <Li>Course access;</Li>
        <Li>Progress;</Li>
        <Li>Assignments;</Li>
        <Li>Examination or quiz results;</Li>
        <Li>Certificates;</Li>
        <Li>Payments;</Li>
        <Li>Communications; and</Li>
        <Li>Account activity.</Li>
      </ul>
      <p style={p}>These records may be retained for legitimate educational, administrative, fraud-prevention, accounting, tax, legal, and business purposes.</p>

      <h2 style={h2}>9. Data Retention</h2>
      <p style={p}>We retain personal information for as long as reasonably necessary to:</p>
      <ul style={ul}>
        <Li>Provide our services;</Li>
        <Li>Maintain student records;</Li>
        <Li>Fulfill contractual obligations;</Li>
        <Li>Maintain financial and tax records;</Li>
        <Li>Resolve disputes;</Li>
        <Li>Prevent fraud;</Li>
        <Li>Maintain security;</Li>
        <Li>Enforce agreements; and</Li>
        <Li>Comply with applicable laws.</Li>
      </ul>
      <p style={p}>Information that is no longer reasonably necessary may be deleted, anonymized, or securely disposed of.</p>

      <h2 style={h2}>10. Data Security</h2>
      <p style={p}>We use reasonable administrative, technical, and organizational safeguards designed to protect personal information from unauthorized access, disclosure, alteration, destruction, or misuse.</p>
      <p style={p}>These measures may include access controls, password protections, encryption, secure hosting, monitoring, backups, and restrictions on access to personal information.</p>
      <p style={p}>However, no Internet transmission, electronic storage system, or security system can be guaranteed to be completely secure.</p>
      <p style={p}>Students are responsible for maintaining the confidentiality of their account passwords and should notify us promptly if they suspect unauthorized access to their accounts.</p>

      <h2 style={h2}>11. Data Breach Notification</h2>
      <p style={p}>If we become aware of a security incident involving personal information, we will investigate the incident and provide notices as required by applicable federal or state law.</p>

      <h2 style={h2}>12. Your Privacy Choices</h2>
      <p style={p}>Subject to applicable law and reasonable identity verification, you may contact us to request that we:</p>
      <ul style={ul}>
        <Li>Confirm whether we maintain personal information about you;</Li>
        <Li>Provide access to certain information associated with your account;</Li>
        <Li>Correct inaccurate information;</Li>
        <Li>Delete certain personal information;</Li>
        <Li>Update your contact information;</Li>
        <Li>Stop sending promotional emails; or</Li>
        <Li>Address questions concerning our privacy practices.</Li>
      </ul>
      <p style={p}>Certain information may need to be retained even after a deletion request because of legal, accounting, educational-record, fraud-prevention, security, contractual, or other legitimate business requirements.</p>

      <h2 style={h2}>13. Do Not Sell or Share Requests</h2>
      <p style={p}>If our privacy practices become subject to a law providing a right to opt out of certain sales, sharing, targeted advertising, or profiling activities, eligible consumers may exercise those rights through the contact method identified below or another mechanism provided on our website.</p>
      <p style={p}>We will process qualifying requests in accordance with applicable law.</p>

      <h2 style={h2}>14. Children’s Privacy</h2>
      <p style={p}>Our tax-education courses and services are intended primarily for adults and individuals preparing for professional or educational activities.</p>
      <p style={p}>Our services are not directed to children under 13, and we do not knowingly collect personal information online from children under 13 without appropriate parental consent.</p>
      <p style={p}>If we learn that personal information from a child under 13 has been collected improperly, we will take reasonable steps to delete it.</p>

      <h2 style={h2}>15. Social Media and Third-Party Websites</h2>
      <p style={p}>Our website may contain links to third-party websites, social-media platforms, payment providers, or other external services.</p>
      <p style={p}>We do not control the privacy practices of those third parties.</p>
      <p style={p}>Information provided directly to a third-party service is governed by that service's own privacy policy.</p>

      <h2 style={h2}>16. Course Platforms and Technology Providers</h2>
      <p style={p}>Our educational services may rely on third-party technology platforms to deliver video lessons, assessments, live classes, communications, certificates, payments, or other functionality.</p>
      <p style={p}>Those providers may process personal information on our behalf or independently in accordance with their own terms and privacy policies.</p>

      <h2 style={h2}>17. Tax Information Disclaimer</h2>
      <p style={p}>Our courses provide tax education and training.</p>
      <p style={p}>Unless a specific service expressly requires it, <strong>students should not submit Social Security numbers, taxpayer identification numbers, tax returns, bank-account credentials, client tax documents, or other highly sensitive taxpayer information through ordinary course assignments, discussion boards, chats, emails, or support forms.</strong></p>
      <p style={p}>Students participating in practice exercises should use fictional, redacted, or instructor-provided sample information unless specifically instructed otherwise through an approved secure process.</p>

      <h2 style={h2}>18. International Users</h2>
      <p style={p}>Our business is operated from the United States.</p>
      <p style={p}>If you access our services from outside the United States, information may be processed or stored in the United States or other locations where our service providers operate.</p>
      <p style={p}>Applicable privacy protections may differ from those in your country of residence.</p>

      <h2 style={h2}>19. Changes to This Privacy Policy</h2>
      <p style={p}>We may revise this Privacy Policy from time to time to reflect changes in our services, technology, business practices, or applicable law.</p>
      <p style={p}>The updated version will be posted on our website with a revised “Last Updated” date.</p>
      <p style={p}>Material changes may also be communicated through email, account notices, or other appropriate means when required.</p>

      <h2 style={h2}>20. Contact Us</h2>
      <p style={p}>Questions, concerns, or privacy requests may be submitted to:</p>
      <p style={{ ...p, marginBottom: 4 }}><strong>Asirem Academy</strong></p>
      <p style={{ ...p, margin: '0 0 4px' }}><strong>Email:</strong> info@asiremacademy.com</p>
      <p style={{ ...p, margin: '0 0 4px' }}><strong>Website:</strong> https://asiremacademy.com</p>
      <p style={{ ...p, margin: '0 0 12px' }}><strong>Mailing Address:</strong> 1821 S. Dixie Highway, Pompano Beach, FL 33060</p>
      <p style={p}>Please include sufficient information to allow us to identify your account and respond to your request.</p>
    </div>
  )
}
