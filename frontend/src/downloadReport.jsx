export async function downloadReport(scan, resolveImage) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    unit: "mm",
    format: "a4"
  });

  const margin = 18;
  let y = 20;

  const clean = value =>
    String(value ?? "Not available")
      .replace(/[^\x20-\x7E\n]/g, " ");

  const room = height => {
    if (y + height > 275) {
      doc.addPage();
      y = 20;
    }
  };

  const text = (value, size = 11, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);

    const lines = doc.splitTextToSize(clean(value), 174);

    for (const line of lines) {
      room(7);
      doc.text(line, margin, y);
      y += 6;
    }

    y += 2;
  };

  const heading = value => {
    room(18);
    y += 4;

    doc.setTextColor(8, 94, 87);
    text(value, 14, true);
    doc.setTextColor(32, 49, 55);
  };

  const score = value =>
    value != null && Number.isFinite(Number(value))
      ? `${Number(value).toFixed(2)}%`
      : "Not available";

  doc.setTextColor(8, 94, 87);
  text("DermAI | Skin analysis report", 22, true);

  doc.setTextColor(32, 49, 55);
  text(`Scan ID: ${scan.id}`);

  const date = new Date(scan.analyzed_at);

  text(
    `Analysis date: ${
      scan.analyzed_at && !Number.isNaN(date.getTime())
        ? date.toLocaleString("en-IN")
        : "Not available"
    }`
  );

  text(
    "Research prototype. This report is not a medical diagnosis.",
    10,
    true
  );

  heading("Primary prediction");

  text(
    `${scan.predicted_class || "Not available"} ` +
      `(${scan.predicted_code || "N/A"})`,
    16,
    true
  );

  text(`Model confidence score: ${score(scan.confidence)}`);
  text(`Model risk label: ${scan.risk_level || "Unspecified"}`);

  if (scan.risk_note) {
    text(scan.risk_note);
  }

  text(
    "Scores are model outputs, not calibrated clinical probabilities. " +
      "Please consult a qualified dermatologist.",
    10
  );

  heading("Class predictions");

  if (
    Array.isArray(scan.top_predictions) &&
    scan.top_predictions.length
  ) {
    scan.top_predictions.forEach(item => {
      text(
        `${item.class_name || item.class_code || "Unknown class"}: ` +
          score(item.confidence)
      );
    });
  } else {
    text("Class scores were not supplied for this scan.");
  }

  heading("Technical information");

  text(`Model version: ${scan.model_version || "Not available"}`);

  text(
    `Original filename: ${
      scan.original_filename || "Not available"
    }`
  );

  const loadImage = url =>
    new Promise(resolve => {
      if (!url) {
        resolve(null);
        return;
      }

      const img = new Image();

      const finish = value => {
        clearTimeout(timer);
        img.onload = null;
        img.onerror = null;
        resolve(value);
      };

      const timer = setTimeout(() => finish(null), 10000);

      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const scale = Math.min(
            1,
            1200 / Math.max(img.naturalWidth, img.naturalHeight)
          );

          const canvas = document.createElement("canvas");

          canvas.width = Math.max(
            1,
            Math.round(img.naturalWidth * scale)
          );

          canvas.height = Math.max(
            1,
            Math.round(img.naturalHeight * scale)
          );

          const ctx = canvas.getContext("2d");

          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          finish({
            data: canvas.toDataURL("image/jpeg", 0.85),
            width: canvas.width,
            height: canvas.height
          });
        } catch {
          finish(null);
        }
      };

      img.onerror = () => finish(null);
      img.src = resolveImage(url);
    });

  const sources = [
    ["Original image", scan.saved_image_url],
    ["Preprocessed image", scan.preprocessed_image_url],
    ["Grad-CAM visualization", scan.gradcam_image_url]
  ];

  const images = await Promise.all(
    sources.map(([, url]) => loadImage(url))
  );

  doc.addPage();
  y = 20;

  heading("Visual analysis");

  let missing = 0;

  sources.forEach(([label], index) => {
    const img = images[index];

    room(75);
    text(label, 12, true);

    if (img) {
      const scale = Math.min(
        174 / img.width,
        55 / img.height
      );

      const width = img.width * scale;
      const height = img.height * scale;

      doc.addImage(
        img.data,
        "JPEG",
        margin,
        y,
        width,
        height
      );

      y += height + 7;
    } else {
      missing++;
      text("Image unavailable in this export.", 10);
    }
  });

  text(
    "Grad-CAM highlights model activation. " +
      "It does not identify a clinical lesion boundary.",
    10
  );

  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(90, 105, 110);

    doc.text(
      `DermAI - Research use | Page ${page} of ${pages}`,
      margin,
      287
    );
  }

  const safeId = String(scan.id ?? "scan")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);

  doc.save(`DermAI_Report_${safeId}.pdf`);

  return missing;
}