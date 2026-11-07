import FinalCallToAction from "./FinalCallToAction";
import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Pillars from "./Pillars";
import Safety from "./Safety";

function Landing() {
  return (
    <div className="relative min-h-screen bg-mist text-navy">
      <Header />

      <main>
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
