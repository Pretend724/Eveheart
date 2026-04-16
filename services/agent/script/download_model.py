import os
from pathlib import Path

# 自动在 项目根目录 创建 models 文件夹
ROOT_DIR = Path(__file__).parent.parent
MODEL_SAVE_DIR = ROOT_DIR / "models"
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)

# 设置缓存目录（必须在 import 前设置）
os.environ["MODELSCOPE_CACHE"] = str(MODEL_SAVE_DIR)
os.environ["HF_HOME"] = str(MODEL_SAVE_DIR)
os.environ["HUGGINGFACE_HUB_CACHE"] = str(MODEL_SAVE_DIR)

from funasr import AutoModel

print("========正在下载模型到项目目录：", MODEL_SAVE_DIR,"=============")

model = AutoModel(
    model="FunAudioLLM/SenseVoiceSmall",
    hub="hf",
    disable_update=True,
    cache_dir=str(MODEL_SAVE_DIR),
)

print("============✅ 模型下载完成！已保存到项目目录===================")