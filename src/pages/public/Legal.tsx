import { useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useDocumentHead } from '../../lib/seo'

export default function Legal() {
  const { doc } = useParams()
  const { t } = useI18n()
  if (doc === 'refund') return <RefundPolicy />
  const key = doc === 'privacy' ? 'privacyBody' : 'termsBody'
  const title = doc === 'privacy' ? t('privacy') : t('terms')
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
