import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-[512px] mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading font-bold text-lg">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[512px] mx-auto px-4 py-6 pb-20">
        <div className="prose prose-sm prose-invert max-w-none text-foreground">
          <p className="text-sm text-muted-foreground mb-6">
            <strong>StrongStreak</strong> · Last updated: March 29, 2026
          </p>

          <p className="mb-6 text-sm leading-relaxed">
            This Privacy Policy describes how Zod Al-Khair Company for Information Technology ("we", "us", or "our") collects, uses, and protects your information when you use the StrongStreak mobile application (the "App").
          </p>

          <p className="mb-6 text-sm leading-relaxed">
            By using StrongStreak, you agree to the collection and use of information in accordance with this policy.
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="font-heading font-semibold text-base mb-3">1. Information We Collect</h2>
              <p className="text-sm leading-relaxed mb-3">We collect the following types of information when you create an account and use the App:</p>
              <ul className="text-sm space-y-2 ml-4">
                <li><strong>Account Information:</strong> Full name, email address, display name, profile photo (avatar), and bio.</li>
                <li><strong>Health & Fitness Data:</strong> Weight entries (including optional photos), workout logs (duration, start and end times), and detailed set logs (exercise names, repetitions, weight, and RPE — Rate of Perceived Exertion).</li>
                <li><strong>User-Generated Content:</strong> Workout posts with captions and optional images, and notes you add to exercises or workouts.</li>
                <li><strong>Social Interaction Data:</strong> Follower and following relationships, group memberships, and post likes.</li>
                <li><strong>Workout Preferences:</strong> Custom workout split configurations and exercise details you create within the App.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">2. How We Use Your Information</h2>
              <p className="text-sm leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="text-sm space-y-2 ml-4">
                <li>Provide, operate, and maintain the StrongStreak App and its features.</li>
                <li>Allow you to track your fitness progress and view historical workout data.</li>
                <li>Enable social features such as sharing achievements, following other users, and participating in groups.</li>
                <li>Personalise your experience and improve the App's functionality.</li>
                <li>Communicate with you about updates, new features, or support-related matters.</li>
                <li>Ensure the security and integrity of the App.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">3. Data Sharing and Disclosure</h2>
              <p className="text-sm leading-relaxed mb-3">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following limited circumstances:</p>
              <ul className="text-sm space-y-2 ml-4">
                <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist in operating our App (e.g., cloud hosting, analytics), subject to confidentiality agreements.</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, regulation, or legal process.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">4. Data Retention</h2>
              <p className="text-sm leading-relaxed">We retain your personal data for as long as your account is active or as needed to provide you with our services. You may request deletion of your account and associated data at any time by contacting us at the email address below.</p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">5. Your Rights</h2>
              <p className="text-sm leading-relaxed mb-3">Depending on your location, you may have the following rights regarding your personal data:</p>
              <ul className="text-sm space-y-2 ml-4">
                <li>The right to access the personal data we hold about you.</li>
                <li>The right to request correction of inaccurate data.</li>
                <li>The right to request deletion of your personal data.</li>
                <li>The right to withdraw consent at any time where processing is based on consent.</li>
              </ul>
              <p className="text-sm leading-relaxed mt-3">To exercise any of these rights, please contact us at hamza@zod-alkhair.com.</p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">6. Children's Privacy</h2>
              <p className="text-sm leading-relaxed">StrongStreak is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.</p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">7. Security</h2>
              <p className="text-sm leading-relaxed">We take the security of your data seriously and implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.</p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">8. Changes to This Policy</h2>
              <p className="text-sm leading-relaxed">We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the "Last updated" date at the top of this page. We encourage you to review this policy periodically.</p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">9. Contact Us</h2>
              <p className="text-sm leading-relaxed mb-3">If you have any questions or concerns about this Privacy Policy, please contact us:</p>
              <div className="text-sm space-y-1 ml-4">
                <p><strong>Company:</strong> Zod Al-Khair Company for Information Technology</p>
                <p><strong>Email:</strong> hamza@zod-alkhair.com</p>
                <p><strong>App Support:</strong> notorious-peak-gym-flow.base44.app</p>
              </div>
            </section>

            <p className="text-xs text-muted-foreground mt-8 pt-4 border-t border-border">
              © 2026 Zod Al-Khair Company for Information Technology. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}