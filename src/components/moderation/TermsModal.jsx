import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsModal({ onAccepted }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    await base44.auth.updateMe({ terms_accepted: true, terms_accepted_at: new Date().toISOString() });
    onAccepted();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex flex-col items-center px-6 pt-12 pb-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield size={30} className="text-primary" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-center">Terms of Use</h1>
        <p className="text-muted-foreground text-sm text-center">
          Before continuing, please read and agree to our Terms of Use and Community Guidelines.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="bg-card border border-border rounded-2xl p-4 text-sm text-muted-foreground space-y-4">
          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">1. Acceptable Use</h2>
            <p>You agree to use this app only for lawful purposes. You must not post content that is offensive, harmful, harassing, or inappropriate.</p>
          </section>
          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">2. Zero Tolerance Policy</h2>
            <p>We have a zero-tolerance policy for objectionable content and abusive behavior. Any user found to be posting such content or engaging in abusive behavior will be removed from the platform immediately.</p>
          </section>
          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">3. User-Generated Content</h2>
            <p>You are solely responsible for content you post. By posting, you confirm that the content does not violate any laws or third-party rights. Content that is explicit, violent, hateful, or misleading is strictly prohibited.</p>
          </section>
          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">4. Reporting & Moderation</h2>
            <p>You can report any content or user that violates these terms. Our team reviews all reports and will take appropriate action, including removal of content and banning of users.</p>
          </section>
          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">5. Blocking</h2>
            <p>You may block any user who behaves abusively. Blocked users will not be able to interact with your content.</p>
          </section>
          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">6. Privacy</h2>
            <p>We collect and store data necessary to operate the app. We do not sell your personal data to third parties. By using the app you consent to our data practices.</p>
          </section>
          <section>
            <h2 className="font-heading font-semibold text-foreground mb-1">7. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.</p>
          </section>
        </div>
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
          By tapping "I Agree", you confirm you have read and accept these Terms of Use.
        </p>
      </div>
    </div>
  );
}