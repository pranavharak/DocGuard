# DocuGuard AI — Dataset and Pretrained Model Guide

This guide details dataset acquisition, deep learning model architecture, evaluation protocols, and fine-tuning steps for Document Tampering Detection and Localization.

---

## 1. Official Datasets & Licensing

### A. DocTamper Dataset
- **Official Repository / Source**: `https://github.com/DocTamper/DocTamper`
- **Description**: Large-scale benchmark dataset for document image tampering detection and localization containing over 170,000 real and synthetically tampered academic certificates, transcripts, and official receipts with pixel-level ground truth masks.
- **License**: Academic Research License (Non-Commercial).

### B. TALIU Dataset (Text Alignment & Localization for Image Unification)
- **Official Source**: Published research benchmark for text insertion, deletion, and font vector manipulation.
- **Description**: Focused on fine-grained text tampering (CGPA edits, date shifts, font mismatch).
- **License**: Creative Commons Attribution-NonCommercial (CC BY-NC 4.0).

> [!CAUTION]
> Do not commit large dataset zip files or raw `.pth` model weights directly into Git. Use external storage (e.g. AWS S3, Hugging Face Hub, Google Drive) and place downloaded weights into `python-ai/weights/`.

---

## 2. Dataset Preparation & Structure

Structure training and validation data as follows:

```text
dataset/
├── train/
│   ├── images/       (original & tampered document images)
│   ├── masks/        (binary pixel ground-truth masks: 255=tampered, 0=authentic)
│   └── annotations.json
├── val/
│   ├── images/
│   ├── masks/
│   └── annotations.json
└── test/
    ├── images/
    ├── masks/
    └── annotations.json
```

### Data Leakage Prevention
Document verification models easily overfit when near-duplicate document templates (e.g. standard university marksheets with identical layout headers) appear in both train and test splits.
- **Rule**: Split datasets strictly by **template family / institution ID**, ensuring that all document instances from a given template belong exclusively to either train, validation, or test split.

---

## 3. Synthetic Document Tampering Generation

To augment training data, generate synthetic document tampering examples:
1. **Copy-Move Attacks**: Sample text/numbers from one region of a transcript and paste onto another with slight affine transform and Gaussian blur edge blending.
2. **Text Splicing**: Render synthetic text using mismatched font families (e.g. Arial overlay on Times New Roman header).
3. **JPEG Compression Discrepancies**: Save altered sub-regions at different JPEG quality factors (e.g., Q70 region pasted on Q90 background).

---

## 4. Model Training & Evaluation Metrics

### Evaluation Metrics
- **Intersection over Union (IoU)**: Evaluates pixel-level tampering segmentation performance.
- **Precision & Recall**: Evaluates candidate region localization accuracy.
- **F1-Score**: $\text{F1} = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$

### Compute Requirements
- **CPU Inference**: Supported for single-page inspections (PyTorch CPU, ~250ms per page).
- **GPU Training**: NVIDIA GPU with >= 8GB VRAM (e.g. RTX 3060/4090, CUDA 11.8/12.1).

---

## 5. Fine-Tuning Instructions

To fine-tune a model on custom document templates:

```bash
# 1. Place weights in python-ai/weights/
mkdir -p python-ai/weights

# 2. Run PyTorch fine-tuning script
python train_doc_tamper.py \
  --data_dir ./dataset \
  --epochs 20 \
  --batch_size 8 \
  --lr 1e-4 \
  --output_weights python-ai/weights/doc_tampering_model.pth
```

Once `python-ai/weights/doc_tampering_model.pth` exists, the `TamperingModelAdapter` in `services/model_service.py` automatically detects and activates neural network model inference.
