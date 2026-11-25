import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  ArrowRight,
  ShieldCheck,
  Microscope
} from "lucide-react";

const conditions = [
  [
    "MEL",
    "Melanoma",
    "A cancer involving pigment-producing cells called melanocytes."
  ],
  [
    "NEV",
    "Melanocytic nevus",
    "A mole formed by a collection of pigment-producing cells; usually benign."
  ],
  [
    "BCC",
    "Basal cell carcinoma",
    "A skin cancer that begins in basal cells in the outer layer of skin."
  ],
  [
    "ACK",
    "Actinic keratosis",
    "A sun-damage-related precancerous skin growth."
  ],
  [
    "SEK",
    "Seborrheic keratosis",
    "A common benign skin growth that can resemble other lesions."
  ],
  [
    "SCC",
    "Squamous cell carcinoma",
    "A skin cancer involving squamous cells in the outer layer of skin."
  ]
];

export default function Home({ user }) {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="dashboard-welcome home-hero">
        <div>
          <span className="eyebrow">WELCOME TO DERMAI</span>

          <h1>
            Understand your skin.
            <br />
            Explore the science.
          </h1>

          <p>
            Hello, {user?.full_name?.split(" ")[0] || "there"}.
            {" "}DermAI is an AI-assisted skin lesion classification
            project. Upload an image, explore model predictions,
            and review a visual explanation in one workspace.
          </p>

          <div className="home-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/scan")}
            >
              <ScanLine size={18} />
              Analyze skin image
            </button>

            <button
              className="btn home-secondary"
              onClick={() => navigate("/dashboard")}
            >
              View dashboard
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="home-grid" aria-label="About DermAI">
        <article className="card">
          <span className="eyebrow">ABOUT THE PROJECT</span>

          <h2>From an image to an understandable report</h2>

          <p>
            DermAI explores how deep learning can classify skin
            lesion photographs into six categories. The results
            page brings together the predicted class, model
            scores, processed image, and Grad-CAM visualization.
          </p>

          <p>
            Review previous scans in your history and download
            a PDF report after analysis.
          </p>
        </article>

        <article className="card">
          <span className="eyebrow">OUR DATASET</span>

          <h2>PAD-UFES-20</h2>

          <p>
            The dataset used for this project contains smartphone
            clinical photographs of skin lesions, with associated
            patient and lesion information.
          </p>

          <div className="dataset-stats">
            <div>
              <strong>2,298</strong>
              <span>Images</span>
            </div>

            <div>
              <strong>1,641</strong>
              <span>Lesions</span>
            </div>

            <div>
              <strong>1,373</strong>
              <span>Patients</span>
            </div>
          </div>

          <p className="muted">
            These are published dataset totals, not your training
            split or performance results. The dataset has unequal
            class sizes.
          </p>

          <a
            className="source-link"
            href="https://doi.org/10.1038/s41597-020-00608-w"
            target="_blank"
            rel="noreferrer"
          >
            Read the original dataset paper ↗
          </a>
        </article>
      </section>

      <section className="home-section">
        <span className="eyebrow">HOW IT WORKS</span>

        <h2>Your analysis, step by step</h2>

        <div className="home-steps">
          {[
            [
              "01",
              "Upload",
              "Choose a clear JPG, PNG, or WebP skin lesion image up to 10 MB."
            ],
            [
              "02",
              "Analyze",
              "Run the model to obtain classification scores and available visual explanations."
            ],
            [
              "03",
              "Review",
              "Explore the report, download a PDF, or revisit it from Scan History."
            ]
          ].map(([number, title, description]) => (
            <article className="card" key={number}>
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <span className="eyebrow">
          SIX CLASSIFICATION LABELS
        </span>

        <h2>What does the model classify?</h2>

        <p className="muted">
          These descriptions explain the labels. A model prediction
          does not confirm that a condition is present.
        </p>

        <div className="condition-grid">
          {conditions.map(([code, name, description]) => (
            <article className="card condition-card" key={code}>
              <span className="condition-code">{code}</span>
              <h3>{name}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <p className="home-source">
          Educational reference:{" "}
          <a
            className="source-link"
            href="https://www.aad.org/public/diseases"
            target="_blank"
            rel="noreferrer"
          >
            American Academy of Dermatology ↗
          </a>
        </p>
      </section>

      <section className="home-grid home-section">
        <article className="card">
          <Microscope size={24} />

          <h2>What does Grad-CAM show?</h2>

          <p>
            Grad-CAM highlights image regions that influenced the
            model's prediction. It helps explain model behavior;
            it is not a precise lesion boundary.
          </p>
        </article>

        <article className="card">
          <ShieldCheck size={24} />

          <h2>Use the results responsibly</h2>

          <p>
            DermAI is a research prototype, not a diagnostic
            service. Model scores are not calibrated clinical
            probabilities. A low score or benign prediction cannot
            rule out a medical concern.
          </p>

          <p>
            Consult a qualified dermatologist for diagnosis
            and treatment.
          </p>
        </article>
      </section>

      <section className="home-cta card">
        <div>
          <h2>Ready to explore an image?</h2>
          <p>Start a scan and review your model's output.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate("/scan")}
        >
          <ScanLine size={18} />
          Analyze skin image
        </button>
      </section>
    </div>
  );
}