@echo off
chcp 65001 >nul
set PY=%LOCALAPPDATA%\Programs\Python\Python313\python.exe
echo Installing PyTorch (CPU) - this can take a few minutes...
"%PY%" -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
"%PY%" -m pip install matplotlib
"%PY%" -c "import torch, torchvision; print('torch', torch.__version__, 'torchvision', torchvision.__version__)"
echo.
echo Starting the job runner. Leave this window open.
"%PY%" "%~dp0runner.py"
pause
