from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
from torchvision import models, transforms
from PIL import Image
import io
import os

try:
    from pest_data import PEST_KNOWLEDGE_BASE
except ImportError:
    PEST_KNOWLEDGE_BASE = {}
    print("cảnh báo: Không tìm thấy file pest_data.py")

app = FastAPI(
    title="Pest Intelligence API",
    description="Hệ thống AI nhận diện và tư vấn điều trị sâu bệnh hại lúa"
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
frontend_origins = [origin.strip() for origin in frontend_origin.split(",") if origin.strip()]
frontend_origin_regex = os.getenv("FRONTEND_ORIGIN_REGEX", r"https://.*\.lhr\.life")
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=frontend_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class_names = ['pest-big', 'round-pest', 'thin_pest']

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = models.resnet50()
num_ftrs = model.fc.in_features
model.fc = torch.nn.Linear(num_ftrs, len(class_names))

MODEL_PATH = 'pest_resnet50.pth'

if os.path.exists(MODEL_PATH):
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        model.to(device)
        model.eval() 
        print("model loaded successfully!")
    except Exception as e:
        print(f"lỗi khi load model: {e}")
else:
    print(f"không tìm thấy file {MODEL_PATH}")

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.get("/")
async def root():
    return {"message": "Pest Detection API is running. Go to /docs for Swagger UI."}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ định dạng JPG hoặc PNG.")

    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert('RGB')
        
        input_tensor = preprocess(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)[0]
            confidence, preds = torch.max(probs, 0)
            
            label = class_names[preds.item()]
            conf_score = confidence.item()

        info = PEST_KNOWLEDGE_BASE.get(label, {
            "vi_name": "Không xác định",
            "danger_level": "N/A",
            "description": "Không có dữ liệu cho loài này.",
            "treatment": "N/A",
            "prevention": "N/A"
        })

        return {
            "status": "success",
            "data": {
                "id": label,
                "name_vi": info.get("vi_name"),
                "confidence": f"{conf_score * 100:.2f}%",
                "danger_level": info.get("danger_level"),
                "details": {
                    "description": info.get("description"),
                    "treatment": info.get("treatment"),
                    "prevention": info.get("prevention")
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)