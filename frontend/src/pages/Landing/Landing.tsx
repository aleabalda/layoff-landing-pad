import { useAuth0 } from "@auth0/auth0-react";
import FinalCallToAction from "./FinalCallToAction";
import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Pillars from "./Pillars";
import Safety from "./Safety";

function Landing() {
  const { error } = useAuth0();

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />

      <main>
        {error && (
          <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
            <p
              role="alert"
              className="rounded-2xl border border-clay/30 bg-white px-5 py-3 text-sm text-clay-dark"
            >
              We couldn't log you in: {error.message}
            </p>
          </div>
        )}

        <Hero />
        <Pillars />
        <HowItWorks />
        <Safety />
        <FinalCallToAction />
      </main>

      <Footer />
    </div>
  );
}

export default Landing;
