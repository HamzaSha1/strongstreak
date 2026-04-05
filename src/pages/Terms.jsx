import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-[512px] mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading font-bold text-lg">Terms & Conditions</h1>
        </div>
      </div>

      <div className="max-w-[512px] mx-auto px-4 py-6 pb-20">
        <div className="prose prose-sm prose-invert max-w-none text-foreground">
          <p className="text-sm text-muted-foreground mb-6">
            <strong>StrongStreak</strong> · Last updated: April 5, 2026
          </p>

          <p className="mb-6 text-sm leading-relaxed">
            By creating an account and using StrongStreak, you agree to be bound by these Terms and Conditions ("Terms"). Please read them carefully before using the App. If you do not agree, you may not use StrongStreak.
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="font-heading font-semibold text-base mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed">
                These Terms constitute a legally binding agreement between you and Zod Al-Khair Company for Information Technology ("we", "us", or "our") governing your use of the StrongStreak mobile application. By tapping "I Agree" or by accessing and using the App, you confirm that you are at least 13 years of age and agree to these Terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">2. User Accounts</h2>
              <p className="text-sm leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and truthful information when creating your account and to update it as necessary.
              </p>
            </section>

            <section className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4">
              <h2 className="font-heading font-semibold text-base mb-3 text-destructive">3. Objectionable Content — Zero Tolerance Policy</h2>
              <p className="text-sm leading-relaxed mb-3">
                StrongStreak has a <strong>zero-tolerance policy</strong> for objectionable content and abusive behavior. You agree that you will <strong>not</strong> post, share, upload, or transmit any content that:
              </p>
              <ul className="text-sm space-y-2 ml-4 list-disc">
                <li>Is hateful, racist, sexist, or discriminatory based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin.</li>
                <li>Is sexually explicit, pornographic, or contains nudity.</li>
                <li>Promotes, glorifies, or depicts violence, self-harm, eating disorders, or dangerous activities.</li>
                <li>Harasses, bullies, threatens, or intimidates other users.</li>
                <li>Contains spam, misinformation, or deceptive content.</li>
                <li>Violates the intellectual property rights of others.</li>
                <li>Involves impersonation of any person or entity.</li>
                <li>Is illegal under applicable laws or regulations.</li>
              </ul>
              <p className="text-sm leading-relaxed mt-3 font-semibold">
                Violations of this policy will result in immediate content removal and permanent account termination without notice.
              </p>
            </section>

            <section className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4">
              <h2 className="font-heading font-semibold text-base mb-3 text-destructive">4. Abusive Users — Zero Tolerance Policy</h2>
              <p className="text-sm leading-relaxed mb-3">
                We have a <strong>zero-tolerance policy</strong> for abusive users. You agree not to:
              </p>
              <ul className="text-sm space-y-2 ml-4 list-disc">
                <li>Harass, stalk, threaten, or abuse any other user of the App.</li>
                <li>Engage in coordinated harassment or pile-ons against other users.</li>
                <li>Create multiple accounts to evade a ban or suspension.</li>
                <li>Attempt to hack, exploit, or interfere with the App or other users' accounts.</li>
                <li>Engage in any conduct that restricts or inhibits any other user's use or enjoyment of the App.</li>
              </ul>
              <p className="text-sm leading-relaxed mt-3 font-semibold">
                Abusive users will be permanently banned from StrongStreak. We reserve the right to report abusive behavior to law enforcement where applicable.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">5. Content Moderation & Reporting</h2>
              <p className="text-sm leading-relaxed">
                We provide in-app tools to report objectionable content or abusive users. All reports are reviewed by our moderation team. We reserve the right to remove any content and terminate any account that violates these Terms, at our sole discretion and without prior notice. We aim to act on valid reports within 24 hours.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">6. User-Generated Content</h2>
              <p className="text-sm leading-relaxed">
                You retain ownership of content you post. By posting content on StrongStreak, you grant us a non-exclusive, worldwide, royalty-free license to display and distribute that content within the App. You represent and warrant that you have all rights necessary to post such content.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">7. Privacy</h2>
              <p className="text-sm leading-relaxed">
                Your use of the App is also governed by our <strong>Privacy Policy</strong>, which is incorporated into these Terms by reference. By using StrongStreak, you consent to the collection and use of your data as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">8. Disclaimers</h2>
              <p className="text-sm leading-relaxed">
                StrongStreak is a fitness tracking tool and is not a substitute for professional medical advice. Always consult a qualified healthcare provider before starting any fitness program. We are not responsible for any injury or health issues arising from use of the App.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">9. Termination</h2>
              <p className="text-sm leading-relaxed">
                We reserve the right to suspend or permanently terminate your account at any time, with or without notice, if you violate these Terms or engage in any conduct we deem harmful to other users or the App.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">10. Changes to These Terms</h2>
              <p className="text-sm leading-relaxed">
                We may update these Terms from time to time. Continued use of the App after changes are posted constitutes your acceptance of the revised Terms. We will notify you of significant changes via the App.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-base mb-3">11. Contact Us</h2>
              <p className="text-sm leading-relaxed mb-2">
                For questions, concerns, or to report a violation:
              </p>
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