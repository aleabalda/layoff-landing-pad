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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        {error && (
          <p
            role="alert"
            className="mx-auto mt-2 max-w-6xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6"
          >
            We couldn't log you in: {error.message}
          </p>
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
