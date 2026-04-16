from pathlib import Path
from funasr import AutoModel

def load_voice_model():
    # 当前文件所在目录
    current_dir = Path(__file__).parent

    # 模型本地路径
    model_local_path = current_dir / "models" / "models--FunAudioLLM--SenseVoiceSmall" / "snapshots" / "3eb3b4eeffc2f2dde6051b853983753db33e35c3"

    model = AutoModel(
        model=str(model_local_path),
        disable_update=True,
    )
    return model