import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function TermsModal({ onAccepted }) {
  const [loading, setLoading] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    await base44.auth.updateMe({ terms_accepted: true, terms_accepted_at: new Date().toISOString() });
    onAccepted();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex flex-col items-center px-6 pt-10 pb-4 gap-3">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield size={30} className="text-primary" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-center">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm text-center">
          Please read and agree to our Terms before using StrongStreak.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4" onScroll={handleScroll}>
        <div className="bg-card border border-border rounded-2xl p-4 text-sm text-muted-foreground space-y-4">

          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">1. Acceptance</h2>
            <p>By using StrongStreak, you agree to these Terms. If you do not agree, you may not use the App. You must be at least 13 years old to create an account.</p>
          </section>

          <section className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
            <h2 className="font-heading font-semibold text-destructive mb-1">2. Objectionable Content — Zero Tolerance</h2>
            <p className="mb-2">You must <strong className="text-foreground">not</strong> post or share content that is:</p>
            <ul className="space-y-1 ml-3 list-disc">
              <li>Hateful, racist, sexist, or discriminatory</li>
              <li>Sexually explicit or contains nudity</li>
              <li>Violent, threatening, or promotes self-harm</li>
              <li>Harassing, bullying, or intimidating to others</li>
              <li>Spam, misinformation, or impersonation</li>
              <li>Illegal under any applicable law</li>
            </ul>
            <p className="mt-2 font-semibold text-destructive">Violations result in immediate permanent account termination.</p>
          </section>

          <section className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
            <h2 className="font-heading font-semibold text-destructive mb-1">3. Abusive Users — Zero Tolerance</h2>
            <p className="mb-2">You must <strong className="text-foreground">not</strong>:</p>
            <ul className="space-y-1 ml-3 list-disc">
              <li>Harass, stalk, or threaten other users</li>
              <li>Create multiple accounts to evade a ban</li>
              <li>Attempt to hack or exploit the App</li>
              <li>Engage in any conduct that harms other users</li>
            </ul>
            <p className="mt-2 font-semibold text-destructive">Abusive users will be permanently banned. We may report behavior to law enforcement.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">4. Reporting & Moderation</h2>
            <p>You can report objectionable content or abusive users directly in the App. All reports are reviewed by our team. We aim to act on valid reports within 24 hours, including content removal and account termination where necessary.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">5. User Content</h2>
            <p>You are solely responsible for content you post. You retain ownership, but grant us a license to display it within the App. You confirm you have the rights to post any content you share.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">6. Blocking</h2>
            <p>You may block any user who behaves abusively. Blocked users cannot interact with your content.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">7. Privacy</h2>
            <p>Your use of the App is governed by our Privacy Policy. We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">8. Health Disclaimer</h2>
            <p>StrongStreak is a fitness tracking tool, not a substitute for professional medical advice. Consult a healthcare provider before starting any fitness program.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms, without prior notice.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">10. Contact</h2>
            <p>Questions or to report a violation: <strong className="text-foreground">hamza@zod-alkhair.com</strong></p>
          </section>

          <div className="pt-2 border-t border-border">
            <Link to="/terms" className="flex items-center gap-1.5 text-primary text-xs font-semibold">
              <ExternalLink size={12} />
              Read full Terms & Conditions
            </Link>
          </div>
        </div>

        {!scrolledToBottom && (
          <p className="text-center text-xs text-muted-foreground mt-3 animate-pulse">Scroll down to read all terms</p>
        )}
      </div>

      <div className="px-6 pb-8 pt-3 flex flex-col gap-3">
        <Button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-5 font-heading font-bold text-base"
        >
          {loading ? 'Saving...' : 'I Agree & Continue'}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          By tapping "I Agree", you confirm you are 13+ years old and accept these Terms & Conditions, including our zero-tolerance policy for objectionable content and abusive behavior.
        </p>
      </div>
    </div>
  );
}