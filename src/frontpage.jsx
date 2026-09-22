import "./FrontPage.css";

function FrontPage({ onHospitalClick, onCollectorClick, onAdminClick }) {
  return (
    <div className="landing-page">

      {/* NAVBAR */} 
      <header className="navbar">
        <div className="brand">
          <div className="brand-logo">✚</div>

          <div>
            <h2>MediSort</h2>
            <span>Smart Medical Waste Management</span>
          </div>
        </div>

        <nav>
          <a href="#home" className="active">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#impact">Impact</a>
          <a href="#contact">Contact</a>
        </nav>

        <button
          className="nav-button"
          onClick={() =>
            document
              .getElementById("roles")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Get Started
        </button>
      </header>


      {/* HERO */}
      <main id="home">

        <section className="hero">

          <div className="hero-left">

            <div className="tagline">
              🌿 Safe Hospitals
              <span>|</span>
              Clean Communities
              <span>|</span>
              Greener Tomorrow
            </div>

            <h1>
              Manage Medical
              <br />
              Waste <span>Smarter</span>
            </h1>

            <p>
              MediSort is a unified platform for hospitals,
              waste collectors and authorities to ensure safe,
              efficient and sustainable medical waste management.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-button"
                onClick={() =>
                  document
                    .getElementById("roles")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Get Started →
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore How It Works
              </button>

            </div>

          </div>


          {/* HERO ILLUSTRATION */}
          <div className="hero-right">

            <div className="hospital-circle">

              <div className="hospital-building">

                <div className="hospital-cross">✚</div>

                <h2>HOSPITAL</h2>

                <div className="hospital-windows">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

              </div>

              <div className="trees">
                🌳 🌳 🌳
              </div>

            </div>

            <div className="quote">
              “Proper Waste
              <br />
              Management
              <br />
              Saves Lives”
            </div>

            <div className="truck">🚛</div>

            <div className="waste-bins">
              <div className="bin yellow">☣</div>
              <div className="bin red">☣</div>
              <div className="bin white">⚠</div>
              <div className="bin blue">♻</div>
              <div className="bin black">▣</div>
            </div>

          </div>

        </section>


        {/* ROLES */}
        <section className="roles" id="roles">

          <RoleCard
            icon="🏥"
            title="Hospital"
            text="Manage Waste Records"
            type="hospital"
            onClick={onHospitalClick}
          />

         
<RoleCard
  icon="🚚"
  title="Collector"
  text="View Pickups & Routes"
  type="collector"
  onClick={onCollectorClick}
/>
          <RoleCard
            icon="👤"
            title="Admin"
            text="Monitor & Manage"
            type="admin"
            onClick={onAdminClick}
          />

        </section>


        {/* IMPACT */}
        <section className="impact-strip" id="impact">

          <ImpactItem
            icon="🛡️"
            title="Safer"
            text="Hospitals"
          />

          <ImpactItem
            icon="👥"
            title="Cleaner"
            text="Communities"
          />

          <ImpactItem
            icon="🍃"
            title="Reduced"
            text="Health Risks"
          />

          <ImpactItem
            icon="📊"
            title="Data Driven"
            text="Decisions"
          />

        </section>


        {/* HOW IT WORKS */}
        <section className="how-section" id="features">

          <div className="how-header">
            <h2>How MediSort Works?</h2>

            <p>
              From Hospital to a Healthier Tomorrow
            </p>
          </div>


          <div className="steps">

            <Step
              number="1"
              icon="🏥"
              title="Segregate"
              subtitle="at Source"
              text="Hospitals segregate waste into colour-coded categories."
            />

            <div className="arrow">→</div>

            <Step
              number="2"
              icon="🚚"
              title="Collect"
              subtitle="Efficiently"
              text="Collectors pick up waste as per schedule."
            />

            <div className="arrow">→</div>

            <Step
              number="3"
              icon="🏭"
              title="Treat"
              subtitle="Safely"
              text="Waste is sent to authorized treatment facilities."
            />

            <div className="arrow">→</div>

            <Step
              number="4"
              icon="🍃"
              title="Sustain"
              subtitle="for Future"
              text="Cleaner environment for a healthier India."
            />

          </div>

        </section>


        {/* ABOUT */}
        <section className="about-section" id="about">

          <div>
            <span className="section-label">ABOUT MEDISORT</span>

            <h2>
              One platform for
              <br />
              smarter waste management.
            </h2>
          </div>

          <p>
            MediSort connects hospitals, waste collectors and
            administrators through a centralized digital system.
            Waste records can be tracked from generation to
            collection, helping improve transparency and
            operational efficiency.
          </p>

        </section>


        {/* FOOTER */}
        <footer id="contact">

          <div className="footer-brand">

            <span className="footer-logo">✚</span>

            <strong>MediSort</strong>

            <span>|</span>

            Smart Medical Waste Management

          </div>

          <div>
            Together for a Cleaner, Healthier India 🌿

            <span className="footer-divider">|</span>

            SIH Project
          </div>

        </footer>

      </main>

    </div>
  );
}


/* ROLE CARD */
function RoleCard({ icon, title, text, type, onClick }) {
  return (
    <div className={`role-card ${type}`}>

      <div className="role-icon">
        {icon}
      </div>

      <div className="role-content">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <button
        className="role-arrow"
        onClick={onClick}
      >
        →
      </button>

    </div>
  );
}


/* IMPACT ITEM */
function ImpactItem({ icon, title, text }) {
  return (
    <div className="impact-item">

      <div className="impact-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>

    </div>
  );
}


/* WORKFLOW STEP */
function Step({ number, icon, title, subtitle, text }) {
  return (
    <div className="step">

      <div className="step-top">

        <div className="step-number">
          {number}
        </div>

        <div className="step-icon">
          {icon}
        </div>

      </div>

      <h3>{title}</h3>

      <h4>{subtitle}</h4>

      <p>{text}</p>

    </div>
  );
}


export default FrontPage;