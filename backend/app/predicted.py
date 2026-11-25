import io
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
import matplotlib.cm as cm

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = Path(__file__).resolve().parents[1] / "ml_models" / "best_model.pth"
MODEL_VERSION = "DermAI_MobileNetV3_Large_PAD-UFES-20_v1.0"

CLASS_NAMES = ['MEL', 'NEV', 'BCC', 'ACK', 'SEK', 'SCC']
CLASS_LABELS_DICT = {
    'MEL': 'Melanoma',
    'NEV': 'Melanocytic Nevus',
    'BCC': 'Basal Cell Carcinoma',
    'ACK': 'Actinic Keratosis',
    'SEK': 'Seborrheic Keratosis',
    'SCC': 'Squamous Cell Carcinoma',
}

RISK_MAP = {
    "MEL": {
        "level": "HIGH PRIORITY",
        "note": "Malignant melanoma class in PAD-UFES-20. Prompt dermatological evaluation recommended.",
    },
    "SCC": {
        "level": "HIGH PRIORITY",
        "note": "Squamous cell carcinoma class in PAD-UFES-20. Clinical biopsy and evaluation recommended.",
    },
    "BCC": {
        "level": "MODERATE-HIGH RISK",
        "note": "Basal cell carcinoma class in PAD-UFES-20. Specialist dermatology review recommended.",
    },
    "ACK": {
        "level": "MODERATE RISK",
        "note": "Actinic keratosis (precancerous) class in PAD-UFES-20. Routine clinical check advised.",
    },
    "NEV": {
        "level": "LOW (BENIGN CLASS)",
        "note": "Melanocytic nevus class in PAD-UFES-20. Monitor periodically for ABCDE changes.",
    },
    "SEK": {
        "level": "LOW (BENIGN CLASS)",
        "note": "Seborrheic keratosis class in PAD-UFES-20. Typically benign; consult a doctor if irritated.",
    },
}

inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

class CleanGradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.activation = None
        self.gradient = None
        self.target_layer.register_forward_hook(self._save_activation)
        self.target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, _module, _inp, out):
        self.activation = out.detach()

    def _save_gradient(self, _module, _grad_in, grad_out):
        self.gradient = grad_out[0].detach()

    def generate_overlay_bytes(self, original_pil: Image.Image, input_tensor: torch.Tensor, class_idx: int) -> bytes:
        self.model.eval()
        with torch.set_grad_enabled(True):
            tensor = input_tensor.clone().detach().requires_grad_(True)
            output = self.model(tensor)
            self.model.zero_grad()
            output[0, class_idx].backward()

        weights = self.gradient.mean(dim=(2, 3), keepdim=True)
        cam = F.relu((weights * self.activation).sum(dim=1, keepdim=True))
        cam = cam - cam.min()
        if cam.max() > 0:
            cam = cam / cam.max()

        cam_resized = F.interpolate(cam, size=(224, 224), mode="bilinear", align_corners=False).squeeze().cpu().numpy()
        heatmap_rgba = cm.jet(cam_resized)
        heatmap_rgb = (heatmap_rgba[:, :, :3] * 255).astype(np.uint8)

        orig_resized = np.array(original_pil.resize((224, 224)), dtype=np.float32)
        overlay = np.clip(0.55 * orig_resized + 0.45 * heatmap_rgb, 0, 255).astype(np.uint8)

        buf = io.BytesIO()
        Image.fromarray(overlay).save(buf, format="PNG")
        return buf.getvalue()

def _load_model():
    net = models.mobilenet_v3_large(weights=None)

    # Replace the final classification layer with 6 output classes
    in_features = net.classifier[-1].in_features
    net.classifier[-1] = nn.Linear(in_features, 6)

    # Load your trained model weights
    state_dict = torch.load(
        str(MODEL_PATH),
        map_location=DEVICE
    )

    net.load_state_dict(state_dict)

    net.to(DEVICE)
    net.eval()

    return net


model = _load_model()
grad_cam = CleanGradCAM(model, model.features[-1])

def predict_skin_disease(image_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    preprocessed_pil = img.resize((224, 224))
    prep_buf = io.BytesIO()
    preprocessed_pil.save(prep_buf, format="PNG")
    preprocessed_bytes = prep_buf.getvalue()

    input_tensor = inference_transform(img).unsqueeze(0).to(DEVICE)

    model.eval()
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)

    sorted_probs, sorted_indices = torch.sort(probabilities, dim=1, descending=True)

    all_predictions = []
    for prob, idx in zip(sorted_probs[0], sorted_indices[0]):
        code = CLASS_NAMES[idx.item()]
        all_predictions.append({
            "class_code": code,
            "class_name": CLASS_LABELS_DICT[code],
            "confidence": round(prob.item() * 100, 2),
        })

    top_pred = all_predictions[0]
    top_idx = sorted_indices[0, 0].item()
    gradcam_bytes = grad_cam.generate_overlay_bytes(img, input_tensor, top_idx)
    risk_info = RISK_MAP[top_pred["class_code"]]

    return {
        "predicted_class": top_pred["class_name"],
        "predicted_code": top_pred["class_code"],
        "confidence": top_pred["confidence"],
        "risk_level": risk_info["level"],
        "risk_note": risk_info["note"],
        "top_predictions": all_predictions,
        "preprocessed_bytes": preprocessed_bytes,
        "gradcam_bytes": gradcam_bytes,
        "model_version": MODEL_VERSION,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
